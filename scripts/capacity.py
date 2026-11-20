#!/usr/bin/env python3
"""
Ensaios de capacidade do Cuepoint (reprodutíveis). Só biblioteca padrão do Python; fala com a stack de dev
(docker compose) e com a API em http://localhost:3300 como o operador de plataforma.

Modos:
  upload-memory   pico de memória do WEB ao enviar um arquivo grande: envio direto em partes x caminho antigo
                  (formulário que passa o arquivo pelo servidor).     python3 scripts/capacity.py upload-memory [MB]
  saturation      N transcrições com 1..K workers (WORKERS=1,2,4,6): tempo total, vazão, CPU e speedup.  python3 scripts/capacity.py saturation [N]
  long            uma transcrição longa: tempo, fator de tempo real e pico de memória do worker.   python3 scripts/capacity.py long [MINUTOS]

Requisitos: stack de dev no ar, `.env` com APP_SYSTEM_USER_PASSWORD, `ffmpeg` no container worker, curl no host.
Saída: JSON no final (cole em docs/capacity-report.md).
"""
import http.cookiejar, json, os, re, subprocess, sys, tempfile, threading, time, urllib.parse, urllib.request, uuid

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.environ.get("BASE_URL", "http://localhost:3300")
COMPOSE = ["docker", "compose", "-f", os.path.join(ROOT, "docker-compose.dev.yml")]
FIXTURES = os.path.join(ROOT, "tests", "e2e", "fixtures")


def env_file():
    out = {}
    for line in open(os.path.join(ROOT, ".env"), encoding="utf-8"):
        if "=" in line and not line.lstrip().startswith("#"):
            k, v = line.rstrip("\n").split("=", 1)
            out[k.strip()] = v.strip()
    return out


ENV = env_file()
jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def call(method, path, body=None, headers=None, raw=False):
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json", "Origin": BASE, **(headers or {})}
    req = urllib.request.Request(path if path.startswith("http") else BASE + path, data=data, method=method, headers=h)
    try:
        with opener.open(req) as r:
            payload = r.read()
            return r.status, (payload if raw else (json.loads(payload) if payload else {}))
    except urllib.error.HTTPError as e:
        payload = e.read()
        try:
            return e.code, json.loads(payload)
        except Exception:
            return e.code, {"raw": payload[:200].decode("utf-8", "replace")}


def login():
    form = urllib.parse.urlencode({"email": ENV.get("APP_SYSTEM_USER_EMAIL", "admin@cuepoint.local"), "password": ENV["APP_SYSTEM_USER_PASSWORD"]}).encode()
    req = urllib.request.Request(BASE + "/auth/login?/login", data=form, headers={"Origin": BASE})
    opener.open(req).read()
    assert any(c.name == "session" for c in jar), "login falhou"


def put(url, data, ctype):
    req = urllib.request.Request(url, data=data, method="PUT", headers={"Content-Type": ctype} if ctype else {})
    with urllib.request.urlopen(req) as r:
        return r.status, r.headers.get("ETag")


def mem_mb(text):
    m = re.match(r"([\d.]+)\s*([KMG])i?B", text.strip())
    if not m:
        return 0.0
    v = float(m.group(1))
    return v / 1024 if m.group(2) == "K" else v * 1024 if m.group(2) == "G" else v


class Sampler(threading.Thread):
    """Amostra memória e CPU de um container (docker stats) até ser parado."""
    def __init__(self, name):
        super().__init__(daemon=True)
        self.name, self.stop_evt, self.samples = name, threading.Event(), []

    def run(self):
        while not self.stop_evt.is_set():
            out = subprocess.run(["docker", "stats", "--no-stream", "--format", "{{.MemUsage}}|{{.CPUPerc}}", self.name], capture_output=True, text=True).stdout.strip()
            if "|" in out:
                mem, cpu = out.split("|")
                self.samples.append((mem_mb(mem.split("/")[0]), float(cpu.strip("%") or 0)))

    def stop(self):
        self.stop_evt.set()
        self.join(timeout=10)
        mems = [s[0] for s in self.samples] or [0]
        cpus = [s[1] for s in self.samples] or [0]
        return {"samples": len(mems), "mem_start_mb": round(mems[0], 1), "mem_peak_mb": round(max(mems), 1), "cpu_peak_pct": round(max(cpus), 1), "cpu_avg_pct": round(sum(cpus) / len(cpus), 1)}


def container(service):
    return subprocess.run(COMPOSE + ["ps", "-q", service], capture_output=True, text=True).stdout.split()[0]


def upload_media(path, ctype="audio/wav", multipart_mb=16):
    """Envia mídia direto ao storage (PUT único ou em partes) e devolve a chave."""
    size = os.path.getsize(path)
    if size <= 64 * 1024 ** 2:
        _, plan = call("POST", "/api/uploads", {"kind": "audio", "contentType": ctype, "size": size})
        put(plan["uploadUrl"], open(path, "rb").read(), ctype)
        return plan["key"]
    st, plan = call("POST", "/api/uploads/multipart", {"kind": "audio", "contentType": ctype, "size": size})
    assert st == 200, plan
    etags = []
    with open(path, "rb") as f:
        for part in plan["parts"]:
            _, etag = put(part["url"], f.read(plan["partSize"]), None)
            etags.append({"partNumber": part["partNumber"], "etag": etag})
    st, done = call("POST", "/api/uploads/multipart/complete", {"key": plan["key"], "uploadId": plan["uploadId"], "parts": etags})
    assert st == 200, done
    return plan["key"]


def create_lesson(title, audio_key):
    png = os.path.join(FIXTURES, "pixel.png")
    _, plan = call("POST", "/api/uploads", {"kind": "image", "contentType": "image/png", "size": os.path.getsize(png)})
    put(plan["uploadUrl"], open(png, "rb").read(), "image/png")
    st, body = call("POST", "/api/lessons", {"title": title, "description": "ensaio de capacidade", "audioKey": audio_key, "imageKey": plan["key"]})
    assert st == 201, body
    return body["id"]


def delete_lesson(lesson_id):
    form = urllib.parse.urlencode({"id": lesson_id}).encode()
    try:
        opener.open(urllib.request.Request(BASE + "/admin/lessons?/deleteAction", data=form, headers={"Origin": BASE})).read()
    except Exception:
        pass


def job_status(lesson_id):
    return call("GET", f"/api/jobs/{lesson_id}")[1].get("status")


def wait_all(ids, want="READY", timeout=1800):
    t0 = time.time()
    while time.time() - t0 < timeout:
        states = [job_status(i) for i in ids]
        if all(s == want for s in states):
            return time.time() - t0
        if any(s == "FAILED" for s in states):
            raise RuntimeError(f"job falhou: {states}")
        time.sleep(0.5)
    raise TimeoutError("tempo esgotado")


# --------------------------------------------------------------------------------------------------- modos
def mode_upload_memory(mb=200):
    web = container("web")
    big = os.path.join(tempfile.gettempdir(), f"capacidade-{uuid.uuid4().hex[:6]}.wav")
    with open(big, "wb") as f:
        chunk = b"\x01" * (1024 ** 2)
        for _ in range(mb):
            f.write(chunk)
    ids, result = [], {"file_mb": mb}
    try:
        time.sleep(3)
        base = Sampler(web); base.start(); time.sleep(4); result["web_ocioso"] = base.stop()

        s = Sampler(web); s.start(); t0 = time.time()
        key = upload_media(big)  # envio direto em partes: os bytes vão ao storage, não ao servidor web
        ids.append(create_lesson(f"Capacidade direto {int(t0)}", key))
        result["direto"] = {**s.stop(), "segundos": round(time.time() - t0, 1)}

        time.sleep(3)  # deixa a memória assentar antes do segundo ensaio
        s = Sampler(web); s.start(); t0 = time.time()
        # Caminho antigo: o formulário recebe o arquivo inteiro no servidor (arrayBuffer + Buffer).
        out = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-b", ";".join(f"{c.name}={c.value}" for c in jar),
             "-H", f"Origin: {BASE}", "-F", f"Title=Capacidade antigo {int(t0)}", "-F", "description=ensaio",
             "-F", f"image=@{os.path.join(FIXTURES, 'pixel.png')};type=image/png", "-F", f"audio=@{big};type=audio/wav",
             BASE + "/admin/lessons/create?/createLessonServer"], capture_output=True, text=True)
        result["antigo_pelo_servidor"] = {**s.stop(), "segundos": round(time.time() - t0, 1), "http": out.stdout}
    finally:
        os.remove(big)
        # remove o que o ensaio criou
        rows = subprocess.run(COMPOSE + ["exec", "-T", "db", "sh", "-c", "psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc \"select id from \\\"Lesson\\\" where title like 'Capacidade %'\""], capture_output=True, text=True).stdout.split()
        for lid in rows:
            delete_lesson(lid)
    d, a = result["direto"]["mem_peak_mb"], result["antigo_pelo_servidor"]["mem_peak_mb"]
    result["resumo"] = f"pico do web: direto {d} MB x pelo servidor {a} MB (ocioso {result['web_ocioso']['mem_peak_mb']} MB)"
    return result


def mode_saturation(n=6):
    sample = os.path.join(FIXTURES, "fala.wav")
    ids = [create_lesson(f"Capacidade sat {int(time.time())}-{i}", upload_media(sample)) for i in range(n)]
    result = {"jobs": n, "audio_s": 9}
    try:
        for workers in [int(w) for w in os.environ.get("WORKERS", "1,2").split(",")]:
            subprocess.run(COMPOSE + ["up", "-d", "--scale", f"worker={workers}", "worker"], capture_output=True)
            time.sleep(8)
            ws = [Sampler(c) for c in subprocess.run(COMPOSE + ["ps", "-q", "worker"], capture_output=True, text=True).stdout.split()]
            for w in ws:
                w.start()
            t0 = time.time()
            for i in ids:
                call("POST", f"/api/lessons/{i}/transcription")
            elapsed = wait_all(ids)
            stats = [w.stop() for w in ws]
            result[f"{workers}_worker"] = {
                "segundos_total": round(elapsed, 1), "vazao_jobs_por_min": round(n / elapsed * 60, 1),
                "cpu_pico_por_worker_pct": [s["cpu_peak_pct"] for s in stats], "mem_pico_por_worker_mb": [s["mem_peak_mb"] for s in stats],
            }
        base = result["1_worker"]["segundos_total"]
        for k in [k for k in result if k.endswith("_worker") and k != "1_worker"]:
            t = result[k]["segundos_total"]
            result[k]["speedup_vs_1"] = round(base / t, 2)
    finally:
        subprocess.run(COMPOSE + ["up", "-d", "--scale", "worker=1", "worker"], capture_output=True)
        for i in ids:
            delete_lesson(i)
    return result


def mode_long(minutes=6):
    worker = container("worker")
    reps = max(1, int(minutes * 60 / 9))
    subprocess.run(["docker", "cp", os.path.join(FIXTURES, "fala.wav"), f"{worker}:/tmp/unit.wav"], check=True)
    subprocess.run(COMPOSE + ["exec", "-T", "worker", "sh", "-c", f"rm -f /tmp/list.txt; for i in $(seq {reps}); do echo \"file '/tmp/unit.wav'\" >> /tmp/list.txt; done; ffmpeg -y -nostdin -loglevel error -f concat -safe 0 -i /tmp/list.txt -c copy /tmp/long.wav"], check=True)
    long_path = os.path.join(tempfile.gettempdir(), "long.wav")
    subprocess.run(["docker", "cp", f"{worker}:/tmp/long.wav", long_path], check=True)
    size_mb = round(os.path.getsize(long_path) / 1024 ** 2, 1)
    audio_s = reps * 9
    lid = create_lesson(f"Capacidade longa {int(time.time())}", upload_media(long_path))
    result = {"audio_minutos": round(audio_s / 60, 1), "arquivo_mb": size_mb}
    try:
        s = Sampler(worker); s.start(); t0 = time.time()
        call("POST", f"/api/lessons/{lid}/transcription")
        elapsed = wait_all([lid], timeout=3600)
        stats = s.stop()
        result.update({"segundos": round(elapsed, 1), "fator_tempo_real": round(audio_s / elapsed, 2), "worker": stats})
    finally:
        delete_lesson(lid)
        os.remove(long_path)
    return result


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    arg = float(sys.argv[2]) if len(sys.argv) > 2 else None
    login()
    fn = {"upload-memory": lambda: mode_upload_memory(int(arg or 200)), "saturation": lambda: mode_saturation(int(arg or 6)), "long": lambda: mode_long(arg or 6)}.get(mode)
    if not fn:
        sys.exit(__doc__)
    print(json.dumps(fn(), indent=2, ensure_ascii=False))

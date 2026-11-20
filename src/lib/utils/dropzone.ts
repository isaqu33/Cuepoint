/**
 * Arrastar e soltar para campos <input type="file">.
 * Coloca o arquivo no input e dispara "change", para que os handlers existentes
 * (que leem event.target.files) funcionem igual a um clique.
 */
export function acceptsFile(file: File, accept: string): boolean {
  const rules = accept.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase();
  return rules.some((r) => (r.startsWith('.') ? name.endsWith(r) : file.type.startsWith(r.replace('*', ''))));
}

export function dropInto(input: HTMLInputElement, file: File): void {
  const data = new DataTransfer();
  data.items.add(file);
  input.files = data.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

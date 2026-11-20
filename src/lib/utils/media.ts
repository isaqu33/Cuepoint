/** É vídeo? Usa o tipo de mídia quando conhecido; senão, a extensão do endereço. Função pura. */
export function isVideoMedia(url: string | null | undefined, mime?: string | null): boolean {
  if (mime) return mime.toLowerCase().startsWith('video/');
  const path = (url ?? '').split('?')[0].toLowerCase();
  return /\.(mp4|mov|m4v|mkv)$/.test(path);
}

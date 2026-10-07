/** Resize supported editorial hosts without altering supplier imagery or other URLs. */
export function imageUrl(source: string, width: number) {
  if (source.startsWith('/images/editorial/')) return source.replace(/-\d+\.webp$/, `-${source.includes('/category-') ? (width <= 320 ? 320 : width <= 640 ? 640 : 960) : (width <= 480 ? 480 : width <= 960 ? 960 : 1440)}.webp`);
  try { const url = new URL(source); if (url.hostname === 'images.pexels.com') { url.searchParams.set('w', String(width)); url.searchParams.delete('h'); } return url.toString(); } catch { return source; }
}
export function imageSet(source: string) {
  if (source.startsWith('/images/editorial/')) return (source.includes('/category-') ? [320, 640, 960] : [480, 960, 1440]).map(width => `${imageUrl(source, width)} ${width}w`).join(', ');
  try { if (new URL(source).hostname !== 'images.pexels.com') return undefined; } catch { return undefined; }
  return [240, 480, 960].map(width => `${imageUrl(source, width)} ${width}w`).join(', ');
}

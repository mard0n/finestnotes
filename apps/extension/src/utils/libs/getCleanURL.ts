export function getCleanUrl(url: string) {
  const u = new URL(url);
  return `${u.origin}${u.pathname}`;
}
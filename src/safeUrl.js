// Page content is written by an app's users, so every URL a block puts into an
// href or src goes through here. A javascript: or data: URL in a link is script
// injection; this allows only the schemes a page legitimately links to.

const SAFE_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:'];

export function safeUrl(value) {
  if (typeof value !== 'string') return undefined;
  const url = value.trim();
  if (url === '') return undefined;

  // Relative and fragment links carry no scheme and are safe.
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (url.startsWith('#') || url.startsWith('?')) return url;

  // Browsers ignore embedded whitespace and control characters in a scheme
  // ("java\tscript:"), so strip them before deciding.
  // eslint-disable-next-line no-control-regex -- matching control characters is the point
  const normalized = url.replace(/[\u0000- ]/g, '').toLowerCase();
  const scheme = normalized.match(/^([a-z][a-z0-9+.-]*):/);
  if (!scheme) return undefined;

  return SAFE_SCHEMES.includes(`${scheme[1]}:`) ? url : undefined;
}

// Images: http(s) and relative only.
export function safeImageUrl(value) {
  const url = safeUrl(value);
  if (!url) return undefined;
  return /^(mailto|tel):/i.test(url) ? undefined : url;
}

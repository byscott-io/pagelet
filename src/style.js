import { safeImageUrl } from './safeUrl.js';

// "#ffffff" + 85 -> "rgba(255, 255, 255, 0.85)". Opacity is a percentage,
// clamped to 0-100. Anything that is not a 3- or 6-digit hex color falls back to
// white, so a bad value can never inject CSS.
export function overlayColor(hex, opacityPercent) {
  let value = String(hex ?? '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(value)) value = value.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(value)) value = 'ffffff';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  const opacity = Math.min(100, Math.max(0, Number(opacityPercent) || 0)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// A CSS background-image value for a user-entered URL, or undefined when the
// URL is unsafe. encodeURI escapes the quote that would otherwise close url("").
export function cssImage(url) {
  const safe = safeImageUrl(url);
  return safe ? `url("${encodeURI(safe)}")` : undefined;
}

export const percentField = (label) => ({ type: 'number', label, min: 0, max: 100 });

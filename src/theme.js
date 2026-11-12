// Theme tokens become CSS custom properties on the page wrapper, and every
// built-in block styles itself with var(--pagelet-*). A host app passes its own
// theme object; anything it leaves out falls back to these defaults.
//
// CSS variables rather than a stylesheet because they cross into Puck's editor
// preview iframe with the page itself (the wrapper is the page's root render),
// and they need nothing loaded to work during server-side rendering.

export const defaultTheme = {
  colorText: '#1f2933',
  colorBackground: '#ffffff',
  colorMuted: '#f3f4f6',
  colorAccent: '#2457a6',
  colorAccentText: '#ffffff',
  fontBody: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontHeading: 'inherit',
  radius: '8px',
  maxWidth: '1100px',
  space: '24px',
};

const TOKEN_NAMES = Object.keys(defaultTheme);

// colorAccentText -> --pagelet-color-accent-text
function cssVariableName(token) {
  return `--pagelet-${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

export function themeToStyle(theme = {}) {
  const merged = { ...defaultTheme, ...theme };
  const style = {};
  for (const token of TOKEN_NAMES) {
    style[cssVariableName(token)] = String(merged[token]);
  }
  style.color = 'var(--pagelet-color-text)';
  style.background = 'var(--pagelet-color-background)';
  style.fontFamily = 'var(--pagelet-font-body)';
  return style;
}

export function tokenVar(token) {
  return `var(${cssVariableName(token)})`;
}

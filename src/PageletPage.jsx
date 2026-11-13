import { upgradeDocument } from './document.js';
import { renderPage } from './render.jsx';

// Draw a saved page. Imports nothing from Puck or the editor, so public pages
// stay small, and uses no browser-only API, so it runs in server-side rendering.
export function PageletPage({ document, palette, theme }) {
  if (!palette) throw new Error('pagelet: <PageletPage> needs a palette (see createPalette)');
  const { data } = upgradeDocument(document);
  return renderPage({ config: palette.config, data, metadata: { pageletTheme: theme } });
}

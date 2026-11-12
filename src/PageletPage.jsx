import { Render } from '@puckeditor/core/rsc';
import { upgradeDocument } from './document.js';

// Draw a saved page. Imports nothing from the editor, so public pages stay
// small, and uses no browser-only API, so it runs in server-side rendering.
export function PageletPage({ document, palette, theme }) {
  if (!palette) throw new Error('pagelet: <PageletPage> needs a palette (see createPalette)');
  const { data } = upgradeDocument(document, palette);
  return <Render config={palette.config} data={data} metadata={{ pageletTheme: theme }} />;
}

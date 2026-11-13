import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { embedAllowed } from './blocks/media.jsx';
import { createDocument, pageSettings } from './document.js';
import { createPalette } from './palette.jsx';
import { PageletPage } from './PageletPage.jsx';
import { overlayColor } from './style.js';

// Runs in Node: 0.2.0's blocks and page settings, rendered on the server.
const block = (type, props) => ({ type, props: { id: `${type}-${Math.random().toString(36).slice(2)}`, ...props } });
const page = (content, rootProps = {}) => createDocument({ root: { props: rootProps }, content });
const html = (doc, { palette = createPalette(), theme } = {}) => renderToString(<PageletPage document={doc} palette={palette} theme={theme} />);

describe('0.2.0 blocks', () => {
  it('Quote: italic text with its citation aligned as asked', () => {
    const out = html(page([block('Quote', { text: 'Go therefore and make disciples', citation: 'Matthew 28:19-20 (ESV)', citationAlign: 'right' })]));
    expect(out).toContain('<blockquote');
    expect(out).toContain('font-style:italic');
    expect(out).toMatch(/<figcaption style="text-align:right">Matthew 28:19-20 \(ESV\)<\/figcaption>/);
  });

  it('Icon list: icons as inline SVG, safe links kept and unsafe ones dropped', () => {
    const out = html(page([block('IconList', { align: 'center', items: [
      { icon: 'phone', text: '(937) 652-4020', href: 'tel:+19376524020' },
      { icon: 'location', text: '205 Sceva Ave\nMechanicsburg, OH', href: 'https://maps.example.com/x' },
      { icon: 'link', text: 'Bad link', href: 'javascript:alert(1)' },
      { icon: 'not-an-icon', text: 'No icon', href: '' },
    ] })]));
    expect(out).toContain('href="tel:+19376524020"');
    expect(out).toContain('href="https://maps.example.com/x"');
    expect(out).not.toContain('javascript:');
    expect(out.match(/<svg/g)).toHaveLength(3); // the unknown icon draws nothing
    expect(out).toContain('Bad link'); // the text stays, unlinked
  });

  it('Schedule: one row per entry', () => {
    const out = html(page([block('Schedule', { align: 'center', rows: [
      { day: 'Sunday', time: '9:30', what: 'Bible Study' },
      { day: 'Sunday', time: '10:45', what: 'Morning Worship' },
    ] })]));
    expect(out.match(/<tr>/g)).toHaveLength(2);
    expect(out).toContain('Morning Worship');
  });

  it('Image: right-aligned at a chosen width', () => {
    const out = html(page([block('Image', { url: 'https://example.com/logo.png', alt: 'Logo', align: 'right', width: 40 })]));
    expect(out).toContain('width:40%');
    expect(out).toContain('margin-left:auto');
  });

  it('Image: clamps any width, 0 included, to 10-100%', () => {
    const at = (width) => html(page([block('Image', { url: 'https://example.com/a.png', alt: '', align: 'left', width })]));
    expect(at(0)).toContain('width:10%');
    expect(at(500)).toContain('width:100%');
    expect(at('')).toContain('width:100%');
  });

  it('Text and Heading align right', () => {
    const out = html(page([block('Text', { text: 'Right side', align: 'right' }), block('Heading', { text: 'H', level: 'h2', align: 'right' })]));
    expect(out.match(/text-align:right/g).length).toBeGreaterThanOrEqual(2);
  });

  it('Section: a background image under a panel of the chosen opacity', () => {
    const out = html(page([block('Section', { background: 'none', backgroundImage: 'https://example.com/b.jpg', overlayColor: '#ffffff', overlayOpacity: 85, padding: 'medium', content: [block('Text', { text: 'Inside', align: 'left' })] })]));
    expect(out).toContain('url(&quot;https://example.com/b.jpg&quot;)');
    expect(out).toContain('rgba(255, 255, 255, 0.85)');
    expect(out).toContain('Inside');
  });
});

describe('Embedded page', () => {
  const hosts = ['bfm.sbc.net'];

  it('is not offered unless the app names hosts it trusts', () => {
    expect(createPalette().blocks).not.toContain('Embed');
    expect(createPalette({ embedHosts: hosts }).blocks).toContain('Embed');
  });

  it('embeds only https pages on an allowed host or its subdomains', () => {
    expect(embedAllowed('https://bfm.sbc.net/bfm2000/', hosts)).toBe('https://bfm.sbc.net/bfm2000/');
    expect(embedAllowed('https://www.bfm.sbc.net/x', hosts)).toBe('https://www.bfm.sbc.net/x');
    for (const bad of ['http://bfm.sbc.net/', 'https://evil.example/', 'https://notbfm.sbc.net/', 'https://bfm.sbc.net.evil.example/', 'javascript:alert(1)', '']) {
      expect(embedAllowed(bad, hosts)).toBeUndefined();
    }
  });

  it('renders a sandboxed iframe for an allowed page and nothing otherwise', () => {
    const palette = createPalette({ embedHosts: hosts });
    const allowed = html(page([block('Embed', { url: 'https://bfm.sbc.net/bfm2000/', title: 'Baptist Faith and Message', height: 900 })]), { palette });
    expect(allowed).toContain('<iframe');
    expect(allowed).toContain('sandbox="allow-scripts allow-same-origin allow-popups"');
    expect(allowed).not.toContain('escape-sandbox');
    const refused = html(page([block('Embed', { url: 'https://evil.example/', title: 'x', height: 900 })]), { palette });
    expect(refused).not.toContain('<iframe');
  });
});

describe('page settings', () => {
  const theme = { background: { image: 'https://example.com/building.jpg', overlayColor: '#ffffff', overlayOpacity: 85, rounded: true } };

  it("uses the site's background and overlay by default", () => {
    const out = html(page([block('Text', { text: 'x', align: 'left' })]), { theme });
    expect(out).toContain('url(&quot;https://example.com/building.jpg&quot;)');
    expect(out).toContain('rgba(255, 255, 255, 0.85)');
  });

  it("lets a page keep the site's photo with its own opacity", () => {
    const out = html(page([], { background: 'site', overlayOpacity: 35 }), { theme });
    expect(out).toContain('building.jpg');
    expect(out).toContain('rgba(255, 255, 255, 0.35)');
  });

  it('lets a page use its own background, or none', () => {
    const custom = html(page([], { background: 'custom', backgroundImage: 'https://example.com/other.jpg', overlayColor: '#000', overlayOpacity: 50 }), { theme });
    expect(custom).toContain('other.jpg');
    expect(custom).toContain('rgba(0, 0, 0, 0.5)');
    expect(html(page([], { background: 'none' }), { theme })).not.toContain('pagelet-background');
  });

  it('never puts an unsafe background URL into the page', () => {
    const out = html(page([], { background: 'custom', backgroundImage: 'javascript:alert(1)' }), { theme });
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('pagelet-background');
  });

  it("shows the whole photo inside a card frame when the site asks (Calvary's look)", () => {
    const out = html(page([block('Text', { text: 'x', align: 'left' })]), { theme: { background: { ...theme.background, fit: 'photo', frame: 'card' } } });
    expect(out).toContain('class="pagelet-frame"');
    expect(out).toContain('<img src="https://example.com/building.jpg"');
    expect(out).toContain('grid-area:1 / 1');
  });

  it("exposes the page's title for the browser tab", () => {
    expect(pageSettings(page([], { title: 'Mission' })).title).toBe('Mission');
    expect(pageSettings(null).title).toBe('');
  });
});

describe('overlayColor', () => {
  it('turns a hex color and an opacity percentage into rgba, clamped and safe', () => {
    expect(overlayColor('#336699', 50)).toBe('rgba(51, 102, 153, 0.5)');
    expect(overlayColor('#fff', 150)).toBe('rgba(255, 255, 255, 1)');
    expect(overlayColor('red;}body{display:none', 20)).toBe('rgba(255, 255, 255, 0.2)');
  });
});

describe('theme fontSize', () => {
  const doc = page([block('Text', { text: 'Sized', align: 'left' })]);

  it('sets the page text size from the theme, defaulting to 1rem', () => {
    expect(html(doc)).toMatch(/class="pagelet" style="--pagelet-[^"]*--pagelet-font-size:1rem;[^"]*font-size:var\(--pagelet-font-size\)/);
    expect(html(doc, { theme: { fontSize: '1.25rem' } })).toContain('--pagelet-font-size:1.25rem');
  });

  it('leaves the menu at its own size', async () => {
    const { PageletLayout } = await import('./PageletLayout.jsx');
    const out = renderToString(
      <PageletLayout site={{ theme: { fontSize: '1.25rem' }, menu: { items: [{ label: 'Mission', href: '/mission' }] } }}>
        <PageletPage document={doc} palette={createPalette()} theme={{ fontSize: '1.25rem' }} />
      </PageletLayout>
    );
    const layoutStyle = out.match(/class="pagelet-layout" style="([^"]*)"/)[1];
    expect(layoutStyle).not.toMatch(/(^|;)font-size:/);
  });
});

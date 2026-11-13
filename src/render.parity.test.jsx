import { Render } from '@puckeditor/core/rsc';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createPalette } from './palette.jsx';
import { renderPage } from './render.jsx';

// pagelet's renderer must draw exactly what Puck's would. This test may import
// Puck because tests are not shipped; the renderer itself never does.
const block = (type, props) => ({ type, props: { id: `${type}-${props.key ?? type}`, ...props } });

const data = {
  root: { props: { title: 'Mission', background: 'site', overlayOpacity: 60 } },
  content: [
    block('Hero', { key: 'h', heading: 'Welcome', subheading: 'One\n\nTwo', imageUrl: 'https://example.com/h.jpg', buttonLabel: 'Visit', buttonHref: '/visit' }),
    block('Section', { key: 's', background: 'muted', backgroundImage: 'https://example.com/b.jpg', overlayColor: '#ffffff', overlayOpacity: 85, padding: 'large', content: [
      block('Heading', { key: 'sh', text: 'Inside', level: 'h2', align: 'right' }),
      block('Columns', { key: 'c', count: 3, first: [block('Text', { key: 't1', text: 'A', align: 'left' })], second: [block('Quote', { key: 'q', text: 'Q', citation: 'C', citationAlign: 'right' })], third: [block('Schedule', { key: 'sc', align: 'center', rows: [{ day: 'Sun', time: '10', what: 'W' }] })] }),
    ] }),
    block('IconList', { key: 'il', align: 'left', items: [{ icon: 'phone', text: '555', href: 'tel:+1555' }] }),
    block('Cards', { key: 'cards', items: [{ title: 'T', text: 'X', imageUrl: '', href: '/x' }] }),
    block('Faq', { key: 'f', items: [{ question: 'Q?', answer: 'A.' }] }),
    block('Image', { key: 'i', url: 'https://example.com/a.png', alt: 'A', caption: 'Cap', align: 'right', width: 40 }),
    block('VideoEmbed', { key: 'v', url: 'https://youtu.be/dQw4w9WgXcQ', title: 'V' }),
    block('Embed', { key: 'e', url: 'https://bfm.sbc.net/bfm2000/', title: 'BFM', height: 600 }),
    block('Custom', { key: 'x', label: 'mine' }),
    block('NotInPalette', { key: 'n' }),
  ],
};

const Custom = { category: 'x', fields: { label: { type: 'text' } }, render: ({ label, puck }) => <em>{`${label} editing=${puck.isEditing}`}</em> };
const palette = createPalette({ blocks: { Custom }, embedHosts: ['bfm.sbc.net'] });
const metadata = { pageletTheme: { background: { image: 'https://example.com/site.jpg', fit: 'photo', frame: 'card' } } };

describe("pagelet's renderer", () => {
  it("draws byte-for-byte what Puck's Render draws", () => {
    const ours = renderToString(renderPage({ config: palette.config, data, metadata }));
    const puck = renderToString(<Render config={palette.config} data={data} metadata={metadata} />);
    expect(ours).toBe(puck);
    expect(ours).toContain('mine editing=false'); // a custom block, with the puck prop it expects
  });
});

describe("pagelet's renderer with older DropZone data", () => {
  // A block from before slots: it draws its children with puck.renderDropZone,
  // and they live in data.zones under "<block id>:<zone>".
  const TwoZones = {
    render: ({ puck }) => (
      <div className="two">
        <aside>{puck.renderDropZone({ zone: 'left' })}</aside>
        <main>{puck.renderDropZone({ zone: 'right' })}</main>
      </div>
    ),
  };
  const zonePalette = createPalette({ blocks: { TwoZones } });
  const zoneData = {
    root: { props: {} },
    content: [{ type: 'TwoZones', props: { id: 'tz' } }],
    zones: {
      'tz:left': [{ type: 'Heading', props: { id: 'zh', text: 'Left zone heading', level: 'h2', align: 'left' } }],
      'tz:right': [
        { type: 'Text', props: { id: 'zt', text: 'Right zone text', align: 'left' } },
        { type: 'TwoZones', props: { id: 'nested' } },
      ],
      'nested:left': [{ type: 'Text', props: { id: 'nt', text: 'Nested zone text', align: 'left' } }],
    },
  };

  it("draws a page's zones, byte for byte as Puck does", () => {
    const ours = renderToString(renderPage({ config: zonePalette.config, data: zoneData }));
    const puck = renderToString(<Render config={zonePalette.config} data={zoneData} />);
    expect(ours).toBe(puck);
    for (const text of ['Left zone heading', 'Right zone text', 'Nested zone text']) expect(ours).toContain(text);
  });

  it('draws the zones through PageletPage too, so such a page never renders blank', async () => {
    const { PageletPage } = await import('./PageletPage.jsx');
    const { createDocument } = await import('./document.js');
    const html = renderToString(<PageletPage document={createDocument(zoneData)} palette={zonePalette} />);
    expect(html).toContain('Left zone heading');
    expect(html).toContain('Nested zone text');
  });
});

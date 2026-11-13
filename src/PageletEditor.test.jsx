// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDocument } from './document.js';
import { createPalette } from './palette.jsx';
import { PageletEditor } from './PageletEditor.jsx';

// Browser stand-ins for Puck come from test/setup-dom.js.
afterEach(cleanup);

const doc = createDocument({ root: { props: {} }, content: [{ type: 'Heading', props: { id: 'h1', text: 'Editable heading', level: 'h2', align: 'left' } }] });

describe('PageletEditor', () => {
  it('mounts with the palette, including an app block', async () => {
    const SermonCard = { label: 'Sermon card', category: 'sermons', render: () => <p>sermon</p> };
    const palette = createPalette({ blocks: { SermonCard }, categories: { sermons: { title: 'Sermons' } } });
    let view;
    await act(async () => {
      view = render(<PageletEditor document={doc} palette={palette} headerTitle="Home page" />);
    });
    const text = view.container.textContent;
    expect(text).toContain('Home page');
    expect(text).toContain('Sermon card');
    expect(text).toContain('Hero');
  });

  it('hands onPublish a pagelet document, not bare Puck data', async () => {
    const onPublish = vi.fn();
    let view;
    await act(async () => {
      view = render(<PageletEditor document={doc} palette={createPalette()} onPublish={onPublish} />);
    });
    // Puck draws its Publish control as a styled span, not a <button>.
    const publish = [...view.container.querySelectorAll('[class*="_Button_"]')].find((el) => el.textContent.trim() === 'Publish');
    expect(publish).toBeDefined();
    await act(async () => publish.click());
    expect(onPublish).toHaveBeenCalledTimes(1);
    const saved = onPublish.mock.calls[0][0];
    expect(saved.pagelet).toBe(1);
    expect(saved.data.content[0].props.text).toBe('Editable heading');
  });
});

describe('PageletEditor with older DropZone data', () => {
  const zonesDoc = (type) => createDocument({
    root: { props: {} },
    content: [{ type, props: { id: 'tz' } }],
    zones: { 'tz:left': [{ type: 'Heading', props: { id: 'zh', text: 'Heading from a zone', level: 'h2', align: 'left' } }] },
  });

  // Opens the page and publishes it straight away, returning what the editor
  // hands back: the data as the editor holds it. (Puck draws its preview in an
  // iframe jsdom does not load, so the data is what can be checked here.)
  async function openAndPublish(doc, palette) {
    const onPublish = vi.fn();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    let view;
    await act(async () => { view = render(<PageletEditor document={doc} palette={palette} onPublish={onPublish} />); });
    const publish = [...view.container.querySelectorAll('[class*="_Button_"]')].find((el) => el.textContent.trim() === 'Publish');
    await act(async () => publish.click());
    const migrated = log.mock.calls.some(([message]) => message === 'Migrating DropZones to slots...');
    log.mockRestore();
    return { saved: onPublish.mock.calls[0][0], migrated };
  }

  it("converts a zone to the slot its block now has, through Puck's migrate", async () => {
    const Panel = { fields: { left: { type: 'slot' } }, render: ({ left: Left }) => <div><Left /></div> };
    const { saved, migrated } = await openAndPublish(zonesDoc('Panel'), createPalette({ blocks: { Panel } }));
    expect(migrated).toBe(true);
    expect(saved.data.content[0].props.left[0].props.text).toBe('Heading from a zone');
  });

  it('opens a block that still draws a DropZone as it is, instead of crashing', async () => {
    const TwoZones = { fields: {}, render: ({ puck }) => <div>{puck.renderDropZone({ zone: 'left' })}</div> };
    const { saved } = await openAndPublish(zonesDoc('TwoZones'), createPalette({ blocks: { TwoZones } }));
    expect(saved.data.zones['tz:left'][0].props.text).toBe('Heading from a zone');
  });
});

describe('PageletEditor readOnly', () => {
  it('shows the page but offers no Publish and reports no changes', async () => {
    // Control: the same editor, not read-only, does show Publish.
    let editable;
    await act(async () => { editable = render(<PageletEditor document={createDocument()} palette={createPalette()} onPublish={() => {}} />); });
    expect([...editable.container.querySelectorAll('[class*="_Button_"]')].some((el) => el.textContent.trim() === 'Publish')).toBe(true);
    cleanup();

    const onPublish = vi.fn();
    const onChange = vi.fn();
    let view;
    await act(async () => {
      view = render(<PageletEditor document={createDocument()} palette={createPalette()} onPublish={onPublish} onChange={onChange} readOnly />);
    });
    const publish = [...view.container.querySelectorAll('[class*="_Button_"], button')].filter((el) => el.textContent.trim() === 'Publish');
    expect(publish).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });
});

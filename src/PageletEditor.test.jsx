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

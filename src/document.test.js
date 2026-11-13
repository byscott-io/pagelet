import { describe, expect, it, vi } from 'vitest';
import { DOCUMENT_VERSION, createDocument, upgradeDocument } from './document.js';
import { createPalette } from './palette.jsx';

describe('page documents', () => {
  it('wraps Puck data in a versioned envelope', () => {
    const doc = createDocument({ root: { props: {} }, content: [] });
    expect(doc.pagelet).toBe(DOCUMENT_VERSION);
    expect(doc.data.content).toEqual([]);
  });

  it('treats a missing document as an empty page', () => {
    expect(upgradeDocument(null).data.content).toEqual([]);
  });

  it('adopts bare Puck data an app already holds', () => {
    const bare = { root: { props: {} }, content: [{ type: 'Heading', props: { id: 'h', text: 'Hi' } }] };
    const doc = upgradeDocument(bare);
    expect(doc.pagelet).toBe(DOCUMENT_VERSION);
    expect(doc.data.content[0].props.text).toBe('Hi');
  });

  it('refuses a page saved by a newer pagelet instead of guessing', () => {
    expect(() => upgradeDocument({ pagelet: DOCUMENT_VERSION + 1, data: {} })).toThrow(/newer pagelet/);
  });

  it('refuses something that is not a page', () => {
    expect(() => upgradeDocument('page')).toThrow(TypeError);
    expect(() => upgradeDocument({ title: 'x' })).toThrow(/not a page document/);
  });

  it('leaves current-format pages alone, so rendering logs nothing', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const data = { root: { props: { title: 'Home' } }, content: [], zones: {} };
    expect(upgradeDocument({ pagelet: 1, data }, createPalette()).data).toEqual(data);
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('moves an old-style root (fields beside props) into props, without Puck', () => {
    const doc = upgradeDocument({ pagelet: 1, data: { root: { title: 'Old' }, content: [] } });
    expect(doc.data.root.props.title).toBe('Old');
  });
});

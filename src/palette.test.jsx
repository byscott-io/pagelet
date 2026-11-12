import { describe, expect, it } from 'vitest';
import { builtInBlocks } from './blocks/index.js';
import { createPalette } from './palette.jsx';

const Custom = { label: 'Custom', category: 'special', fields: {}, render: () => <p>custom</p> };

describe('createPalette', () => {
  it('offers every built-in block by default', () => {
    expect(createPalette().blocks).toEqual(Object.keys(builtInBlocks));
  });

  it('groups built-in blocks into Layout, Content and Media', () => {
    const { categories } = createPalette().config;
    expect(Object.keys(categories)).toEqual(['layout', 'content', 'media']);
    expect(categories.media.title).toBe('Media');
    expect(categories.layout.components).toContain('Section');
  });

  it("adds an app's own blocks beside the built-in ones", () => {
    const palette = createPalette({ blocks: { Custom }, categories: { special: { title: 'Special' } } });
    expect(palette.blocks).toContain('Custom');
    expect(palette.blocks).toContain('Heading');
    expect(palette.config.components.Custom).not.toHaveProperty('category');
    // App-declared categories come first.
    expect(Object.keys(palette.config.categories)[0]).toBe('special');
    expect(palette.config.categories.special).toEqual({ title: 'Special', components: ['Custom'] });
  });

  it('files a block with no category under "other"', () => {
    const palette = createPalette({ blocks: { Loose: { render: () => null } } });
    expect(palette.config.categories.other.components).toEqual(['Loose']);
  });

  it('hides built-in blocks an app does not want', () => {
    const palette = createPalette({ hide: ['Faq', 'Cards'] });
    expect(palette.blocks).not.toContain('Faq');
    expect(palette.config.categories.content.components).not.toContain('Cards');
  });

  it('refuses to hide a block that does not exist, so a typo is not silent', () => {
    expect(() => createPalette({ hide: ['Fqa'] })).toThrow(/unknown block "Fqa"/);
  });

  it('lets an app replace a built-in block by name', () => {
    const Heading = { label: 'Fancy heading', category: 'content', render: () => <h2>fancy</h2> };
    expect(createPalette({ blocks: { Heading } }).config.components.Heading.label).toBe('Fancy heading');
  });

  it('refuses a block with no render function', () => {
    expect(() => createPalette({ blocks: { Broken: { label: 'Broken' } } })).toThrow(/needs a render function/);
  });
});

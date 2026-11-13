import { describe, expect, it } from 'vitest';
import { paletteCatalog } from './catalog.js';
import { createPalette } from './palette.jsx';

const SermonArchive = { label: 'Sermon archive', category: 'church', description: 'The sermon list and player.', fields: {}, render: () => null };
const catalog = paletteCatalog(createPalette({
  blocks: { SermonArchive },
  categories: { church: { title: 'Church' } },
  embedHosts: ['bfm.sbc.net'],
  hide: ['Faq'],
}));

describe('paletteCatalog', () => {
  it('lists every offered block, app blocks included, and not hidden ones', () => {
    expect(catalog.blocks.SermonArchive).toEqual({ label: 'Sermon archive', category: 'church', description: 'The sermon list and player.', fields: {}, defaultProps: {} });
    expect(catalog.blocks.Embed.category).toBe('media');
    expect(catalog.blocks.Faq).toBeUndefined();
    expect(catalog.categories.church).toBe('Church');
  });

  it('describes field types, choices, limits, list items and slots', () => {
    const { fields } = catalog.blocks.IconList;
    expect(fields.align.options.map((o) => o.value)).toEqual(['left', 'center', 'right']);
    expect(fields.items.type).toBe('array');
    expect(fields.items.itemFields.icon.options.map((o) => o.value)).toContain('phone');
    expect(fields.items.defaultItem).toEqual({ icon: 'link', text: '', href: '' });
    expect(catalog.blocks.Embed.fields.height).toMatchObject({ type: 'number', min: 200, max: 4000 });
    expect(catalog.blocks.Section.fields.content.type).toBe('slot');
    expect(catalog.page.fields.background.options.map((o) => o.value)).toEqual(['site', 'custom', 'none']);
  });

  it('is plain JSON', () => {
    expect(JSON.parse(JSON.stringify(catalog))).toEqual(catalog);
  });
});

describe('the Ruby specs\' catalog fixture', () => {
  it('matches what paletteCatalog writes today (run node scripts/write-test-catalog.mjs after a block change)', async () => {
    const { readFileSync } = await import('node:fs');
    const SermonArchive = { label: 'Sermon archive', category: 'church', fields: {}, render: () => null };
    const current = paletteCatalog(createPalette({ blocks: { SermonArchive }, categories: { church: { title: 'Church' } }, embedHosts: ['bfm.sbc.net'] }));
    expect(JSON.parse(readFileSync('spec/fixtures/catalog.json', 'utf8'))).toEqual(current);
  });
});

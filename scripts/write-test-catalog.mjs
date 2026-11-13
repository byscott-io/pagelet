// Writes spec/fixtures/catalog.json, the block catalog the Ruby tool specs
// read, from the built package: the palette an app with one block of its own
// and one embed host would have. src/catalog.test.js fails if it is stale.
import { writeFileSync } from 'node:fs';
import { createPalette, paletteCatalog } from '../dist/index.js';

export const testPalette = () => createPalette({
  blocks: { SermonArchive: { label: 'Sermon archive', category: 'church', fields: {}, render: () => null } },
  categories: { church: { title: 'Church' } },
  embedHosts: ['bfm.sbc.net'],
});

if (process.argv[1]?.endsWith('write-test-catalog.mjs')) {
  writeFileSync('spec/fixtures/catalog.json', `${JSON.stringify(paletteCatalog(testPalette()), null, 2)}\n`);
  console.log('wrote spec/fixtures/catalog.json');
}

// Fails the build if the public renderer bundle imports Puck's editor.
//
// The renderer must import Puck only through "@puckeditor/core/rsc", which has
// no editor in it. One stray import of the main entry would put the whole
// editor (drag and drop, rich text) into every public page, and nothing else
// would notice.
import { readFileSync } from 'node:fs';

let failed = false;
for (const file of ['dist/index.js', 'dist/index.cjs']) {
  const code = readFileSync(file, 'utf8');
  const puckImports = [...code.matchAll(/['"](@puckeditor\/core[^'"]*)['"]/g)].map((m) => m[1]);
  const bad = puckImports.filter((spec) => spec !== '@puckeditor/core/rsc');
  if (bad.length) {
    console.error(`${file} imports the Puck editor: ${[...new Set(bad)].join(', ')}`);
    failed = true;
  } else {
    console.log(`${file}: Puck imported only via @puckeditor/core/rsc (${puckImports.length} import(s))`);
  }
}
process.exit(failed ? 1 : 0);

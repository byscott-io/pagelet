// Fails the build if the public renderer bundle carries the editor, or grows
// past its budget.
//
// 1. dist/index.* must not import @puckeditor/core AT ALL. Even Puck's "rsc"
//    renderer pulls in Tiptap and ProseMirror (about 350 KB minified), which
//    0.2.0 shipped to every visitor before this check measured anything.
// 2. Bundled and minified with React external, as an app's bundler would, the
//    renderer must stay under BUDGET_BYTES. A size check rather than an import
//    check alone, because a heavy dependency can arrive through any import.
import { readFileSync, rmSync } from 'node:fs';
import { buildSync } from 'esbuild';

const BUDGET_BYTES = 80_000;
let failed = false;

for (const file of ['dist/index.js', 'dist/index.cjs']) {
  const code = readFileSync(file, 'utf8');
  const puck = [...new Set([...code.matchAll(/['"](@puckeditor\/core[^'"]*)['"]/g)].map((m) => m[1]))];
  if (puck.length) {
    console.error(`${file} imports Puck (${puck.join(', ')}); the renderer must not`);
    failed = true;
  } else {
    console.log(`${file}: no Puck import`);
  }
}

const out = 'dist/.size-check.js';
buildSync({
  stdin: { contents: "export * from './index.js';", resolveDir: 'dist', loader: 'js' },
  bundle: true,
  minify: true,
  format: 'esm',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  outfile: out,
  logLevel: 'error',
});
const size = readFileSync(out).length;
rmSync(out);
if (size > BUDGET_BYTES) {
  console.error(`renderer bundle is ${size} bytes minified, over the ${BUDGET_BYTES} budget`);
  failed = true;
} else {
  console.log(`renderer bundle: ${size} bytes minified (budget ${BUDGET_BYTES})`);
}
process.exit(failed ? 1 : 0);

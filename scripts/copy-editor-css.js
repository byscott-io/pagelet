// Ship Puck's editor stylesheet as @byscott-io/pagelet/editor.css, so apps
// import styles from pagelet and never reference Puck directly.
import { copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const puckDir = dirname(require.resolve('@puckeditor/core/package.json'));
copyFileSync(join(puckDir, 'dist', 'index.css'), 'dist/editor.css');
console.log('dist/editor.css copied from @puckeditor/core');

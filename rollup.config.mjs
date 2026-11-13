import resolve from '@rollup/plugin-node-resolve';
import esbuild from 'rollup-plugin-esbuild';

// Two entry points, built separately so the renderer never pulls in the editor:
//   @byscott-io/pagelet         -> dist/index.{js,cjs}   (public pages)
//   @byscott-io/pagelet/editor  -> dist/editor.{js,cjs}  (admin screens)
// React and Puck stay external: the app resolves exactly one copy of each.
// (Only the editor entry imports Puck at all; see scripts/check-entry-split.js.)
const external = (id) => /^(react|react-dom|@puckeditor\/core)(\/|$)/.test(id);

const plugins = [
  resolve({ extensions: ['.js', '.jsx'] }),
  esbuild({ include: /\.jsx?$/, jsx: 'automatic', target: 'es2020', sourceMap: true }),
];

export default ['index', 'editor'].map((entry) => ({
  input: `src/${entry}.js`,
  external,
  plugins,
  output: [
    { file: `dist/${entry}.js`, format: 'esm', sourcemap: true },
    { file: `dist/${entry}.cjs`, format: 'cjs', sourcemap: true, exports: 'named' },
  ],
}));

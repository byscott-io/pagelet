import { builtInBlocks, builtInCategories } from './blocks/index.js';
import { ThemeRoot } from './ThemeRoot.jsx';

// Build the palette an app uses for both editing and rendering.
//
//   createPalette({
//     blocks: { SermonPlayer: { label, category: 'media', fields, render } },
//     hide: ['Faq'],
//     categories: { sermons: { title: 'Sermons' } },
//   })
//
// A block is a Puck component config plus an optional `category`. App blocks
// sit beside the built-in ones; an app block with a built-in block's name
// replaces it, which is how an app restyles a standard block.
export function createPalette({ blocks = {}, hide = [], categories = {}, root = {} } = {}) {
  const hidden = new Set(hide);
  for (const name of hidden) {
    if (!(name in builtInBlocks) && !(name in blocks)) {
      throw new Error(`pagelet: cannot hide unknown block "${name}"`);
    }
  }

  const all = { ...builtInBlocks, ...blocks };
  const components = {};
  const membership = {};

  for (const [name, block] of Object.entries(all)) {
    if (hidden.has(name)) continue;
    if (typeof block?.render !== 'function') {
      throw new Error(`pagelet: block "${name}" needs a render function`);
    }
    const { category = 'other', ...component } = block;
    components[name] = component;
    (membership[category] ??= []).push(name);
  }

  const categoryInfo = { ...builtInCategories, ...categories };
  const puckCategories = {};
  // Categories the app declared come first, in declaration order, then the rest.
  const order = [...new Set([...Object.keys(categories), ...Object.keys(builtInCategories), ...Object.keys(membership)])];
  for (const category of order) {
    if (!membership[category]) continue;
    puckCategories[category] = { title: categoryInfo[category]?.title ?? category, components: membership[category] };
  }

  return {
    blocks: Object.keys(components),
    config: {
      components,
      categories: puckCategories,
      root: {
        ...root,
        // The page's root render applies the theme. It is the root of the
        // editor's preview iframe as well as of a rendered page, so the theme
        // reaches both. Pages receive it through Puck's metadata.
        render: ({ children, puck }) => <ThemeRoot theme={puck?.metadata?.pageletTheme}>{children}</ThemeRoot>,
      },
    },
  };
}

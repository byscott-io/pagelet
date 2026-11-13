import { builtInBlocks, builtInCategories } from './blocks/index.js';
import { makeEmbed } from './blocks/media.jsx';
import { percentField } from './style.js';
import { ThemeRoot } from './ThemeRoot.jsx';

// Settings for the whole page (Puck's root fields). Stored in every saved page:
// add fields freely, never rename one.
export const pageFields = {
  title: { type: 'text', label: 'Page title (browser tab)' },
  background: {
    type: 'radio',
    label: 'Background',
    options: [
      { label: "Site's", value: 'site' },
      { label: 'Custom', value: 'custom' },
      { label: 'None', value: 'none' },
    ],
  },
  backgroundImage: { type: 'text', label: 'Custom background image URL' },
  overlayColor: { type: 'text', label: 'Custom overlay color (hex)' },
  overlayOpacity: percentField('Overlay opacity % (blank uses the site setting)'),
};

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
//   embedHosts: ['bfm.sbc.net'] offers the Embedded page block, limited to those
//   hosts (and their subdomains). Without it the block is not offered at all.
export function createPalette({ blocks = {}, hide = [], categories = {}, root = {}, embedHosts = [] } = {}) {
  const builtIns = embedHosts.length ? { ...builtInBlocks, Embed: makeEmbed(embedHosts) } : builtInBlocks;
  const hidden = new Set(hide);
  for (const name of hidden) {
    if (!(name in builtIns) && !(name in blocks)) {
      throw new Error(`pagelet: cannot hide unknown block "${name}"`);
    }
  }

  const all = { ...builtIns, ...blocks };
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
        defaultProps: { title: '', background: 'site', backgroundImage: '', overlayColor: '#ffffff' },
        ...root,
        fields: { ...pageFields, ...(root.fields ?? {}) },
        // The page's root render applies the theme and the background. It is
        // the root of the editor's preview iframe as well as of a rendered
        // page, so both reach the editor. The site theme arrives through
        // Puck's metadata; the page's own settings are this render's props.
        render: ({ children, puck, title, background, backgroundImage, overlayColor, overlayOpacity }) => (
          <ThemeRoot
            theme={puck?.metadata?.pageletTheme}
            page={{ title, background, backgroundImage, overlayColor, overlayOpacity: blankToUndefined(overlayOpacity) }}
          >
            {children}
          </ThemeRoot>
        ),
      },
    },
  };
}

// A cleared number field arrives as '' or null: treat it as "use the site's".
function blankToUndefined(value) {
  return value === '' || value === null || value === undefined ? undefined : value;
}

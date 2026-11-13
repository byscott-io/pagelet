// A palette as plain JSON: every block an app offers (built-in and its own),
// with each field's type, label and allowed values, and the defaults. The
// server cannot import the palette (it is JavaScript, and blocks render
// React), so an app writes this out at build time and the Rails engine reads
// it: Pagelet::Catalog checks AI-written pages against it, and the AI tools
// show it to the model, so neither can drift from what the editor offers.
//
//   writeFileSync('pagelet-catalog.json', JSON.stringify(paletteCatalog(palette)));
export const CATALOG_VERSION = 1;

export function paletteCatalog(palette) {
  if (!palette?.config) throw new Error('pagelet: paletteCatalog needs a palette (see createPalette)');
  const { components, categories, root } = palette.config;

  const categoryOf = {};
  const categoryTitles = {};
  for (const [key, { title, components: names }] of Object.entries(categories ?? {})) {
    categoryTitles[key] = title;
    for (const name of names) categoryOf[name] = key;
  }

  const blocks = {};
  for (const [name, component] of Object.entries(components)) {
    blocks[name] = {
      label: component.label ?? name,
      category: categoryOf[name] ?? 'other',
      ...(component.description ? { description: component.description } : {}),
      fields: describeFields(component.fields),
      defaultProps: plain(component.defaultProps ?? {}),
    };
  }

  return {
    catalog: CATALOG_VERSION,
    categories: categoryTitles,
    page: { fields: describeFields(root?.fields), defaultProps: plain(root?.defaultProps ?? {}) },
    blocks,
  };
}

function describeFields(fields = {}) {
  const out = {};
  for (const [name, field] of Object.entries(fields)) out[name] = describeField(field);
  return out;
}

function describeField(field = {}) {
  const described = { type: field.type ?? 'unknown' };
  if (field.label) described.label = field.label;
  switch (field.type) {
    case 'number':
      if (field.min !== undefined) described.min = field.min;
      if (field.max !== undefined) described.max = field.max;
      break;
    case 'select':
    case 'radio':
      described.options = (field.options ?? []).map(({ label, value }) => ({ label, value }));
      break;
    case 'array':
      described.itemFields = describeFields(field.arrayFields);
      described.defaultItem = plain(field.defaultItemProps ?? {});
      break;
    case 'object':
      described.objectFields = describeFields(field.objectFields);
      break;
    case 'text':
    case 'textarea':
    case 'slot':
      break;
    default:
      // A custom field draws its own editor; nothing here can say what it holds.
      described.type = 'unsupported';
  }
  return described;
}

// JSON-safe copy: functions and undefined dropped.
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

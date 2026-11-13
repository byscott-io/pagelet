import { Fragment } from 'react';

// pagelet's own page renderer: walks a saved page and draws each block with the
// component its palette registered. It mirrors what Puck's Render passes to a
// block (its saved props, slots as components, a `puck` object with isEditing
// false, the metadata and renderDropZone), and imports nothing from Puck.
//
// Why not Puck's own renderer: @puckeditor/core/rsc pulls in Tiptap and
// ProseMirror (about 350 KB minified) even for pages with no rich text, and the
// renderer is what every visitor downloads. The editor still uses Puck.
//
// Supports blocks, slot fields (Section, Columns), and DropZones (older Puck
// data: a block calls puck.renderDropZone({ zone }) and the blocks come from
// data.zones["<block id>:<zone>"]). render.parity.test.jsx holds the output to
// Puck's, byte for byte.
const ROOT_ZONE = 'root:default-zone';

function slotNames(component) {
  return Object.entries(component.fields ?? {})
    .filter(([, field]) => field?.type === 'slot')
    .map(([name]) => name);
}

function renderItems(items, context) {
  return (Array.isArray(items) ? items : []).map((item, index) => (
    <Fragment key={item?.props?.id ?? index}>{renderItem(item, context)}</Fragment>
  ));
}

// The `puck` prop for one area (a block, or the root). Its renderDropZone draws
// that area's zones, as Puck's does: no wrapper, just the blocks.
function puckFor(areaId, context) {
  return {
    isEditing: false,
    metadata: context.metadata,
    dragRef: null,
    renderDropZone: ({ zone }) => {
      const compound = `${areaId}:${zone}`;
      const items = compound === ROOT_ZONE ? context.data.content : context.data.zones?.[compound];
      return <>{renderItems(items, context)}</>;
    },
  };
}

function renderItem(item, context) {
  const component = item && context.config.components[item.type];
  if (!component) return null; // a block this palette does not have draws nothing

  const props = { ...item.props, puck: puckFor(item.props?.id, context) };
  for (const name of slotNames(component)) {
    const children = item.props?.[name];
    // A slot reaches the block as a component, as in Puck: <Content />. Like
    // Puck's, it draws a <div> around its blocks, taking any className and
    // style the block passes.
    props[name] = function Slot({ className, style }) {
      return (
        <div className={className} style={style}>
          {renderItems(children, context)}
        </div>
      );
    };
  }
  const Render = component.render;
  return <Render {...props} />;
}

export function renderPage({ config, data, metadata = {} }) {
  const context = { config, data: data ?? {}, metadata };
  const puck = puckFor('root', context);
  const rootProps = data?.root?.props ?? {};
  const content = renderItems(data?.content, context);
  const RootRender = config.root?.render;
  if (!RootRender) return <>{content}</>;
  return (
    <RootRender {...rootProps} title={rootProps.title || ''} editMode={false} id="puck-root" puck={puck}>
      {content}
    </RootRender>
  );
}

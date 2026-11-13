import { Fragment } from 'react';

// pagelet's own page renderer: walks a saved page and draws each block with the
// component its palette registered. It mirrors what Puck's Render passes to a
// block (its saved props, slots as components, a `puck` object with isEditing
// false and the metadata), and imports nothing from Puck.
//
// Why not Puck's own renderer: @puckeditor/core/rsc pulls in Tiptap and
// ProseMirror (about 350 KB minified) even for pages with no rich text, and the
// renderer is what every visitor downloads. The editor still uses Puck.
//
// Supported: blocks, nested slot fields (Section, Columns), the root render.
// Not supported: legacy DropZone zones, which pagelet has never written; the
// editor converts them (see PageletEditor).

function slotNames(component) {
  return Object.entries(component.fields ?? {})
    .filter(([, field]) => field?.type === 'slot')
    .map(([name]) => name);
}

function renderItems(items, config, puck) {
  return (Array.isArray(items) ? items : []).map((item, index) => (
    <Fragment key={item?.props?.id ?? index}>{renderItem(item, config, puck)}</Fragment>
  ));
}

function renderItem(item, config, puck) {
  const component = item && config.components[item.type];
  if (!component) return null; // a block this palette does not have draws nothing

  const props = { ...item.props, puck };
  for (const name of slotNames(component)) {
    const children = item.props?.[name];
    // A slot reaches the block as a component, as in Puck: <Content />. Like
    // Puck's, it draws a <div> around its blocks, taking any className and
    // style the block passes (render.parity.test.jsx holds this to Puck's HTML).
    props[name] = function Slot({ className, style }) {
      return (
        <div className={className} style={style}>
          {renderItems(children, config, puck)}
        </div>
      );
    };
  }
  const Render = component.render;
  return <Render {...props} />;
}

export function renderPage({ config, data, metadata = {} }) {
  const puck = { isEditing: false, metadata, dragRef: null, renderDropZone: () => null };
  const rootProps = data?.root?.props ?? {};
  const content = renderItems(data?.content, config, puck);
  const RootRender = config.root?.render;
  if (!RootRender) return <>{content}</>;
  return (
    <RootRender {...rootProps} title={rootProps.title || ''} editMode={false} id="puck-root" puck={puck}>
      {content}
    </RootRender>
  );
}

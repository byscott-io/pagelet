import { Puck, migrate } from '@puckeditor/core';
import { createDocument, needsPuckMigration, upgradeDocument } from './document.js';

// The visual editor. Import from "@byscott-io/pagelet/editor" (and its
// stylesheet from "@byscott-io/pagelet/editor.css") in admin screens only.
//
// onPublish and onChange receive a pagelet document, ready to store as-is.
//
// readOnly shows the page without letting it change: nothing can be added,
// moved, edited or deleted, and onChange and onPublish are never called. For
// looking at an older published version; only the draft is edited.
export function PageletEditor({ document, palette, theme, onPublish, onChange, headerTitle, readOnly = false, ...rest }) {
  if (!palette) throw new Error('pagelet: <PageletEditor> needs a palette (see createPalette)');
  const data = editorData(document, palette);
  return (
    <Puck
      {...rest}
      config={palette.config}
      data={data}
      metadata={{ pageletTheme: theme }}
      headerTitle={headerTitle}
      permissions={readOnly ? READ_ONLY : rest.permissions}
      overrides={readOnly ? { ...rest.overrides, headerActions: () => null } : rest.overrides}
      onPublish={onPublish && !readOnly ? (next) => onPublish(createDocument(next)) : undefined}
      onChange={onChange && !readOnly ? (next) => onChange(createDocument(next)) : undefined}
    />
  );
}

const READ_ONLY = { drag: false, duplicate: false, delete: false, edit: false, insert: false };

// Older Puck data (DropZone zones) is converted to slots here, in the editor,
// where Puck is loaded anyway; the public renderer never imports Puck.
//
// Puck's migrate() only converts a zone whose block now has a slot field of the
// same name, and THROWS otherwise. A block that still draws a DropZone is fine
// as it is (Puck's editor and pagelet's renderer both draw zones), so then the
// data opens unconverted rather than crashing the editor.
function editorData(document, palette) {
  const data = upgradeDocument(document).data;
  if (!needsPuckMigration(document?.data ?? document ?? {})) return data;
  try {
    return migrate(data, palette.config);
  } catch {
    return data;
  }
}

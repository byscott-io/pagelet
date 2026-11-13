import { Puck, migrate } from '@puckeditor/core';
import { createDocument, needsPuckMigration, upgradeDocument } from './document.js';

// The visual editor. Import from "@byscott-io/pagelet/editor" (and its
// stylesheet from "@byscott-io/pagelet/editor.css") in admin screens only.
//
// onPublish and onChange receive a pagelet document, ready to store as-is.
export function PageletEditor({ document, palette, theme, onPublish, onChange, headerTitle, ...rest }) {
  if (!palette) throw new Error('pagelet: <PageletEditor> needs a palette (see createPalette)');
  const data = editorData(document, palette);
  return (
    <Puck
      {...rest}
      config={palette.config}
      data={data}
      metadata={{ pageletTheme: theme }}
      headerTitle={headerTitle}
      onPublish={onPublish ? (next) => onPublish(createDocument(next)) : undefined}
      onChange={onChange ? (next) => onChange(createDocument(next)) : undefined}
    />
  );
}

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

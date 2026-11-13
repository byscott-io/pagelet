import { Puck, migrate } from '@puckeditor/core';
import { createDocument, needsPuckMigration, upgradeDocument } from './document.js';

// The visual editor. Import from "@byscott-io/pagelet/editor" (and its
// stylesheet from "@byscott-io/pagelet/editor.css") in admin screens only.
//
// onPublish and onChange receive a pagelet document, ready to store as-is.
export function PageletEditor({ document, palette, theme, onPublish, onChange, headerTitle, ...rest }) {
  if (!palette) throw new Error('pagelet: <PageletEditor> needs a palette (see createPalette)');
  const raw = upgradeDocument(document).data;
  // Older Puck shapes (DropZone zones) are converted here, in the editor, where
  // Puck is loaded anyway; the public renderer never imports it.
  const data = needsPuckMigration(document?.data ?? document ?? {}) ? migrate(raw, palette.config) : raw;
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

// What an app stores for a page: Puck's data inside an envelope that carries
// pagelet's own format version. The version lets a stored page be upgraded when
// pagelet or Puck changes shape, so apps never hold raw Puck data whose format
// they do not control.
export const DOCUMENT_VERSION = 1;

export function emptyData() {
  return { root: { props: {} }, content: [] };
}

export function createDocument(data = emptyData()) {
  return { pagelet: DOCUMENT_VERSION, data };
}

// Bring a stored document up to the current format.
//
// Accepts bare Puck data too, since an app adopting pagelet may already hold
// some. Imports nothing from Puck, because the public renderer uses this: an
// old root shape (fields beside "props") is converted here, and DropZone zones,
// which pagelet never wrote, are converted by the editor (needsPuckMigration).
export function upgradeDocument(document) {
  if (document == null) return createDocument();
  if (typeof document !== 'object') {
    throw new TypeError('pagelet: a page document must be an object');
  }

  let doc = document;
  if (!('pagelet' in doc)) {
    if (!('content' in doc) && !('root' in doc)) {
      throw new TypeError('pagelet: not a page document (no "pagelet" version and no Puck data)');
    }
    doc = createDocument(doc);
  }

  if (doc.pagelet > DOCUMENT_VERSION) {
    throw new Error(
      `pagelet: this page was saved by a newer pagelet (format ${doc.pagelet}); ` +
        `this version reads up to format ${DOCUMENT_VERSION}. Upgrade @byscott-io/pagelet.`,
    );
  }

  // Format migrations go here, one step per version:
  //   if (doc.pagelet === 1) doc = migrateV1toV2(doc);

  const data = { ...emptyData(), ...doc.data };
  return createDocument({ ...data, root: upgradeRoot(data.root) });
}

// Puck once kept root fields beside "props" ({ title } rather than
// { props: { title } }). Move any such fields into props.
function upgradeRoot(root = {}) {
  const { props = {}, readOnly, ...legacy } = root;
  if (Object.keys(legacy).length === 0) return root;
  return { ...(readOnly ? { readOnly } : {}), props: { ...legacy, ...props } };
}

// Data in an older Puck shape: DropZone zones holding content, or a root whose
// fields sit outside props. The editor runs Puck's migrate() only then, because
// migrate() logs to the console every time it is called.
export function needsPuckMigration(data) {
  const zones = data.zones ?? {};
  if (Object.values(zones).some((content) => Array.isArray(content) && content.length > 0)) return true;
  const root = data.root ?? {};
  return Object.keys(root).some((key) => key !== 'props' && key !== 'readOnly');
}

// A page's own settings (title, background), for the app to use outside the
// page body, e.g. the browser title.
export function pageSettings(document) {
  const props = upgradeDocument(document)?.data?.root?.props ?? {};
  return { title: props.title || '', background: props.background ?? 'site' };
}

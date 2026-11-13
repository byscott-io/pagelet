// Talks to the pagelet Rails engine's API (mounted at /pagelet by default).
//
//   const pages = createPageletClient();               // same-origin, /pagelet
//   const { page } = await pages.getPage(id);
//   await pages.saveDraft(id, document);
//   await pages.publish(id);
//
// Requests carry the app's session cookie and its CSRF token, because the
// engine's controllers inherit the app's own sign-in and CSRF protection.

export class PageletApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = 'PageletApiError';
    this.status = status;
    // Field errors from a 422, e.g. { path: ['Path has already been taken'] }.
    this.errors = errors ?? {};
  }
}

// The token Rails puts in the layout with csrf_meta_tags.
function csrfFromPage() {
  if (typeof document === 'undefined') return undefined;
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? undefined;
}

export function createPageletClient({ baseUrl = '/pagelet', csrfToken, headers = {}, fetch: fetchImpl } = {}) {
  const doFetch = fetchImpl ?? globalThis.fetch;
  if (typeof doFetch !== 'function') throw new Error('pagelet: no fetch available; pass one to createPageletClient');
  // A loop rather than /\/+$/: that regex is slow on long runs of slashes.
  let root = String(baseUrl);
  while (root.endsWith('/')) root = root.slice(0, -1);

  async function request(method, path, body) {
    const token = typeof csrfToken === 'function' ? csrfToken() : (csrfToken ?? csrfFromPage());
    const response = await doFetch(`${root}${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token && method !== 'GET' ? { 'X-CSRF-Token': token } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (response.ok) return payload;

    const messages = Object.values(payload.errors ?? {}).flat();
    const detail = messages.length ? messages.join('; ') : (payload.error ?? response.statusText);
    throw new PageletApiError(`pagelet: ${method} ${path} failed (${response.status}): ${detail}`, {
      status: response.status,
      errors: payload.errors,
    });
  }

  const pagePath = (id) => `/pages/${encodeURIComponent(id)}`;

  async function getPublishedPage(path) {
    try {
      const data = await request('GET', `/published?path=${encodeURIComponent(path)}`);
      return { document: data.document, pagePath: data.page_path, rest: data.rest ?? '' };
    } catch (error) {
      if (error instanceof PageletApiError && error.status === 404) return null;
      throw error;
    }
  }

  return {
    listPages: () => request('GET', '/pages'),
    getPage: (id) => request('GET', pagePath(id)),
    createPage: ({ path, title, matchesSubpaths }) =>
      request('POST', '/pages', { page: { path, title, matches_subpaths: matchesSubpaths } }),
    updatePage: (id, { path, title, matchesSubpaths }) =>
      request('PATCH', pagePath(id), { page: { path, title, matches_subpaths: matchesSubpaths } }),
    saveDraft: (id, document) => request('PATCH', pagePath(id), { page: { draft_document: document } }),
    deletePage: (id) => request('DELETE', pagePath(id)),
    publish: (id, { publishedBy } = {}) =>
      request('POST', `${pagePath(id)}/publish`, publishedBy ? { published_by: publishedBy } : {}),
    listVersions: (id) => request('GET', `${pagePath(id)}/versions`),
    restoreVersion: (id, number) => request('POST', `${pagePath(id)}/versions/${encodeURIComponent(number)}/restore`, {}),
    // Public: the published document at a path, or null when there is none.
    getPublished: async (path) => (await getPublishedPage(path))?.document ?? null,
    // Public: { document, pagePath, rest } for a path, or null. rest is what
    // follows a page that answers for sub-paths: /messages/43 -> "43".
    getPublishedPage,
    // Public: the site's theme and menu.
    getSite: async () => (await request('GET', '/site')).settings,
    // Needs publish permission: changes are live at once.
    updateSite: async (settings) => (await request('PATCH', '/site', { settings })).settings,
  };
}

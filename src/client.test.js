import { describe, expect, it, vi } from 'vitest';
import { PageletApiError, createPageletClient } from './client.js';

function fakeFetch(status = 200, body = {}) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'status text',
    json: async () => body,
  }));
}

describe('createPageletClient', () => {
  it('sends JSON with the CSRF token and the session cookie', async () => {
    const fetch = fakeFetch(200, { page: { id: 7 } });
    const client = createPageletClient({ fetch, csrfToken: 'tok' });
    await client.saveDraft(7, { pagelet: 1, data: {} });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/pagelet/pages/7');
    expect(init.method).toBe('PATCH');
    expect(init.credentials).toBe('same-origin');
    expect(init.headers['X-CSRF-Token']).toBe('tok');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ page: { draft_document: { pagelet: 1, data: {} } } });
  });

  it('leaves the CSRF token off reads', async () => {
    const fetch = fakeFetch(200, { pages: [] });
    await createPageletClient({ fetch, csrfToken: 'tok' }).listPages();
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty('X-CSRF-Token');
  });

  it('honours a custom mount point, with or without a trailing slash', async () => {
    const fetch = fakeFetch(200, {});
    await createPageletClient({ fetch, baseUrl: '/admin/cms/' }).publish(3, { publishedBy: 'pat' });
    expect(fetch.mock.calls[0][0]).toBe('/admin/cms/pages/3/publish');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ published_by: 'pat' });
  });

  it('encodes the path when fetching a published page', async () => {
    const fetch = fakeFetch(200, { document: { pagelet: 1 } });
    const doc = await createPageletClient({ fetch }).getPublished('/about us?x');
    expect(fetch.mock.calls[0][0]).toBe('/pagelet/published?path=%2Fabout%20us%3Fx');
    expect(doc).toEqual({ pagelet: 1 });
  });

  it('answers null for a page that is not published', async () => {
    expect(await createPageletClient({ fetch: fakeFetch(404, { error: 'not found' }) }).getPublished('/x')).toBeNull();
  });

  it("raises field errors from a 422 with the server's messages", async () => {
    const fetch = fakeFetch(422, { errors: { path: ['Path has already been taken'] } });
    const error = await createPageletClient({ fetch }).createPage({ path: '/a', title: 'A' }).catch((e) => e);
    expect(error).toBeInstanceOf(PageletApiError);
    expect(error.status).toBe(422);
    expect(error.errors.path).toEqual(['Path has already been taken']);
    expect(error.message).toContain('Path has already been taken');
  });

  it('raises on 403 rather than returning nothing', async () => {
    const error = await createPageletClient({ fetch: fakeFetch(403, { error: 'forbidden' }) }).publish(1).catch((e) => e);
    expect(error.status).toBe(403);
    expect(error.message).toContain('forbidden');
  });

  it('returns null for a 204 delete', async () => {
    expect(await createPageletClient({ fetch: fakeFetch(204) }).deletePage(1)).toBeNull();
  });

  it('reads and updates site settings', async () => {
    const fetch = fakeFetch(200, { settings: { menu: { items: [] } } });
    const client = createPageletClient({ fetch, csrfToken: 't' });
    expect(await client.getSite()).toEqual({ menu: { items: [] } });
    await client.updateSite({ theme: {} });
    expect(fetch.mock.calls[0][0]).toBe('/pagelet/site');
    expect(fetch.mock.calls[1][1].method).toBe('PATCH');
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ settings: { theme: {} } });
  });

  it('returns the matched page and the remainder for a sub-path', async () => {
    const fetch = fakeFetch(200, { document: { pagelet: 1 }, page_path: '/messages', rest: '43' });
    expect(await createPageletClient({ fetch }).getPublishedPage('/messages/43')).toEqual({ document: { pagelet: 1 }, pagePath: '/messages', rest: '43' });
  });
});

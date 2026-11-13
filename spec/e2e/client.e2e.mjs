// Drives the BUILT npm client (dist/) against the real Rails engine running in
// the dummy app, with CSRF protection on. Proves the two packages agree on
// every route, payload and error shape, which mocked tests cannot.
//
// Expects the dummy app on E2E_URL (default http://127.0.0.1:3999).
import assert from 'node:assert/strict';
import { createPageletClient, PageletApiError } from '../../dist/index.js';

const base = process.env.E2E_URL ?? 'http://127.0.0.1:3999';

// What a browser would have: a session cookie and the token from the layout.
const csrfResponse = await fetch(`${base}/csrf`);
const cookie = csrfResponse.headers.get('set-cookie').split(';')[0];
const { token } = await csrfResponse.json();

const client = (role, site = 1, { csrf = token } = {}) =>
  createPageletClient({
    baseUrl: `${base}/pagelet`,
    csrfToken: csrf,
    headers: { Cookie: cookie, 'X-Site-Id': String(site), 'X-Role': role },
  });

const publisher = client('publisher');
const editor = client('editor');
const doc = (text) => ({ pagelet: 1, data: { root: { props: {} }, content: [{ type: 'Heading', props: { id: 'h', text } }] } });
const rejects = async (promise, status) => {
  const error = await promise.then(() => null, (e) => e);
  assert.ok(error instanceof PageletApiError, `expected a PageletApiError with ${status}, got ${error}`);
  assert.equal(error.status, status);
  return error;
};

const { page } = await editor.createPage({ path: '/About-Us/', title: 'About us' });
assert.equal(page.path, '/about-us');

await editor.saveDraft(page.id, doc('First'));
await rejects(editor.publish(page.id), 403);                       // editors cannot publish
const { version } = await publisher.publish(page.id, { publishedBy: 'pat' });
assert.equal(version.number, 1);

await editor.saveDraft(page.id, doc('Second, still a draft'));
const live = await client('visitor').getPublished('/about-us');     // public read, no role needed
assert.equal(live.data.content[0].props.text, 'First');             // the draft never leaks
assert.equal(await client('visitor').getPublished('/nowhere'), null);

await publisher.publish(page.id);
const { versions } = await editor.listVersions(page.id);
assert.deepEqual(versions.map((v) => [v.number, v.live]), [[1, false], [2, true]]);
await editor.restoreVersion(page.id, 1);
assert.equal((await editor.getPage(page.id)).page.draft_document.data.content[0].props.text, 'First');

const conflict = await rejects(editor.createPage({ path: '/about-us', title: 'Again' }), 422);
assert.match(conflict.errors.path.join(), /already been taken/);

await rejects(client('publisher', 2).getPage(page.id), 404);         // another site's page does not exist
await rejects(client('publisher', 1, { csrf: 'forged' }).publish(page.id), 422); // CSRF is enforced
await rejects(client('visitor').listPages(), 403);

assert.equal(await editor.deletePage(page.id), null);
await rejects(editor.getPage(page.id), 404);

console.log('e2e: npm client and Rails engine agree on every call');

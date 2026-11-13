// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { createPageletClient } from './client.js';

it("reads the CSRF token from the page's csrf-token meta tag by default", async () => {
  document.head.innerHTML = '<meta name="csrf-token" content="from-meta">';
  const fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
  await createPageletClient({ fetch }).publish(1);
  expect(fetch.mock.calls[0][1].headers['X-CSRF-Token']).toBe('from-meta');
});

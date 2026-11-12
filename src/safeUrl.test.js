import { describe, expect, it } from 'vitest';
import { safeImageUrl, safeUrl } from './safeUrl.js';

describe('safeUrl', () => {
  it.each([
    'https://example.com/a',
    'http://example.com',
    'mailto:someone@example.com',
    'tel:+15555550100',
    '/about',
    '#contact',
    '?page=2',
  ])('allows %s', (url) => {
    expect(safeUrl(url)).toBe(url);
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    ' javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//evil.example/path',
    'relative/path',
    '',
    null,
    42,
  ])('refuses %j', (url) => {
    expect(safeUrl(url)).toBeUndefined();
  });

  it('keeps mailto and tel out of image sources', () => {
    expect(safeImageUrl('mailto:a@example.com')).toBeUndefined();
    expect(safeImageUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
  });
});

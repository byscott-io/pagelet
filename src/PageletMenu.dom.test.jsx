// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PageletMenu } from './PageletMenu.jsx';

afterEach(cleanup);

it('opens and closes the menu on narrow screens with the Menu button', async () => {
  const { container, getByText } = render(<PageletMenu menu={{ items: [{ label: 'Mission', href: '/mission' }] }} />);
  const groups = container.querySelector('.pagelet-menu__groups');
  const button = getByText('Menu');
  expect(button.getAttribute('aria-expanded')).toBe('false');
  await act(async () => button.click());
  expect(groups.className).toContain('pagelet-menu__groups--open');
  expect(button.getAttribute('aria-expanded')).toBe('true');
  await act(async () => button.click());
  expect(groups.className).not.toContain('--open');
});

import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageletLayout } from './PageletLayout.jsx';
import { PageletMenu } from './PageletMenu.jsx';

// Node, no DOM: the menu renders on the server like the rest of a page.
const Link = ({ to, children, ...rest }) => <a data-router-link="yes" href={to} {...rest}>{children}</a>;

const calvaryLike = {
  style: 'bar',
  brand: { logo: '/churches/calvary/logo.png', href: '/', label: 'Calvary' },
  items: [
    { label: 'Mission', href: '/mission', group: 'left' },
    { label: 'Join Live', href: '/live', icon: 'video', highlight: true, group: 'left' },
    { label: 'Contact', href: '/contact', group: 'right' },
    { label: 'Join us!', href: 'https://maps.example.com/church', icon: 'location', highlight: true, group: 'right' },
    { label: 'Bad', href: 'javascript:alert(1)', group: 'right' },
  ],
};

const render = (props) => renderToString(<PageletMenu menu={calvaryLike} linkComponent={Link} {...props} />);

describe('PageletMenu', () => {
  it('draws the brand logo and both groups in order', () => {
    const html = render().split('</style>')[1]; // class names also appear in the stylesheet
    expect(html).toContain('<img src="/churches/calvary/logo.png" alt="Calvary"');
    const left = html.indexOf('pagelet-menu__group"');
    const right = html.indexOf('pagelet-menu__group--right');
    expect(html.indexOf('Mission')).toBeGreaterThan(left);
    expect(html.indexOf('Mission')).toBeLessThan(right);
    expect(html.indexOf('Contact')).toBeGreaterThan(right);
  });

  it("uses the app's link component for internal links and plain anchors for external ones", () => {
    const html = render();
    expect(html).toMatch(/<a data-router-link="yes" href="\/mission"/);
    expect(html).toMatch(/<a class="pagelet-menu__link" style="color:var\(--pagelet-color-accent\)" href="https:\/\/maps\.example\.com\/church" target="_blank" rel="noopener noreferrer"/);
  });

  it('highlights and adds icons where asked, and drops unsafe links', () => {
    const html = render();
    expect(html.match(/<svg/g)).toHaveLength(2);
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('>Bad<');
  });

  it('marks the current page', () => {
    expect(render({ currentPath: '/mission' })).toMatch(/aria-current="page"[^>]*>Mission|>Mission<\/a>/);
    expect(render({ currentPath: '/mission' })).toContain('pagelet-menu__link--current');
  });

  it('makes a tel: or mailto: brand link a plain anchor, not a router link', () => {
    const html = renderToString(<PageletMenu menu={{ brand: { label: 'Call us', href: 'tel:+15555550100' } }} linkComponent={Link} />);
    expect(html).toContain('href="tel:+15555550100"');
    expect(html).not.toContain('data-router-link');
  });

  it('renders with no settings at all', () => {
    expect(renderToString(<PageletMenu />)).toContain('pagelet-menu');
  });
});

describe('PageletLayout', () => {
  it('puts the menu above the page and applies the site theme', () => {
    const html = renderToString(
      <PageletLayout site={{ theme: { colorAccent: '#0000ff' }, menu: calvaryLike }} linkComponent={Link}>
        <p>Page body</p>
      </PageletLayout>,
    );
    expect(html).toContain('--pagelet-color-accent:#0000ff');
    expect(html.indexOf('pagelet-menu')).toBeLessThan(html.indexOf('Page body'));
  });
});

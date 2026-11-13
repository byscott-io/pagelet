import { PageletMenu } from './PageletMenu.jsx';
import { themeToStyle, tokenVar } from './theme.js';

// A site's frame around a page: the menu from the site settings, then the page
// itself (usually a <PageletPage>, which draws the page's background).
//
//   <PageletLayout site={settings} linkComponent={Link} currentPath={pathname}>
//     <PageletPage document={doc} palette={palette} theme={settings.theme} />
//   </PageletLayout>
export function PageletLayout({ site = {}, linkComponent, currentPath, children }) {
  return (
    <div className="pagelet-layout" style={{ ...themeToStyle(site.theme), maxWidth: tokenVar('maxWidth'), margin: '0 auto' }}>
      <PageletMenu menu={site.menu} linkComponent={linkComponent} currentPath={currentPath} />
      <main style={{ marginTop: 'var(--pagelet-space)' }}>{children}</main>
    </div>
  );
}

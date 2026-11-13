import { useState } from 'react';
import { Icon } from './icons.jsx';
import { safeImageUrl, safeUrl } from './safeUrl.js';
import { tokenVar } from './theme.js';

// A site's menu, from its settings:
//   { style: 'bar' | 'centered',
//     brand: { logo, href, label },
//     items: [{ label, href, icon, highlight, group: 'left' | 'right' }] }
//
// linkComponent draws internal links, so an app's router can handle them
// without a page reload: pass React Router's Link (it takes `to`). External
// links (http/https) are plain anchors opening in a new tab.
//
// On narrow screens the items fold behind a menu button. The breakpoint is in
// a small scoped stylesheet, because inline styles cannot hold a media query.
const CSS = `
.pagelet-menu{display:flex;align-items:center;flex-wrap:wrap;gap:4px 16px;padding:8px 16px;background:var(--pagelet-menu-background,#f8f9fa)}
.pagelet-menu--centered{flex-direction:column}
.pagelet-menu__groups{display:flex;flex:1;align-items:center;gap:4px 16px;flex-wrap:wrap}
.pagelet-menu--centered .pagelet-menu__groups{justify-content:center;flex:none}
.pagelet-menu__group{display:flex;gap:4px 16px;flex-wrap:wrap;align-items:center}
.pagelet-menu__group--right{margin-left:auto}
.pagelet-menu--centered .pagelet-menu__group--right{margin-left:0}
.pagelet-menu__link{text-decoration:none;color:rgba(0,0,0,.65);padding:6px 0;display:inline-flex;align-items:center;gap:6px}
.pagelet-menu__link:hover{color:rgba(0,0,0,.9)}
.pagelet-menu__link--current{color:rgba(0,0,0,.9)}
.pagelet-menu__toggle{display:none;margin-left:auto;background:none;border:1px solid rgba(0,0,0,.2);border-radius:6px;padding:6px 10px;cursor:pointer;font:inherit}
@media (max-width: 767px){
  .pagelet-menu__toggle{display:inline-block}
  .pagelet-menu__groups{display:none;flex-basis:100%;flex-direction:column;align-items:flex-start}
  .pagelet-menu__groups--open{display:flex}
  .pagelet-menu__group{flex-direction:column;align-items:flex-start}
  .pagelet-menu__group--right{margin-left:0}
}`;

function isExternal(href) {
  return /^https?:\/\//i.test(href);
}

// Links the app's router cannot handle: other sites, phone numbers, email.
function needsPlainAnchor(href, LinkComponent) {
  return !LinkComponent || isExternal(href) || /^(mailto|tel):/i.test(href);
}

function MenuLink({ item, linkComponent: LinkComponent, currentPath, onNavigate }) {
  const href = safeUrl(item.href);
  if (!href) return null;
  const current = !isExternal(href) && currentPath === href;
  const className = `pagelet-menu__link${current ? ' pagelet-menu__link--current' : ''}`;
  const style = item.highlight ? { color: tokenVar('colorAccent') } : undefined;
  const body = (
    <>
      {item.label}
      {item.icon && <Icon name={item.icon} />}
    </>
  );

  if (needsPlainAnchor(href, LinkComponent)) {
    const external = isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    return <a className={className} style={style} href={href} {...external}>{body}</a>;
  }
  return (
    <LinkComponent className={className} style={style} to={href} onClick={onNavigate} aria-current={current ? 'page' : undefined}>
      {body}
    </LinkComponent>
  );
}

export function PageletMenu({ menu = {}, linkComponent, currentPath }) {
  const [open, setOpen] = useState(false);
  const items = Array.isArray(menu.items) ? menu.items : [];
  const brand = menu.brand ?? {};
  const logo = safeImageUrl(brand.logo);
  const brandHref = safeUrl(brand.href) ?? '/';
  const close = () => setOpen(false);
  const group = (name) => items.filter((item) => (item.group ?? 'left') === name);
  const linkProps = { linkComponent, currentPath, onNavigate: close };
  const BrandLink = needsPlainAnchor(brandHref, linkComponent) ? 'a' : linkComponent;
  const brandTarget = BrandLink === 'a' ? { href: brandHref } : { to: brandHref, onClick: close };

  return (
    <nav className={`pagelet-menu${menu.style === 'centered' ? ' pagelet-menu--centered' : ''}`} aria-label="Site">
      <style>{CSS}</style>
      {(logo || brand.label) && (
        <BrandLink className="pagelet-menu__brand" {...brandTarget} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
          {logo && <img src={logo} alt={brand.label || 'Home'} style={{ height: '40px', width: 'auto', display: 'block' }} />}
          {!logo && brand.label}
        </BrandLink>
      )}
      <button type="button" className="pagelet-menu__toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        Menu
      </button>
      <div className={`pagelet-menu__groups${open ? ' pagelet-menu__groups--open' : ''}`}>
        <div className="pagelet-menu__group">{group('left').map((item, i) => <MenuLink key={i} item={item} {...linkProps} />)}</div>
        <div className="pagelet-menu__group pagelet-menu__group--right">{group('right').map((item, i) => <MenuLink key={i} item={item} {...linkProps} />)}</div>
      </div>
    </nav>
  );
}

import { safeImageUrl } from './safeUrl.js';
import { cssImage, overlayColor } from './style.js';
import { themeToStyle } from './theme.js';

// The root of every page: theme tokens as CSS variables, then the page's
// background. The background is either the site's (theme.background), the
// page's own, or none, with the content on a panel of a chosen color and
// opacity so text stays readable over any photo.
//
// It is also the root of the editor's preview frame, so editing shows the
// same background a visitor sees.
// fit:   'cover' crops the photo to fill the page area; 'photo' shows the whole
//        photo at its own proportions, growing only if the content is taller.
// frame: 'none', or 'card' for a bordered, rounded, padded frame around it.
const SITE_BACKGROUND_DEFAULTS = { image: '', overlayColor: '#ffffff', overlayOpacity: 85, rounded: true, fit: 'cover', frame: 'none' };

export function resolveBackground(theme = {}, page = {}) {
  const site = { ...SITE_BACKGROUND_DEFAULTS, ...(theme.background ?? {}) };
  const mode = page.background ?? 'site';
  if (mode === 'none') return null;
  const chosen =
    mode === 'custom'
      ? {
          image: page.backgroundImage,
          overlayColor: page.overlayColor ?? site.overlayColor,
          overlayOpacity: page.overlayOpacity ?? site.overlayOpacity,
          rounded: site.rounded,
          fit: site.fit,
          frame: site.frame,
        }
      : {
          ...site,
          // A page may keep the site's photo but change how much shows through.
          overlayOpacity: page.overlayOpacity ?? site.overlayOpacity,
        };
  // Both forms, so nothing has to parse one back out of the other.
  const image = cssImage(chosen.image);
  return image ? { ...chosen, image, imageUrl: safeImageUrl(chosen.image) } : null;
}

export function ThemeRoot({ theme, page, children }) {
  const background = resolveBackground(theme ?? {}, page ?? {});
  if (!background) {
    return (
      <div className="pagelet" style={themeToStyle(theme)}>
        {children}
      </div>
    );
  }

  const radius = background.rounded ? 'var(--pagelet-radius)' : 0;
  const panel = { background: overlayColor(background.overlayColor, background.overlayOpacity), padding: 'calc(var(--pagelet-space) * 2)' };

  // 'photo': the image and the panel share one grid cell, so the area is as
  // tall as the photo, or as the content when that is taller (the photo then
  // fills by cropping). 'cover': the photo is simply the area's background.
  const area =
    background.fit === 'photo' ? (
      <div className="pagelet-background" style={{ display: 'grid', borderRadius: radius, overflow: 'hidden' }}>
        <img src={background.imageUrl} alt="" aria-hidden="true" style={{ gridArea: '1 / 1', width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div className="pagelet-panel" style={{ gridArea: '1 / 1', ...panel }}>
          {children}
        </div>
      </div>
    ) : (
      <div className="pagelet-background" style={{ background: `${background.image} center / cover`, borderRadius: radius, overflow: 'hidden' }}>
        <div className="pagelet-panel" style={{ ...panel, minHeight: '60vh' }}>
          {children}
        </div>
      </div>
    );

  return (
    <div className="pagelet" style={themeToStyle(theme)}>
      {background.frame === 'card' ? (
        <div className="pagelet-frame" style={{ border: '1px solid rgba(0, 0, 0, 0.15)', borderRadius: radius, padding: 'var(--pagelet-space)', background: 'var(--pagelet-color-background)' }}>
          {area}
        </div>
      ) : (
        area
      )}
    </div>
  );
}

import { safeImageUrl } from '../safeUrl.js';
import { percentField } from '../style.js';
import { tokenVar } from '../theme.js';

export const Image = {
  label: 'Image',
  category: 'media',
  fields: {
    url: { type: 'text', label: 'Image URL' },
    alt: { type: 'text', label: 'Description (for screen readers)' },
    caption: { type: 'text' },
    align: {
      type: 'radio',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
    width: { ...percentField('Width (% of the column)'), min: 10 },
  },
  defaultProps: { url: '', alt: '', caption: '', align: 'left', width: 100 },
  render: ({ url, alt, caption, align, width }) => {
    const src = safeImageUrl(url);
    if (!src) return null;
    // A missing width means full width; any number, 0 included, is clamped.
    const requested = Number.isFinite(Number(width)) && width !== '' && width !== null ? Number(width) : 100;
    const percent = Math.min(100, Math.max(10, requested));
    const side = align === 'center' ? { marginInline: 'auto' } : align === 'right' ? { marginLeft: 'auto' } : {};
    return (
      <figure style={{ margin: '0 0 1em', width: `${percent}%`, maxWidth: '100%', ...side }}>
        <img src={src} alt={alt ?? ''} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: tokenVar('radius') }} />
        {caption && <figcaption style={{ fontSize: '0.9em', opacity: 0.75, marginTop: '6px', textAlign: align }}>{caption}</figcaption>}
      </figure>
    );
  },
};

export const ImageText = {
  label: 'Image with text',
  category: 'media',
  fields: {
    url: { type: 'text', label: 'Image URL' },
    alt: { type: 'text', label: 'Image description' },
    heading: { type: 'text' },
    text: { type: 'textarea' },
    imageSide: {
      type: 'radio',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
    },
  },
  defaultProps: { url: '', alt: '', heading: 'Heading', text: '', imageSide: 'left' },
  render: ({ url, alt, heading, text, imageSide }) => {
    const src = safeImageUrl(url);
    // CSS order rather than reordering children, so the reading order stays
    // the same for screen readers whichever side the image is drawn on.
    const image = src ? (
      <img src={src} alt={alt ?? ''} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: tokenVar('radius'), order: imageSide === 'right' ? 2 : 0 }} />
    ) : null;
    const words = (
      <div style={{ minWidth: 0, order: 1 }}>
        <h2 style={{ fontFamily: tokenVar('fontHeading'), margin: '0 0 0.5em' }}>{heading}</h2>
        {String(text ?? '')
          .split(/\n\s*\n/)
          .filter((paragraph) => paragraph.trim())
          .map((paragraph, index) => (
            <p key={index} style={{ margin: '0 0 1em' }}>{paragraph.trim()}</p>
          ))}
      </div>
    );
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: tokenVar('space'), alignItems: 'center' }}>
        {image}
        {words}
      </div>
    );
  },
};

// Only these hosts are embedded. Anything else renders as a plain link, so a
// page cannot be made to frame an arbitrary site.
export function embedUrl(value) {
  let url;
  try {
    url = new URL(String(value ?? '').trim());
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

  let id;
  if (host === 'youtube.com') {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
  }
  if (host === 'youtu.be') {
    id = url.pathname.slice(1);
    return /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
  }
  if (host === 'vimeo.com') {
    id = url.pathname.match(/^\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : undefined;
  }
  return undefined;
}

export const VideoEmbed = {
  label: 'Video (YouTube or Vimeo)',
  category: 'media',
  fields: {
    url: { type: 'text', label: 'Video link' },
    title: { type: 'text', label: 'Title (for screen readers)' },
  },
  defaultProps: { url: '', title: 'Video' },
  render: ({ url, title }) => {
    const src = embedUrl(url);
    if (!src) return null;
    return (
      <div style={{ position: 'relative', aspectRatio: '16 / 9', maxWidth: '100%', margin: '0 0 1em' }}>
        <iframe
          src={src}
          title={title || 'Video'}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, borderRadius: tokenVar('radius') }}
        />
      </div>
    );
  },
};

// An embedded page from another site, such as a statement of faith hosted
// elsewhere. Only offered when the app names the hosts it trusts
// (createPalette({ embedHosts })): framing an arbitrary page is how a site ends
// up showing something its owner never chose.
export function embedAllowed(value, hosts) {
  let url;
  try {
    url = new URL(String(value ?? '').trim());
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:') return undefined;
  const host = url.hostname.toLowerCase();
  const ok = hosts.some((allowed) => {
    const name = String(allowed).toLowerCase();
    return host === name || host.endsWith(`.${name}`);
  });
  return ok ? url.href : undefined;
}

export function makeEmbed(hosts) {
  return {
    label: 'Embedded page',
    category: 'media',
    fields: {
      url: { type: 'text', label: `Page address (https, from: ${hosts.join(', ')})` },
      title: { type: 'text', label: 'Title (for screen readers)' },
      height: { type: 'number', label: 'Height (pixels)', min: 200, max: 4000 },
    },
    defaultProps: { url: '', title: 'Embedded page', height: 800 },
    render: ({ url, title, height }) => {
      const src = embedAllowed(url, hosts);
      if (!src) return null;
      return (
        <iframe
          src={src}
          title={title || 'Embedded page'}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: `${Math.min(4000, Math.max(200, Number(height) || 800))}px`, border: 0, borderRadius: tokenVar('radius'), background: '#fff' }}
        />
      );
    },
  };
}

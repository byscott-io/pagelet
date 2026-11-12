import { safeImageUrl } from '../safeUrl.js';
import { tokenVar } from '../theme.js';

export const Image = {
  label: 'Image',
  category: 'media',
  fields: {
    url: { type: 'text', label: 'Image URL' },
    alt: { type: 'text', label: 'Description (for screen readers)' },
    caption: { type: 'text' },
  },
  defaultProps: { url: '', alt: '', caption: '' },
  render: ({ url, alt, caption }) => {
    const src = safeImageUrl(url);
    if (!src) return null;
    return (
      <figure style={{ margin: '0 0 1em' }}>
        <img src={src} alt={alt ?? ''} style={{ maxWidth: '100%', height: 'auto', display: 'block', borderRadius: tokenVar('radius') }} />
        {caption && <figcaption style={{ fontSize: '0.9em', opacity: 0.75, marginTop: '6px' }}>{caption}</figcaption>}
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

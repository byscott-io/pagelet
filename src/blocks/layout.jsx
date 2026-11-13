import { cssImage, overlayColor, percentField } from '../style.js';
import { tokenVar } from '../theme.js';

const SPACING = { none: '0', small: '16px', medium: '40px', large: '80px' };
const spacingOptions = Object.keys(SPACING).map((value) => ({ label: value, value }));

const BACKGROUNDS = {
  none: 'transparent',
  muted: tokenVar('colorMuted'),
  accent: tokenVar('colorAccent'),
};

export const Section = {
  label: 'Section',
  category: 'layout',
  fields: {
    background: {
      type: 'select',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Muted', value: 'muted' },
        { label: 'Accent', value: 'accent' },
      ],
    },
    backgroundImage: { type: 'text', label: 'Background image URL (optional)' },
    overlayColor: { type: 'text', label: 'Overlay color over the image (hex, e.g. #ffffff)' },
    overlayOpacity: percentField('Overlay opacity %'),
    padding: { type: 'select', options: spacingOptions },
    content: { type: 'slot' },
  },
  defaultProps: { background: 'none', backgroundImage: '', overlayColor: '#ffffff', overlayOpacity: 85, padding: 'medium' },
  render: ({ background, backgroundImage, overlayColor: color, overlayOpacity, padding, content: Content }) => {
    const image = cssImage(backgroundImage);
    const inner = (
      <div style={{ maxWidth: tokenVar('maxWidth'), margin: '0 auto', paddingInline: '16px' }}>
        <Content />
      </div>
    );
    return (
      <section
        style={{
          background: image ? `${image} center / cover` : BACKGROUNDS[background] ?? BACKGROUNDS.none,
          color: !image && background === 'accent' ? tokenVar('colorAccentText') : undefined,
        }}
      >
        {/* Over an image, the content sits on a panel of the chosen color and
            opacity, so text stays readable whatever the photo. */}
        <div style={{ paddingBlock: SPACING[padding] ?? SPACING.medium, background: image ? overlayColor(color, overlayOpacity ?? 85) : undefined }}>
          {inner}
        </div>
      </section>
    );
  },
};

export const Columns = {
  label: 'Columns',
  category: 'layout',
  fields: {
    count: {
      type: 'radio',
      options: [
        { label: '2', value: 2 },
        { label: '3', value: 3 },
      ],
    },
    first: { type: 'slot' },
    second: { type: 'slot' },
    third: { type: 'slot' },
  },
  defaultProps: { count: 2 },
  render: ({ count, first: First, second: Second, third: Third }) => {
    const columns = count === 3 ? [First, Second, Third] : [First, Second];
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${count === 3 ? 240 : 320}px), 1fr))`,
          gap: tokenVar('space'),
        }}
      >
        {columns.map((Column, index) => (
          <div key={index} style={{ minWidth: 0 }}>
            <Column />
          </div>
        ))}
      </div>
    );
  },
};

export const Spacer = {
  label: 'Spacer',
  category: 'layout',
  fields: { size: { type: 'select', options: spacingOptions.slice(1) } },
  defaultProps: { size: 'medium' },
  render: ({ size }) => <div aria-hidden="true" style={{ height: SPACING[size] ?? SPACING.medium }} />,
};

export const Divider = {
  label: 'Divider',
  category: 'layout',
  fields: {},
  render: () => (
    <hr style={{ border: 0, borderTop: `1px solid ${tokenVar('colorMuted')}`, margin: `${tokenVar('space')} 0` }} />
  ),
};

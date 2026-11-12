import { safeImageUrl, safeUrl } from '../safeUrl.js';
import { tokenVar } from '../theme.js';

const alignOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
];

// Plain text with blank lines between paragraphs. Rendered as text, never as
// HTML, so nothing a user types can inject markup.
function paragraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function Paragraphs({ text, style }) {
  return paragraphs(text).map((paragraph, index) => (
    <p key={index} style={{ margin: '0 0 1em', whiteSpace: 'pre-line', ...style }}>
      {paragraph}
    </p>
  ));
}

function ButtonLink({ label, href, variant = 'primary' }) {
  const url = safeUrl(href);
  if (!label) return null;
  const primary = variant !== 'outline';
  return (
    <a
      href={url}
      style={{
        display: 'inline-block',
        padding: '10px 20px',
        borderRadius: tokenVar('radius'),
        border: `2px solid ${tokenVar('colorAccent')}`,
        background: primary ? tokenVar('colorAccent') : 'transparent',
        color: primary ? tokenVar('colorAccentText') : tokenVar('colorAccent'),
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      {label}
    </a>
  );
}

const buttonFields = {
  buttonLabel: { type: 'text', label: 'Button label' },
  buttonHref: { type: 'text', label: 'Button link' },
};

export const Heading = {
  label: 'Heading',
  category: 'content',
  fields: {
    text: { type: 'text' },
    level: {
      type: 'select',
      options: [
        { label: 'Large (H1)', value: 'h1' },
        { label: 'Medium (H2)', value: 'h2' },
        { label: 'Small (H3)', value: 'h3' },
      ],
    },
    align: { type: 'radio', options: alignOptions },
  },
  defaultProps: { text: 'Heading', level: 'h2', align: 'left' },
  render: ({ text, level, align }) => {
    const Tag = ['h1', 'h2', 'h3'].includes(level) ? level : 'h2';
    return (
      <Tag style={{ fontFamily: tokenVar('fontHeading'), textAlign: align, margin: '0 0 0.5em', textWrap: 'balance' }}>
        {text}
      </Tag>
    );
  },
};

export const Text = {
  label: 'Text',
  category: 'content',
  fields: {
    text: { type: 'textarea' },
    align: { type: 'radio', options: alignOptions },
  },
  defaultProps: { text: 'Write something here.', align: 'left' },
  render: ({ text, align }) => (
    <div style={{ textAlign: align, maxWidth: '68ch', marginInline: align === 'center' ? 'auto' : undefined }}>
      <Paragraphs text={text} />
    </div>
  ),
};

export const Button = {
  label: 'Button',
  category: 'content',
  fields: {
    label: { type: 'text' },
    href: { type: 'text', label: 'Link' },
    variant: {
      type: 'radio',
      options: [
        { label: 'Filled', value: 'primary' },
        { label: 'Outline', value: 'outline' },
      ],
    },
    align: { type: 'radio', options: alignOptions },
  },
  defaultProps: { label: 'Learn more', href: '#', variant: 'primary', align: 'left' },
  render: ({ label, href, variant, align }) => (
    <div style={{ textAlign: align, margin: '0 0 1em' }}>
      <ButtonLink label={label} href={href} variant={variant} />
    </div>
  ),
};

export const Hero = {
  label: 'Hero',
  category: 'content',
  fields: {
    heading: { type: 'text' },
    subheading: { type: 'textarea' },
    imageUrl: { type: 'text', label: 'Background image URL' },
    ...buttonFields,
  },
  defaultProps: { heading: 'Welcome', subheading: '', imageUrl: '', buttonLabel: '', buttonHref: '' },
  render: ({ heading, subheading, imageUrl, buttonLabel, buttonHref }) => {
    const image = safeImageUrl(imageUrl);
    return (
      <header
        style={{
          padding: '96px 16px',
          textAlign: 'center',
          color: image ? '#ffffff' : tokenVar('colorAccentText'),
          background: image
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url("${encodeURI(image)}") center / cover`
            : tokenVar('colorAccent'),
        }}
      >
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: tokenVar('fontHeading'), fontSize: 'clamp(2rem, 5vw, 3.25rem)', margin: '0 0 0.4em', textWrap: 'balance' }}>
            {heading}
          </h1>
          <Paragraphs text={subheading} style={{ fontSize: '1.15rem' }} />
          <ButtonLink label={buttonLabel} href={buttonHref} variant="outline" />
        </div>
      </header>
    );
  },
};

export const CallToAction = {
  label: 'Call to action',
  category: 'content',
  fields: {
    heading: { type: 'text' },
    text: { type: 'textarea' },
    ...buttonFields,
  },
  defaultProps: { heading: 'Join us', text: '', buttonLabel: 'Get in touch', buttonHref: '#' },
  render: ({ heading, text, buttonLabel, buttonHref }) => (
    <div style={{ background: tokenVar('colorMuted'), borderRadius: tokenVar('radius'), padding: '40px 24px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: tokenVar('fontHeading'), margin: '0 0 0.5em' }}>{heading}</h2>
      <Paragraphs text={text} />
      <ButtonLink label={buttonLabel} href={buttonHref} />
    </div>
  ),
};

export const Cards = {
  label: 'Cards',
  category: 'content',
  fields: {
    items: {
      type: 'array',
      getItemSummary: (item) => item.title || 'Card',
      arrayFields: {
        title: { type: 'text' },
        text: { type: 'textarea' },
        imageUrl: { type: 'text', label: 'Image URL' },
        href: { type: 'text', label: 'Link (optional)' },
      },
      defaultItemProps: { title: 'Card title', text: '', imageUrl: '', href: '' },
    },
  },
  defaultProps: { items: [{ title: 'Card title', text: 'A short description.', imageUrl: '', href: '' }] },
  render: ({ items = [] }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: tokenVar('space') }}>
      {items.map((item, index) => {
        const image = safeImageUrl(item.imageUrl);
        const href = safeUrl(item.href);
        const body = (
          <>
            {image && <img src={image} alt="" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />}
            <div style={{ padding: '16px' }}>
              <h3 style={{ fontFamily: tokenVar('fontHeading'), margin: '0 0 0.4em' }}>{item.title}</h3>
              <Paragraphs text={item.text} />
            </div>
          </>
        );
        const cardStyle = { display: 'block', background: tokenVar('colorMuted'), borderRadius: tokenVar('radius'), overflow: 'hidden', color: 'inherit', textDecoration: 'none' };
        return href ? (
          <a key={index} href={href} style={cardStyle}>{body}</a>
        ) : (
          <div key={index} style={cardStyle}>{body}</div>
        );
      })}
    </div>
  ),
};

// <details>/<summary>: opens and closes with no JavaScript, so it works the
// same in server-rendered HTML as in the browser.
export const Faq = {
  label: 'FAQ',
  category: 'content',
  fields: {
    items: {
      type: 'array',
      getItemSummary: (item) => item.question || 'Question',
      arrayFields: { question: { type: 'text' }, answer: { type: 'textarea' } },
      defaultItemProps: { question: 'Question?', answer: '' },
    },
  },
  defaultProps: { items: [{ question: 'Question?', answer: 'Answer.' }] },
  render: ({ items = [] }) => (
    <div>
      {items.map((item, index) => (
        <details key={index} style={{ borderBottom: `1px solid ${tokenVar('colorMuted')}`, padding: '12px 0' }}>
          <summary style={{ fontWeight: 600, cursor: 'pointer' }}>{item.question}</summary>
          <div style={{ paddingTop: '8px' }}>
            <Paragraphs text={item.answer} />
          </div>
        </details>
      ))}
    </div>
  ),
};

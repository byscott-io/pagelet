import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createDocument } from './document.js';
import { createPalette } from './palette.jsx';
import { PageletPage } from './PageletPage.jsx';

// Runs in Node with no DOM: this file is the proof that a page renders during
// server-side pre-rendering, which is how search engines see it.

const block = (type, props) => ({ type, props: { id: `${type}-${Math.random().toString(36).slice(2)}`, ...props } });

const everyBlock = createDocument({
  root: { props: {} },
  content: [
    block('Hero', { heading: 'Welcome home', subheading: 'First line\n\nSecond line', imageUrl: 'https://example.com/hero.jpg', buttonLabel: 'Visit', buttonHref: '/visit' }),
    block('Section', {
      background: 'muted',
      padding: 'large',
      content: [block('Heading', { text: 'Inside a section', level: 'h2', align: 'left' })],
    }),
    block('Columns', {
      count: 2,
      first: [block('Text', { text: 'Left column', align: 'left' })],
      second: [block('Text', { text: 'Right column', align: 'left' })],
      third: [],
    }),
    block('Spacer', { size: 'small' }),
    block('Divider', {}),
    block('Button', { label: 'Bad link', href: 'javascript:alert(1)', variant: 'primary', align: 'left' }),
    block('CallToAction', { heading: 'Join us', text: 'Sundays', buttonLabel: 'Plan a visit', buttonHref: 'https://example.com/visit' }),
    block('Cards', { items: [{ title: 'Card one', text: 'Body', imageUrl: '', href: '/one' }] }),
    block('Faq', { items: [{ question: 'When?', answer: 'Sunday at ten' }] }),
    block('Image', { url: 'https://example.com/a.jpg', alt: 'A picture', caption: 'Caption' }),
    block('ImageText', { url: 'https://example.com/b.jpg', alt: 'B', heading: 'Side by side', text: 'Words', imageSide: 'right' }),
    block('VideoEmbed', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'A video' }),
    block('VideoEmbed', { url: 'https://evil.example/frame', title: 'Not allowed' }),
  ],
});

const render = (props) => renderToString(<PageletPage palette={createPalette()} {...props} />);

describe('PageletPage', () => {
  it('renders every built-in block on the server', () => {
    const html = render({ document: everyBlock });
    for (const text of ['Welcome home', 'Second line', 'Inside a section', 'Left column', 'Right column', 'Join us', 'Card one', 'When?', 'Sunday at ten', 'Caption', 'Side by side']) {
      expect(html).toContain(text);
    }
    expect(html).toContain('<details');
    expect(html).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('never writes an unsafe link or frame into the page', () => {
    const html = render({ document: everyBlock });
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('evil.example');
  });

  it('applies the theme as CSS variables on the page wrapper', () => {
    const html = render({ document: everyBlock, theme: { colorAccent: '#aa0000' } });
    expect(html).toContain('--pagelet-color-accent:#aa0000');
    // Tokens the app leaves out fall back to the defaults.
    expect(html).toContain('--pagelet-radius:8px');
  });

  it("renders an app's own block from the palette", () => {
    const SermonCard = { label: 'Sermon', category: 'sermons', fields: { title: { type: 'text' } }, render: ({ title }) => <article>Sermon: {title}</article> };
    const palette = createPalette({ blocks: { SermonCard } });
    const html = renderToString(
      <PageletPage palette={palette} document={createDocument({ root: { props: {} }, content: [block('SermonCard', { title: 'Grace' })] })} />,
    );
    expect(html).toContain('Sermon: <!-- -->Grace');
  });

  it('renders an empty page for a missing document', () => {
    expect(render({ document: null })).toContain('class="pagelet"');
  });

  it('demands a palette rather than rendering nothing', () => {
    expect(() => renderToString(<PageletPage document={everyBlock} />)).toThrow(/needs a palette/);
  });
});

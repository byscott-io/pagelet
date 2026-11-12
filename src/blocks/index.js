import { CallToAction, Button, Cards, Faq, Heading, Hero, Text } from './content.jsx';
import { Columns, Divider, Section, Spacer } from './layout.jsx';
import { Image, ImageText, VideoEmbed } from './media.jsx';

// The standard palette every app gets. An app adds its own blocks beside these,
// and may hide any of them (see createPalette).
export const builtInBlocks = {
  Section,
  Columns,
  Spacer,
  Divider,
  Hero,
  Heading,
  Text,
  Button,
  CallToAction,
  Cards,
  Faq,
  Image,
  ImageText,
  VideoEmbed,
};

export const builtInCategories = {
  layout: { title: 'Layout' },
  content: { title: 'Content' },
  media: { title: 'Media' },
};

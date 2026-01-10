/**
 * Builder.io Components Registry
 *
 * Components are organized into two categories:
 *
 * 1. "Article Content" - Components for building article/blog content
 *    - TextSectionBlock
 *    - ImageBlock
 *    - RichTextBlock
 *    - ArticleSectionBlock
 *    - QuoteBlock
 *    - CalloutBlock
 *    - ImageTextBlock
 *    - VideoEmbedBlock
 *    - DividerBlock
 *    - AccordionBlock
 *    - ArticleContentBlock
 *    - ArticleHeaderBlock
 *
 * 2. "Page Sections" - Components for building landing pages and sections
 *    - HeroBlock
 *    - BlogGridBlock
 *    - ArticleCarouselBlock
 *    - CTABlock
 *    - FeaturesBlock
 *    - TimelineBlock
 *    - StatsBlock
 *    - ImageGalleryBlock
 *    - TwoColumnTextBlock
 *    - BlogDetailBlock
 */

import type { RegisteredComponent } from '@builder.io/sdk-svelte';
import { heroBlockInfo } from './HeroBlock.info';
import { blogGridBlockInfo } from './BlogGridBlock.info';
import { articleCarouselBlockInfo } from './ArticleCarouselBlock.info';
import { articleHeaderBlockInfo } from './ArticleHeaderBlock.info';
import { articleContentBlockInfo } from './ArticleContentBlock.info';
import { blogDetailBlockInfo } from './BlogDetailBlock.info';
import { ctaBlockInfo } from './CTABlock.info';
import { featuresBlockInfo } from './FeaturesBlock.info';
import { timelineBlockInfo } from './TimelineBlock.info';
import { textSectionBlockInfo } from './TextSectionBlock.info';
import { quoteBlockInfo } from './QuoteBlock.info';
import { statsBlockInfo } from './StatsBlock.info';
import { imageGalleryBlockInfo } from './ImageGalleryBlock.info';
import { calloutBlockInfo } from './CalloutBlock.info';
import { twoColumnTextBlockInfo } from './TwoColumnTextBlock.info';
import { dividerBlockInfo } from './DividerBlock.info';
import { videoEmbedBlockInfo } from './VideoEmbedBlock.info';
import { accordionBlockInfo } from './AccordionBlock.info';
import { imageBlockInfo } from './ImageBlock.info';
import { richTextBlockInfo } from './RichTextBlock.info';
import { articleSectionBlockInfo } from './ArticleSectionBlock.info';
import { storySectionCardInfo } from './StorySectionCard.info';
import { pdfCarouselBlockInfo } from './PDFCarouselBlock.info';
import { genealogyBlockInfo } from './GenealogyBlock.info';
import { Builder } from '@builder.io/sdk';

export const builderComponents: RegisteredComponent[] = [
	// Article Content Components
	textSectionBlockInfo,
	imageBlockInfo,
	richTextBlockInfo,
	articleSectionBlockInfo,
	quoteBlockInfo,
	calloutBlockInfo,
	videoEmbedBlockInfo,
	dividerBlockInfo,
	articleHeaderBlockInfo,
	storySectionCardInfo,
	articleContentBlockInfo,
	accordionBlockInfo,

	// Page Section Components
	heroBlockInfo,
	blogGridBlockInfo,
	articleCarouselBlockInfo,
	ctaBlockInfo,
	featuresBlockInfo,
	timelineBlockInfo,
	statsBlockInfo,
	imageGalleryBlockInfo,
	twoColumnTextBlockInfo,
	blogDetailBlockInfo,
	pdfCarouselBlockInfo,
	genealogyBlockInfo
];

export {
	heroBlockInfo,
	blogGridBlockInfo,
	articleCarouselBlockInfo,
	articleHeaderBlockInfo,
	articleContentBlockInfo,
	blogDetailBlockInfo,
	ctaBlockInfo,
	featuresBlockInfo,
	timelineBlockInfo,
	textSectionBlockInfo,
	quoteBlockInfo,
	statsBlockInfo,
	imageGalleryBlockInfo,
	calloutBlockInfo,
	twoColumnTextBlockInfo,
	dividerBlockInfo,
	videoEmbedBlockInfo,
	accordionBlockInfo,
	imageBlockInfo,
	richTextBlockInfo,
	articleSectionBlockInfo,
	storySectionCardInfo,
	pdfCarouselBlockInfo,
	genealogyBlockInfo
};

Builder.register('insertMenu', {
	name: 'Article Content Components',
	items: [
		{ name: textSectionBlockInfo.tag, item: textSectionBlockInfo.name },
		{ name: imageBlockInfo.tag, item: imageBlockInfo.name },
		{ name: richTextBlockInfo.tag, item: richTextBlockInfo.name },
		{ name: articleSectionBlockInfo.tag, item: articleSectionBlockInfo.name },
		{ name: quoteBlockInfo.tag, item: quoteBlockInfo.name },
		{ name: calloutBlockInfo.tag, item: calloutBlockInfo.name },
		{ name: videoEmbedBlockInfo.tag, item: videoEmbedBlockInfo.name },
		{ name: dividerBlockInfo.tag, item: dividerBlockInfo.name },
		{ name: accordionBlockInfo.tag, item: accordionBlockInfo.name },
		{ name: articleContentBlockInfo.tag, item: articleContentBlockInfo.name },
		{ name: storySectionCardInfo.tag, item: storySectionCardInfo.name },
		{ name: pdfCarouselBlockInfo.tag, item: pdfCarouselBlockInfo.name }
	]
});
Builder.register('insertMenu', {
	name: 'Page Section Components',
	items: [
		{ name: heroBlockInfo.tag, item: heroBlockInfo.name },
		{ name: blogGridBlockInfo.tag, item: blogGridBlockInfo.name },
		{ name: articleCarouselBlockInfo.tag, item: articleCarouselBlockInfo.name },
		{ name: ctaBlockInfo.tag, item: ctaBlockInfo.name },
		{ name: featuresBlockInfo.tag, item: featuresBlockInfo.name },
		{ name: timelineBlockInfo.tag, item: timelineBlockInfo.name },
		{ name: statsBlockInfo.tag, item: statsBlockInfo.name },
		{ name: imageGalleryBlockInfo.tag, item: imageGalleryBlockInfo.name },
		{ name: twoColumnTextBlockInfo.tag, item: twoColumnTextBlockInfo.name },
		{ name: blogDetailBlockInfo.tag, item: blogDetailBlockInfo.name },
		{ name: genealogyBlockInfo.tag, item: genealogyBlockInfo.name },
	]
});

// // Register each component with Builder's SDK so components are available
// // inside the Builder editor (and when rendering content).
// // NOTE: registerComponent is the Svelte helper that wires the Svelte
// // component implementation to the Builder RegisteredComponent metadata.
// builderComponents.forEach((RegisteredComponent) => {
// 	// RegisteredComponent objects in this repository include a `component` field
// 	// pointing to the Svelte component implementation — but the
// 	// SDK's RegisteredComponent typings may not include it. Use a safe any-cast
// 	// so registrations work at runtime without breaking type checks.
// 	const comp = (RegisteredComponent as any).component;
// 	if (comp) {
// 		try {
// 			// Use Builder.registerComponent (runtime API) to register the
// 			// Svelte component implementation along with its metadata.
// 			// Cast to any to avoid TS issues with the SDK typings.
// 			(Builder as any).registerComponent(comp, RegisteredComponent as any);
// 		} catch (err) {
// 			// eslint-disable-next-line no-console
// 			console.warn('Builder registration failed for', (RegisteredComponent as any).name, err);
// 		}
// 	}
// });

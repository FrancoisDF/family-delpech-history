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
	name: 'Composants de contenu d’article',
	items: [
		{ name: textSectionBlockInfo.friendlyName, item: textSectionBlockInfo.name },
		{ name: imageBlockInfo.friendlyName, item: imageBlockInfo.name },
		{ name: richTextBlockInfo.friendlyName, item: richTextBlockInfo.name },
		{ name: articleSectionBlockInfo.friendlyName, item: articleSectionBlockInfo.name },
		{ name: quoteBlockInfo.friendlyName, item: quoteBlockInfo.name },
		{ name: calloutBlockInfo.friendlyName, item: calloutBlockInfo.name },
		{ name: videoEmbedBlockInfo.friendlyName, item: videoEmbedBlockInfo.name },
		{ name: dividerBlockInfo.friendlyName, item: dividerBlockInfo.name },
		{ name: accordionBlockInfo.friendlyName, item: accordionBlockInfo.name },
		{ name: articleContentBlockInfo.friendlyName, item: articleContentBlockInfo.name },
		{ name: storySectionCardInfo.friendlyName, item: storySectionCardInfo.name },
		{ name: pdfCarouselBlockInfo.friendlyName, item: pdfCarouselBlockInfo.name }
	]
});
Builder.register('insertMenu', {
	name: 'Sections de page',
	items: [
		{ name: heroBlockInfo.friendlyName, item: heroBlockInfo.name },
		{ name: blogGridBlockInfo.friendlyName, item: blogGridBlockInfo.name },
		{ name: articleCarouselBlockInfo.friendlyName, item: articleCarouselBlockInfo.name },
		{ name: ctaBlockInfo.friendlyName, item: ctaBlockInfo.name },
		{ name: featuresBlockInfo.friendlyName, item: featuresBlockInfo.name },
		{ name: timelineBlockInfo.friendlyName, item: timelineBlockInfo.name },
		{ name: statsBlockInfo.friendlyName, item: statsBlockInfo.name },
		{ name: imageGalleryBlockInfo.friendlyName, item: imageGalleryBlockInfo.name },
		{ name: twoColumnTextBlockInfo.friendlyName, item: twoColumnTextBlockInfo.name },
		{ name: blogDetailBlockInfo.friendlyName, item: blogDetailBlockInfo.name },
		{ name: genealogyBlockInfo.friendlyName, item: genealogyBlockInfo.name }
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

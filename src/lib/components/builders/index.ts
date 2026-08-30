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
		{
			name: textSectionBlockInfo.tag,
			item: textSectionBlockInfo.name,
			friendlyName: textSectionBlockInfo.friendlyName
		},
		{
			name: imageBlockInfo.tag,
			item: imageBlockInfo.name,
			friendlyName: imageBlockInfo.friendlyName
		},
		{
			name: richTextBlockInfo.tag,
			item: richTextBlockInfo.name,
			friendlyName: richTextBlockInfo.friendlyName
		},
		{
			name: articleSectionBlockInfo.tag,
			item: articleSectionBlockInfo.name,
			friendlyName: articleSectionBlockInfo.friendlyName
		},
		{
			name: quoteBlockInfo.tag,
			item: quoteBlockInfo.name,
			friendlyName: quoteBlockInfo.friendlyName
		},
		{
			name: calloutBlockInfo.tag,
			item: calloutBlockInfo.name,
			friendlyName: calloutBlockInfo.friendlyName
		},
		{
			name: videoEmbedBlockInfo.tag,
			item: videoEmbedBlockInfo.name,
			friendlyName: videoEmbedBlockInfo.friendlyName
		},
		{
			name: dividerBlockInfo.tag,
			item: dividerBlockInfo.name,
			friendlyName: dividerBlockInfo.friendlyName
		},
		{
			name: accordionBlockInfo.tag,
			item: accordionBlockInfo.name,
			friendlyName: accordionBlockInfo.friendlyName
		},
		{
			name: articleContentBlockInfo.tag,
			item: articleContentBlockInfo.name,
			friendlyName: articleContentBlockInfo.friendlyName
		},
		{
			name: storySectionCardInfo.tag,
			item: storySectionCardInfo.name,
			friendlyName: storySectionCardInfo.friendlyName
		},
		{
			name: pdfCarouselBlockInfo.tag,
			item: pdfCarouselBlockInfo.name,
			friendlyName: pdfCarouselBlockInfo.friendlyName
		}
	]
});
Builder.register('insertMenu', {
	name: 'Sections de page',
	items: [
		{ name: heroBlockInfo.tag, item: heroBlockInfo.name, friendlyName: heroBlockInfo.friendlyName },
		{
			name: blogGridBlockInfo.tag,
			item: blogGridBlockInfo.name,
			friendlyName: blogGridBlockInfo.friendlyName
		},
		{
			name: articleCarouselBlockInfo.tag,
			item: articleCarouselBlockInfo.name,
			friendlyName: articleCarouselBlockInfo.friendlyName
		},
		{ name: ctaBlockInfo.tag, item: ctaBlockInfo.name, friendlyName: ctaBlockInfo.friendlyName },
		{
			name: featuresBlockInfo.tag,
			item: featuresBlockInfo.name,
			friendlyName: featuresBlockInfo.friendlyName
		},
		{
			name: timelineBlockInfo.tag,
			item: timelineBlockInfo.name,
			friendlyName: timelineBlockInfo.friendlyName
		},
		{
			name: statsBlockInfo.tag,
			item: statsBlockInfo.name,
			friendlyName: statsBlockInfo.friendlyName
		},
		{
			name: imageGalleryBlockInfo.tag,
			item: imageGalleryBlockInfo.name,
			friendlyName: imageGalleryBlockInfo.friendlyName
		},
		{
			name: twoColumnTextBlockInfo.tag,
			item: twoColumnTextBlockInfo.name,
			friendlyName: twoColumnTextBlockInfo.friendlyName
		},
		{
			name: blogDetailBlockInfo.tag,
			item: blogDetailBlockInfo.name,
			friendlyName: blogDetailBlockInfo.friendlyName
		},
		{
			name: genealogyBlockInfo.tag,
			item: genealogyBlockInfo.name,
			friendlyName: genealogyBlockInfo.friendlyName
		}
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

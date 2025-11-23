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

import type { ComponentInfo } from '@builder.io/sdk-svelte';
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
import { imageTextBlockInfo } from './ImageTextBlock.info';
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
import { Builder } from '@builder.io/sdk';

export const builderComponents: ComponentInfo[] = [
	// Article Content Components
	textSectionBlockInfo,
	imageBlockInfo,
	richTextBlockInfo,
	articleSectionBlockInfo,
	quoteBlockInfo,
	calloutBlockInfo,
	imageTextBlockInfo,
	videoEmbedBlockInfo,
	dividerBlockInfo,
	accordionBlockInfo,
	articleHeaderBlockInfo,

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
	blogDetailBlockInfo
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
	imageTextBlockInfo,
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
	articleSectionBlockInfo
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
		{ name: imageTextBlockInfo.tag, item: imageTextBlockInfo.name },
		{ name: videoEmbedBlockInfo.tag, item: videoEmbedBlockInfo.name },
		{ name: dividerBlockInfo.tag, item: dividerBlockInfo.name },
		{ name: accordionBlockInfo.tag, item: accordionBlockInfo.name },
		{ name: articleContentBlockInfo.tag, item: articleContentBlockInfo.name }
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
		{ name: blogDetailBlockInfo.tag, item: blogDetailBlockInfo.name }
	]
});

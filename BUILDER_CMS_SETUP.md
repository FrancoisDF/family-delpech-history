# Builder.io CMS Setup Guide

This guide explains how to configure Builder.io CMS to manage content for the French Family History website.

## Configuration

### API Key
The Builder.io API key is configured in the environment variable:
- `PUBLIC_BUILDER_API_KEY`: `c259b700153e4b02b8d5248837ca8925`

## Content Models

### 1. Story Section Model (`story-section`)

Used to manage the storytelling sections displayed on the homepage.

**Fields to create in Builder.io:**

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `title` | Text | Yes | Title of the story section (e.g., "Les Débuts - 1800") |
| `description` | Long Text | Yes | Description of the story section |
| `year` | Number | Yes | The year this section represents |
| `audioUrl` | Text | No | URL to the audio file or relative path (e.g., `/audio/section-1.mp3`) |

**Example Entry:**
```
{
  "title": "Les Débuts - 1800",
  "description": "Le commencement de notre lignée au tournant du XIXe siècle...",
  "year": 1800,
  "audioUrl": "/audio/section-1.mp3"
}
```

### 2. Blog Post Model (`blog-post`)

Used to manage individual blog posts displayed on the Histoires page.

**Fields to create in Builder.io:**

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `title` | Text | Yes | Title of the blog post |
| `excerpt` | Long Text | Yes | Short excerpt or summary |
| `date` | Text | Yes | Publication date or year |
| `readTime` | Text | Yes | Estimated reading time (e.g., "8 min") |
| `featuredImage` | Image | No | Featured image for the blog post |
| `category` | Text | No | Category or tag for the post |
| `content` | Long Text | No | Full content of the blog post |

**Example Entry:**
```
{
  "title": "Le Grand Voyage de 1852 : De France en Angleterre",
  "excerpt": "Découvrez le récit fascinant du voyage qui a changé le cours de notre histoire familiale.",
  "date": "1852",
  "readTime": "8 min",
  "category": "Voyages",
  "content": "[Full blog post content here]"
}
```

## Setting Up Models in Builder.io

1. **Log in to Builder.io** with your account
2. **Navigate to the Models section**
3. **Create new models** with the names and fields listed above
4. **Configure the fields** with appropriate types and properties
5. **Publish your models**

## Integration in the Application

### Homepage (`src/routes/+page.svelte`)

The homepage automatically fetches story sections from Builder.io:

```typescript
import { fetchBuilderContent } from '$lib/builder';

const storySections = await fetchBuilderContent('story-section');
```

The content is mapped to the `StorySectionCard` component which displays:
- Title with year indicator
- Description
- Audio player

### Blog Page (`src/routes/histoires/+page.svelte`)

Blog posts are automatically fetched from Builder.io:

```typescript
const blogPosts = await fetchBuilderContent('blog-post');
```

The content is mapped to the `BlogPostCard` component which displays:
- Featured image (if available)
- Date and category
- Title
- Excerpt
- Link to full article

## Adding Content to Builder.io

1. Go to the Builder.io dashboard
2. Select the appropriate model (story-section or blog-post)
3. Click "Create new" or "Add content"
4. Fill in all required fields
5. Upload images if needed (for featured images)
6. Click "Publish"

The content will immediately appear on your website.

## Fallback Content

If Builder.io is unavailable or has no published content, the application will use fallback data defined directly in the components:

- **Homepage**: 5 default story sections (1800-1900)
- **Blog Page**: 3 sample blog posts

This ensures the website remains functional even if the CMS is offline.

## API Reference

### `fetchBuilderContent(model, options?)`

Fetches published content from a specific Builder.io model.

**Parameters:**
- `model` (string): The model name (e.g., 'story-section', 'blog-post')
- `options` (optional):
  - `limit`: Number of items to fetch (default: 100)
  - `offset`: Number of items to skip (default: 0)
  - `preview`: Include preview/draft content (default: false)
  - `query`: Custom query filters

**Returns:** Promise<BuilderContent[]>

**Example:**
```typescript
const stories = await fetchBuilderContent('story-section', {
  limit: 10,
  offset: 0
});
```

## Troubleshooting

- **Content not appearing**: Ensure content is published (not just saved as draft)
- **Images not loading**: Check image URLs are absolute or use relative paths from `/public`
- **API errors**: Verify the API key is correct in the environment variables
- **Audio not playing**: Ensure audio files are accessible at the specified URLs

## Documentation

For more information about Builder.io CMS:
- [Builder.io Documentation](https://www.builder.io/c/docs)
- [Content API Documentation](https://www.builder.io/c/docs/content-api)

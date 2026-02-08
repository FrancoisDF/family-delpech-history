# Plan: Implement Search & Filter on `/histoires` Index Route

The user wants to add search and filter capabilities to the `/histoires` route. Although the folder `src/routes/histoires/` exists (containing the `[id]` detail route), the index route (list view) is missing. I will create the index page to display the list of stories with the requested filtering features.

## 1. Create `src/routes/histoires/+page.server.ts`

This file will handle data fetching and server-side filtering.

-   **Imports**:
    -   `fetchBuilderContentServer` from `$lib/server/builder`
    -   `fetchArticles` from `$lib/components/article.remote` (I will use this or adapt its logic to support filtering directly if possible, or filter in memory if the API doesn't support complex "OR" filtering easily).
-   **Logic**:
    -   **Load**: Read `q` (text search) and `tags` (comma-separated IDs) from `url.searchParams`.
    -   **Fetch**: Get all articles (limit 100).
    -   **Tags Extraction**: Iterate through articles to build a list of all available tags (id, label) for the UI.
    -   **Filter**:
        -   **Text**: Check if `title`, `excerpt`, or `tags` match the `q` param (case-insensitive).
        -   **Tags**: If `tags` param is present, check if the article has at least one of the selected tags.
    -   **Return**: `{ articles: filteredArticles, allTags, params: { q, tags } }`.

## 2. Create `src/routes/histoires/+page.svelte`

This file will be the main UI for the list view.

-   **UI Structure**:
    -   **Header**: Title "Histoires de Famille" and description.
    -   **Search & Filter Section**:
        -   **Text Input**: Bound to search query.
        -   **Tag Chips**: Clickable buttons/badges for each available tag. Active state styling for selected tags.
        -   **Interaction**: Changing input or clicking tags updates the URL (`goto('?q=...&tags=...')` with `keepFocus: true`), triggering the server loader.
    -   **Grid View**:
        -   Reuse the markup/logic from `src/lib/components/builders/BlogGridBlock.svelte`.
        -   Render cards with Image, Title, Date, Excerpt, and "Lire plus" link.
    -   **Empty State**: Message when no results match.

## 3. Key Components & Utilities to Reuse

-   `BlogGridBlock` (styles and layout).
-   `url-utils` (`generateBlogUrl` for links).
-   `article.remote` (types and fetch logic).

## 4. Execution Steps

1.  Write `src/routes/histoires/+page.server.ts`.
2.  Write `src/routes/histoires/+page.svelte`.

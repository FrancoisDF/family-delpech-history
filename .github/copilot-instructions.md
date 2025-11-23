## Purpose

This file gives focused, actionable guidance for AI coding agents working in this repository so they become productive quickly.

## Big Picture

- **Stack:** SvelteKit 2 + Svelte 5, TypeScript, TailwindCSS, Vite, Vitest + Playwright. See `AGENTS.md` for a higher-level overview.
- **Routing / Data flow:** File-based routing in `src/routes/` (use `+page.svelte`, `+page.server.ts`, and `+layout.svelte`). Server data logic lives in `+page.server.ts` files (example: `src/routes/histoires/[id]/+page.server.ts`).
- **Shared code:** UI components and builder utilities live under `src/lib/` (notably `src/lib/components/` and `src/lib/*builder*.ts`). Use the `$lib` import alias.

## Developer workflows (explicit)

- **Start dev server:** `npm run dev` — iterate on UI and server endpoints.
- **Build for production:** `npm run build` then `npm run preview` to validate the build.
- **Type check:** `npm run check` (uses `svelte-check`).
- **Run tests:** `npm run test` (Vitest) and browser tests via Playwright when configured.
- **Lint / format:** `npm run lint` (ESLint + Prettier).

## Project-specific conventions

- **Component locations:** Put reusable components in `src/lib/components/`. Example components: `BlogPostCard.svelte`, `Timeline.svelte`.
- **Builder blocks:** Visual/content builder components are under `src/lib/components/builders/` (e.g. `HeroBlock.svelte`, `CTABlock.svelte`). Follow the existing props shape and slot usage when adding new blocks.
- **Server helpers:** Server-side builder logic and APIs appear in `src/lib/server/` (see `src/lib/server/builder.ts`). When adding server-side logic prefer `+page.server.ts` for route-level fetch and validation.
- **Routing params:** Dynamic routes use folder names like `src/routes/histoires/[id]/+page.svelte`. Use load functions or `+page.server.ts` to fetch data for those routes.
- **Styling:** Global styles in `src/app.css` and Tailwind configured in `tailwind.config.js`. Use utility classes; add component-level classes in `@layer components` if needed.

## Patterns & examples to follow

- Importing a component: `import X from '$lib/components/X.svelte'`.
- Server data loader example: check `src/routes/+page.server.ts` for patterns of fetching and returning `props`/`data`.
- When creating a new page, add `+page.svelte` under `src/routes/<name>/` and any server logic to `+page.server.ts`.

## Integration points & external deps

- Tailwind/PostCSS: configured via `tailwind.config.js` and `postcss.config.js`.
- Testing: Vitest + Playwright (see `vitest-setup-client.ts`). Use `npm run test` locally and run headful Playwright where required.
- Adapters: repository uses SvelteKit standard adapters at build time; add an adapter in `svelte.config.js` only when deploying to a specific platform.

## Practical tips for an AI assistant

- Prefer small, focused edits: modify or add one route/component at a time and run `npm run dev` to validate.
- Search repository for `+page.server.ts` and `src/lib` to find canonical examples before implementing new features.
- Preserve existing prop shapes and exported names in builder components to keep pages compatible with content data.
- When changing CSS or Tailwind config, run the dev server and verify visually — many bugs are styling regressions.

- **Use modern SvelteKit & Svelte 5 conventions:** Prefer the latest SvelteKit capabilities (file-based routing, `+page.server.ts` loaders/actions, form actions, route groups/layouts, and streaming responses where appropriate) and write components using Svelte 5 idioms (top-level script with `lang="ts"`, reactive statements, `$state`/`$effect` patterns used in this codebase, and the official component API). When accessing browser-only APIs use `onMount` or `browser` checks from `$app/environment`.

## When merging into an existing `copilot-instructions.md`

- Preserve any handwritten guidance and only add or update entries that reflect real, discoverable patterns in the codebase (routing, builder folders, scripts above).

---
If anything above is unclear or you'd like me to expand on examples (e.g., show a canonical `+page.server.ts` snippet or a builder component), tell me which part to expand and I will iterate.


You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:


## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
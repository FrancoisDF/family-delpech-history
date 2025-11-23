# Site Configuration Guide

The header and footer are now fully configurable from Builder.io CMS without editing code.

## How to Edit Header and Footer

### Access the Configuration

1. Go to your Builder.io dashboard
2. Navigate to the **Models** section
3. Find **Site Configuration** model
4. Click on the published "Site Configuration" content entry
5. Edit directly in the Builder editor

**Direct Link:** https://builder.io/content/9afda69229c24fdcb8b49520cf2d95fd

### Header Configuration Fields

#### `headerLogo`
The text/logo displayed in the header navigation bar.

**Example:** `"Histoire de Famille"`

#### `headerLinks`
Array of navigation links in the header. Each link has:
- `label` - Display text (e.g., "Accueil")
- `url` - Link destination (e.g., "/")
- `ariaLabel` - Accessibility label (optional, e.g., "Retour à la page d'accueil")

**Example Structure:**
```json
[
  {
    "label": "Accueil",
    "url": "/",
    "ariaLabel": "Retour à la page d'accueil"
  },
  {
    "label": "Histoires",
    "url": "/histoires",
    "ariaLabel": "Voir toutes les histoires"
  },
  {
    "label": "Questions",
    "url": "/chat",
    "ariaLabel": "Poser une question à notre assistant"
  }
]
```

### Footer Configuration Fields

#### `siteName`
The site/brand name displayed in the footer's first column.

**Example:** `"Histoire de Famille"`

#### `footerDescription`
Description text displayed under the site name in the footer.

**Example:** `"Découvrez les histoires et les secrets de notre famille à travers 50 livres d'histoire familiale du XIXe siècle."`

#### `footerLinks`
Navigation links in the "Navigation" section of the footer. Each link has:
- `label` - Display text
- `url` - Link destination

**Example Structure:**
```json
[
  {"label": "Accueil", "url": "/"},
  {"label": "Histoires", "url": "/histoires"},
  {"label": "Questions", "url": "/chat"}
]
```

#### `footerInfoTitle`
Title for the third footer column.

**Example:** `"Informations"`

#### `footerInfoLinks`
Links in the info section (usually legal/policy links). Each link has:
- `label` - Display text
- `url` - Link destination

**Example Structure:**
```json
[
  {"label": "Conditions d'utilisation", "url": "#"},
  {"label": "Confidentialité", "url": "#"},
  {"label": "Contact", "url": "#"}
]
```

#### `footerCopyright`
Copyright text displayed at the bottom of the footer.

**Example:** `"© 2024 Histoire de Famille. Tous droits réservés."`

## How Changes Are Applied

1. **Edit in Builder.io** - Update any of the configuration fields
2. **Publish** - Click the Publish button
3. **Auto-fetch on page load** - The site automatically fetches the updated configuration when users load the page
4. **Server-side rendering** - Configuration is fetched server-side for optimal performance

There is **no rebuild or redeploy needed** - changes appear immediately!

## Default Fallback Configuration

If the Builder.io configuration is unavailable, the site will use this default configuration:

```javascript
{
  siteName: 'Histoire de Famille',
  headerLogo: 'Histoire de Famille',
  headerLinks: [
    { label: 'Accueil', url: '/', ariaLabel: 'Retour à la page d\'accueil' },
    { label: 'Histoires', url: '/histoires', ariaLabel: 'Voir toutes les histoires' },
    { label: 'Questions', url: '/chat', ariaLabel: 'Poser une question à notre assistant' }
  ],
  footerDescription: 'Découvrez les histoires et les secrets de notre famille à travers 50 livres d\'histoire familiale du XIXe siècle.',
  footerLinks: [
    { label: 'Accueil', url: '/' },
    { label: 'Histoires', url: '/histoires' },
    { label: 'Questions', url: '/chat' }
  ],
  footerInfoTitle: 'Informations',
  footerInfoLinks: [
    { label: 'Conditions d\'utilisation', url: '#' },
    { label: 'Confidentialité', url: '#' },
    { label: 'Contact', url: '#' }
  ],
  footerCopyright: '© 2024 Histoire de Famille. Tous droits réservés.'
}
```

## Technical Architecture

### Files Involved

- **`src/routes/+layout.server.ts`** - Server-side loader that fetches site configuration from Builder.io
- **`src/routes/+layout.svelte`** - Layout that uses the configuration to render Header and Footer
- **`src/lib/components/Header.svelte`** - Dynamic header component
- **`src/lib/components/Footer.svelte`** - Dynamic footer component
- **`src/lib/server/builder.ts`** - Server-side Builder.io API functions

### Data Flow

```
Builder.io (site-config model)
        ↓
+layout.server.ts (fetchBuilderContentServer)
        ↓
LayoutData via `data` prop
        ���
+layout.svelte (passes to Header & Footer)
        ↓
Header.svelte & Footer.svelte (render configured content)
        ↓
User sees updated header/footer
```

## Tips for Editors

1. **Test Before Publishing** - Use Builder's preview feature before publishing changes
2. **Link Validation** - Ensure all URLs are correct (e.g., "/" for home, "/histoires" for stories)
3. **Mobile Friendly** - Test how navigation links look on mobile devices
4. **Accessibility** - Provide `ariaLabel` values for screen reader users
5. **Length Limits** - Keep header links and footer text reasonably short for better layout

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Header/Footer not updating | Publish your changes in Builder.io (check the "Published" status) |
| Old content still showing | Clear browser cache (Ctrl+Shift+Delete) and refresh |
| Links not working | Verify URLs are correct (use "/" for root, check spelling) |
| Mobile layout broken | Reduce the number of header links or shorten text |
| Special characters not showing | Ensure content is saved as UTF-8 in Builder.io |

## Advanced: Add More Configuration Fields

To add more configurable fields (e.g., social media links, colors, etc.):

1. Edit the `site-config` model in Builder.io (via Model settings)
2. Add new fields to the model schema
3. Update the site configuration content with values
4. Update `src/routes/+layout.svelte` to pass new props to Header/Footer
5. Update `src/lib/components/Header.svelte` or `Footer.svelte` to use the new fields

Example: Adding social media links to the footer:
```svelte
<!-- In Footer.svelte -->
{#if socialLinks && socialLinks.length > 0}
  <div class="flex gap-4 justify-center">
    {#each socialLinks as link}
      <a href={link.url} aria-label={link.label}>
        <!-- Social icon here -->
      </a>
    {/each}
  </div>
{/if}
```

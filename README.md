# Hanamal 24 Static Site Generator

A minimal static site generator that pulls data from Airtable and generates SEO-friendly static HTML pages.

## Setup

1. Create a read-only Airtable Personal Access Token with access scoped to a single base
2. Duplicate `env.example` to `.env` and fill in your values:
   - `AIRTABLE_TOKEN`: Your Airtable Personal Access Token
   - `AIRTABLE_BASE`: Your Airtable Base ID
   - `BASE_URL`: Your site's URL (e.g., https://hanamal24.com)
   - `SITE_NAME`: Restaurant name
   - `SITE_CITY`: City name
   - `SITE_COUNTRY`: Country code (e.g., IL)
   - `CUISINE`: Cuisine type

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the site:
   ```bash
   npm run build
   ```

5. Preview locally:
   ```bash
   npm run dev
   ```

## Airtable Schema

The generator expects these tables in your Airtable base:

### Events
- `Title` (Single line text)
- `Status` (Single select) - Only records with status starting with "publish" are included
- `Date` or `Start` (Date) - Event start date
- `End` (Date, optional) - Event end date
- `Description` (Long text, optional)
- `slug` (Single line text, optional) - Auto-generated if not provided
- `Menus` (Link to another record) - Linked menus
- `Packages` (Link to another record) - Linked packages
- `Image` (Attachment, optional) - Event image

### Menus
- `Title` (Single line text)
- `Dishes` (Link to another record) - Linked dishes
- `Description` (Long text, optional)
- `slug` (Single line text, optional) - Auto-generated if not provided
- `Image` (Attachment, optional) - Menu image

### Dishes
- `Title` (Single line text)
- `Price` (Number, optional) - Price in ILS
- `Category` (Single select, optional) - Dish category

### Packages
- `Title` (Single line text)
- `Price` (Number, optional) - Price in ILS
- `Description` (Long text, optional)
- `slug` (Single line text, optional) - Auto-generated if not provided
- `Image` (Attachment, optional) - Package image

## Features

- **SEO Optimized**: Pre-rendered HTML with JSON-LD structured data
- **RTL Ready**: Hebrew language support with right-to-left layout
- **Static Generation**: All content fetched at build time, no client-side API calls
- **Serverless Compatible**: Works with Vercel, Netlify, GitHub Pages, etc.
- **Responsive Design**: Mobile-friendly grid layout
- **Accessibility**: Semantic HTML and proper ARIA attributes

## Output

The build process generates:
- `index.html` - Homepage with featured events
- `events/` - Events listing and individual event pages
- `menus/` - Menus listing and individual menu pages
- `packages/` - Packages listing and individual package pages
- `sitemap.xml` - XML sitemap for search engines
- `robots.txt` - Search engine directives
- `styles.css` - Single CSS file with all styles

## Deployment

The `dist` folder contains all static files and can be deployed to any static hosting service:

- **Vercel**: Set output directory to `dist`
- **Netlify**: Set publish directory to `dist`
- **GitHub Pages**: Push `dist` contents to a deployment branch

## Security

- Never commit `.env` file
- Use read-only Airtable tokens
- No client-side API calls or token exposure

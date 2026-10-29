# Mise — Restaurant Inventory & Order Management

**A backend-ready restaurant service desk with a distinct cobalt/navy/coral operations UI.**

Mise is a high-contrast, quick-action restaurant operations workspace for Paloma Kitchen. Add ingredients, define a dish with its recipe, place an order, and watch the exact ingredient amounts leave your inventory automatically. It looks and behaves like an operational product while remaining honest about its browser-only demo mode.

## What works today

- **Overview** — revenue, kitchen order queue, stock alerts, inventory value, quick-start loop.
- **Orders** — add multiple dishes and quantities, choose dine-in/takeaway, enter a table and note, preview live stock impact, confirm the order, change status, cancel and automatically restore stock.
- **Inventory** — add ingredients with units, minimum levels and costs; search/filter; receive a delivery; view alerts and inventory value.
- **Menu & recipes** — create dishes, edit prices/descriptions/categories, define per-serving recipes with actual ingredient quantities, hide/publish dishes, and see maximum servings available.
- **Activity** — history of orders, stock changes and menu edits.
- **Settings** — edit restaurant name/location, restore sample workspace.
- **Data persistence** — mock adapter saves state to the current browser's localStorage. Refreshes retain changes. Default sample restaurant includes 14 ingredients, 5 recipes and 3 orders.
- **Safety logic** — combined ingredients across all dishes are checked before an order is accepted; order + deductions are saved in a single state mutation; cancellations restore an exact consumption snapshot even if a recipe changes later; cancelled orders cannot be cancelled twice.

This project does **not** have real user accounts, server-side database persistence, secure authorization, actual transaction processing, or multi-user synchronization yet. Sample orders and activity are synthetic.

## Run locally

Requires Node.js 20.19+ or 22+ (Node 22 recommended).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

Build and test:

```bash
npm run typecheck
npm run test
npm run build
npm run preview
```

## Deploy free to Cloudflare using GitHub

1. Create a **public GitHub repository** named `mise-restaurant` and push the **contents of this folder** to the repository root. Don't upload the ZIP as a single file.
2. In **Cloudflare Dashboard → Workers & Pages → Create application**, connect that GitHub repository. Choose the Workers deployment flow with your repository as the source (the exact UI wording varies).
3. Set **Build command** to `npm run build` and **Deploy command** to `npx wrangler deploy`. The repository includes `wrangler.jsonc` configuring static assets from `./dist` and single-page application fallback.
4. If Cloudflare asks for environment variables, add `VITE_DATA_MODE` with value `mock` before the build. This is also the default if you omit it.
5. Deploy. Cloudflare gives you a `.workers.dev` address. Future GitHub commits to the production branch automatically redeploy.

**Important:** There is intentionally **NO `public/_redirects` file**. It is not needed when using the Workers `assets.not_found_handling: "single-page-application"` setting and caused your earlier Cloudflare deployment to fail with an infinite redirect loop.

Alternative: Cloudflare **Pages** (if you choose that product): build command `npm run build`, output folder `dist`. Hash-based navigation works without a server-side router.

### Troubleshooting

- If Wrangler asks to initialize a project automatically, point it to the committed `wrangler.jsonc` rather than generating a second Vite/Worker scaffold.
- If your repo has an additional parent directory, either move source files to the root or set the correct root directory in Cloudflare.
- If browser data appears to reset, check whether localStorage is blocked or you are in incognito mode.
- If Cloudflare succeeds building but errors deploying, examine the **deployment** logs separately. The earlier `_redirects` rule should not be copied into this project.

## A backend-ready architecture

```
src/
├── components/         # Reusable UI, app context, navigation
├── features/           # Overview, orders, inventory, menu, modals, activity, settings
├── lib/                # Domain math and formatting helpers
├── models/types.ts     # Shared domain contracts
├── services/
│   ├── contract.ts     # RestaurantService interface
│   ├── mock.ts         # Async localStorage implementation
│   ├── api.ts          # Drop-in fetch client for real endpoints
│   ├── seed.ts         # Sample workspace
│   └── index.ts        # Select mock or API adapter
└── styles/             # Product-specific design system
```

**UI components never directly access localStorage or SQL.** They call the typed `RestaurantService` interface. The React provider manages loading, errors, changes and refreshes.

When the backend is ready, implement the HTTP endpoints described in [API_CONTRACT.md](API_CONTRACT.md), configure cookie-based authentication and tenant isolation, then set:

```env
VITE_DATA_MODE=api
VITE_API_BASE_URL=https://your-api.example.com/api
```

The provided real-API adapter includes `credentials: 'include'`, but a server must separately implement cookie/session authentication, CSRF protection, access controls, input validation and transactional inventory updates. Never treat frontend authorization or localStorage as security.

## Suggested next production milestones

1. Add server-side authentication and restaurant/workspace isolation.
2. Create PostgreSQL tables and indexes for restaurants, users, memberships, ingredients, recipes, orders, order lines, consumption snapshots, stock movements and activity.
3. Implement atomic stock deduction with locking/transactions and idempotency keys for order creation.
4. Support concurrent orders, audit log integrity, bounded stock adjustments and cancellation rules.
5. Add backend integration tests, structured error responses, observability and backups.

## Design direction

Mise has a warm editorial hospitality identity: deep green, ceramic cream, muted sage and copper; Instrument Serif headlines and DM Sans UI type. It intentionally differs from the cooler enterprise design of the Nodal authentication project. Mobile layouts, keyboard focus, empty states, validation feedback, and a visible 3-step first-time workflow are included.

## License

MIT. See [LICENSE](LICENSE).

## Visual identity — service desk edition

Mise deliberately does **not** share the Nodal authentication product's ivory-and-forest-green identity. The restaurant application uses a dark navy service rail, cobalt operational banner, coral CTAs, icy blue/white canvases, Space Grotesk body text and Barlow Condensed display typography. Compact ticket motifs and high-visibility stock alerts reference a restaurant dispatch station rather than an enterprise identity dashboard. The design is defined in `src/styles/service-desk.css`, separate from the mock data and services, so UI branding changes cannot affect future backend integration.

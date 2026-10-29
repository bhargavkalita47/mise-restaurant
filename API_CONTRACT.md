# Mise backend contract (future integration)

This spec matches `src/services/contract.ts` and the ready-to-use `ApiRestaurantService` adapter. Frontend remains fully runnable with the local mock adapter until a server is attached.

## Conventions

- API base URL: `VITE_API_BASE_URL` (default `/api`).
- Credentials: secure **httpOnly** session cookies, `credentials: include`; implement CORS/CSRF server-side when cross-origin.
- All requests must be authenticated and restaurant-scoped. **Never** trust a restaurant ID, user ID, price, recipe, inventory, or role supplied by a browser.
- The frontend expects JSON responses; empty writes can return 204.
- Errors: `{"message":"Plain-English, actionable error"}` and appropriate 4xx/5xx status.
- Date/time: ISO-8601 UTC strings; currency: integer or decimal INR values; quantities: decimal in units `g`, `ml`, `pcs`.
- Stable UUID IDs; dish/order history snapshots should not mutate when menu recipes are edited.

## Endpoints

| Method | Route | Input | Output |
| --- | --- | --- | --- |
| GET | `/state` | none | `RestaurantState` aggregated view |
| POST | `/ingredients` | `NewIngredient` | 204 |
| POST | `/ingredients/:id/restock` | `{amount: number}` | 204 |
| POST | `/menu` | `NewDish` | 204 |
| PUT | `/menu/:id` | `NewDish` | 204 |
| POST | `/menu/:id/toggle` | none | 204 |
| POST | `/orders` | `PlaceOrderInput` | `Order` |
| PATCH | `/orders/:id/status` | `{status: 'Preparing'|'Ready'|'Served'}` | 204 |
| POST | `/orders/:id/cancel` | none | 204 |
| PATCH | `/restaurant` | `{name, location}` | 204 |

`resetDemo` exists **only** in the mock adapter and should never be exposed to public production users.

## Critical invariants

### Order creation must be a transaction

1. Authenticate and authorize the acting staff member for this restaurant.
2. Validate active menu IDs, quantity 1..100, service type and dine-in table number.
3. Fetch current dish prices and recipes **on the server**; ignore any frontend price or consumption values.
4. Aggregate all required ingredients across all order lines.
5. Atomically lock inventory records, check available quantities and deduct exact amounts; never allow negative stock.
6. Persist order, order lines, immutable consumption snapshot, and stock movement ledger in the same transaction.
7. Return the committed `Order` object and updated aggregated state on the next GET `/state`.
8. Require an idempotency key for retry-safe POST `/orders` (extend adapter/request signature when backend is introduced).

### Order cancellation must be a transaction

- Authorize cancellation and enforce allowed state transitions.
- Re-credit **the original consumption snapshot**, not the current recipe.
- Atomically mark the order cancelled; reject repeated cancellations.
- Append an immutable audit event and one positive stock movement per affected ingredient.
- Use database transactions/locking to avoid double restores under concurrency.

### Inventory and recipes

- Check ingredients referenced by published recipes before deletion; prefer archiving.
- Validate measurement units and positive quantities. Prefer integer base units or database numeric instead of floating point to avoid accumulation errors.
- Record every stock adjustment and its actor.
- Scope all inventory, recipes, orders and activity queries using the authenticated restaurant membership.

## Suggested PostgreSQL tables

`restaurants`, `users`, `restaurant_memberships`, `ingredients`, `menu_items`, `recipes`, `recipe_ingredients`, `orders`, `order_lines`, `order_consumption`, `stock_movements`, `activity_events`, `idempotency_keys`.

## Mock mode limitations

- Browser-only `localStorage`: not shared between devices or browsers; easily edited by the user.
- No real authentication, tenancy, authorization, concurrency or database transactions.
- Stock mutations are synchronous in one browser tab and persisted as one JSON state; this is a *demonstration* of transactional behavior, not a multi-user database guarantee.
- Seed accounts, orders and metrics are simulated rather than live business records.

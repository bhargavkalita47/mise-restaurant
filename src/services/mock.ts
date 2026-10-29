import { createSeed } from './seed';
import { requiredStock, stockRequirements } from '../lib/logic';
import { uid } from '../lib/format';
import type { NewDish, NewIngredient, Order, OrderStatus, PlaceOrderInput, RestaurantState } from '../models/types';
import type { RestaurantService } from './contract';

const STORAGE_KEY = 'mise.restaurant.v1';
const clone = <T,>(value: T): T => structuredClone(value);
const pause = (milliseconds = 120) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
const round = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;
function positive(n: number, label: string, zero = false) {
  if (!Number.isFinite(n) || (zero ? n < 0 : n <= 0)) throw new Error(`${label} must be ${zero ? 'zero or greater' : 'greater than zero'}.`);
}
function read(): RestaurantState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeed();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || !('version' in parsed) || parsed.version !== 1 || !('ingredients' in parsed) || !Array.isArray(parsed.ingredients) || !('menu' in parsed) || !Array.isArray(parsed.menu) || !('orders' in parsed) || !Array.isArray(parsed.orders)) throw new Error('Invalid storage');
    return parsed as RestaurantState;
  } catch { return createSeed(); }
}
function save(state: RestaurantState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { throw new Error('Could not save locally. Check browser storage permissions and available space.'); }
}
function log(state: RestaurantState, kind: 'order' | 'stock' | 'menu' | 'setting', title: string, description: string) {
  state.activity.unshift({ id: uid(), kind, title, description, createdAt: new Date().toISOString() });
  state.activity = state.activity.slice(0, 300);
}
function validateDish(state: RestaurantState, data: NewDish) {
  if (!data.name.trim()) throw new Error('Enter a dish name.');
  if (!data.description.trim()) throw new Error('Enter a short dish description.');
  positive(data.price, 'Price');
  positive(data.prepMinutes, 'Preparation time');
  if (!data.recipe.length) throw new Error('Add at least one ingredient to the recipe.');
  const seen = new Set<string>();
  for (const line of data.recipe) {
    if (seen.has(line.ingredientId)) throw new Error('An ingredient can only appear once in a recipe.');
    seen.add(line.ingredientId);
    if (!state.ingredients.some((item) => item.id === line.ingredientId)) throw new Error('Recipe contains an unknown ingredient.');
    positive(line.quantity, 'Ingredient quantity');
  }
}

/** Fully local, asynchronous adapter. NOT real authentication or a multi-user backend. */
export class MockRestaurantService implements RestaurantService {
  async getState() { await pause(90); return clone(read()); }

  async addIngredient(input: NewIngredient) {
    await pause();
    const state = read();
    if (!input.name.trim()) throw new Error('Enter an ingredient name.');
    if (state.ingredients.some((item) => item.name.toLowerCase() === input.name.trim().toLowerCase())) throw new Error('An ingredient with that name already exists.');
    positive(input.quantity, 'Opening quantity', true);
    positive(input.reorderAt, 'Low-stock threshold', true);
    positive(input.unitCost, 'Unit cost', true);
    state.ingredients.unshift({ ...input, name: input.name.trim(), id: uid(), updatedAt: new Date().toISOString() });
    log(state, 'stock', `${input.name.trim()} added`, `${input.quantity} ${input.unit} opening stock`);
    save(state);
  }

  async restockIngredient(id: string, amount: number) {
    await pause();
    positive(amount, 'Restock quantity');
    const state = read();
    const ingredient = state.ingredients.find((item) => item.id === id);
    if (!ingredient) throw new Error('Ingredient not found.');
    ingredient.quantity = round(ingredient.quantity + amount);
    ingredient.updatedAt = new Date().toISOString();
    log(state, 'stock', `${ingredient.name} restocked`, `Added ${amount} ${ingredient.unit} · now ${ingredient.quantity} ${ingredient.unit}`);
    save(state);
  }

  async addDish(input: NewDish) {
    await pause();
    const state = read();
    validateDish(state, input);
    if (state.menu.some((dish) => dish.name.toLowerCase() === input.name.trim().toLowerCase())) throw new Error('That dish already exists.');
    state.menu.unshift({ ...clone(input), id: uid(), name: input.name.trim(), createdAt: new Date().toISOString() });
    log(state, 'menu', `${input.name.trim()} added to menu`, `${input.recipe.length} ingredients · ready to order`);
    save(state);
  }

  async updateDish(id: string, input: NewDish) {
    await pause();
    const state = read();
    validateDish(state, input);
    const dish = state.menu.find((item) => item.id === id);
    if (!dish) throw new Error('Dish not found.');
    if (state.menu.some((item) => item.id !== id && item.name.toLowerCase() === input.name.trim().toLowerCase())) throw new Error('That dish name is already in use.');
    Object.assign(dish, clone(input), { name: input.name.trim() });
    log(state, 'menu', `${dish.name} updated`, 'Recipe or menu details were changed');
    save(state);
  }

  async toggleDish(id: string) {
    await pause();
    const state = read();
    const dish = state.menu.find((item) => item.id === id);
    if (!dish) throw new Error('Dish not found.');
    dish.active = !dish.active;
    log(state, 'menu', `${dish.name} ${dish.active ? 'published' : 'hidden'}`, `Dish is ${dish.active ? 'available on the menu' : 'hidden from new orders'}`);
    save(state);
  }

  async placeOrder(input: PlaceOrderInput): Promise<Order> {
    await pause(180);
    const state = read();
    if (!input.lines.length) throw new Error('Choose at least one dish.');
    if (input.service === 'Dine in' && !input.tableLabel.trim()) throw new Error('Enter a table number for dine-in orders.');
    const ids = new Set<string>();
    for (const line of input.lines) {
      if (ids.has(line.menuItemId)) throw new Error('Duplicate dish lines.');
      ids.add(line.menuItemId);
    }
    const needed = requiredStock(state.menu, input.lines);
    const requirements = stockRequirements(state.ingredients, needed);
    const missing = requirements.filter((item) => !item.sufficient);
    if (missing.length) throw new Error(`Not enough ${missing.map((item) => item.ingredient.name).join(', ')}. Restock before placing this order.`);
    const time = new Date().toISOString();
    const lines = input.lines.map((line) => {
      const item = state.menu.find((dish) => dish.id === line.menuItemId);
      if (!item) throw new Error('Dish no longer exists.');
      return { menuItemId: item.id, name: item.name, quantity: line.quantity, unitPrice: item.price };
    });
    const order: Order = {
      id: uid(), number: state.nextOrderNumber++, service: input.service, tableLabel: input.tableLabel.trim(), note: input.note.trim(),
      lines, consumption: Array.from(needed, ([ingredientId, quantity]) => ({ ingredientId, quantity })),
      total: lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), status: 'Preparing', createdAt: time, updatedAt: time,
    };
    for (const requirement of requirements) {
      const ingredient = state.ingredients.find((item) => item.id === requirement.ingredient.id);
      if (!ingredient) throw new Error('Ingredient no longer exists.');
      ingredient.quantity = round(ingredient.quantity - requirement.required);
      ingredient.updatedAt = time;
    }
    state.orders.unshift(order);
    log(state, 'order', `Order #${order.number} placed`, `${input.service === 'Dine in' ? input.tableLabel : 'Takeaway'} · stock automatically deducted`);
    save(state); // one atomic state save, no partial stock deductions
    return clone(order);
  }

  async setOrderStatus(id: string, status: Exclude<OrderStatus, 'Cancelled'>) {
    await pause();
    const state = read();
    const order = state.orders.find((item) => item.id === id);
    if (!order) throw new Error('Order not found.');
    if (order.status === 'Cancelled') throw new Error('Cancelled orders cannot be changed.');
    if (!['Preparing', 'Ready', 'Served'].includes(status)) throw new Error('Invalid order status.');
    order.status = status;
    order.updatedAt = new Date().toISOString();
    log(state, 'order', `Order #${order.number} ${status.toLowerCase()}`, `${order.service === 'Dine in' ? order.tableLabel : 'Takeaway'} · order status changed`);
    save(state);
  }

  async cancelOrder(id: string) {
    await pause();
    const state = read();
    const order = state.orders.find((item) => item.id === id);
    if (!order) throw new Error('Order not found.');
    if (order.status === 'Cancelled') throw new Error('This order was already cancelled.');
    // Original consumption snapshot is used even if a recipe changes after the order.
    for (const consumed of order.consumption) {
      const ingredient = state.ingredients.find((item) => item.id === consumed.ingredientId);
      if (!ingredient) throw new Error('Cannot restore stock: an ingredient was deleted.');
      ingredient.quantity = round(ingredient.quantity + consumed.quantity);
      ingredient.updatedAt = new Date().toISOString();
    }
    order.status = 'Cancelled';
    order.updatedAt = new Date().toISOString();
    log(state, 'order', `Order #${order.number} cancelled`, 'All consumed ingredients returned to stock');
    save(state);
  }

  async updateRestaurant(input: { name: string; location: string }) {
    await pause();
    const state = read();
    if (!input.name.trim() || !input.location.trim()) throw new Error('Restaurant name and location are required.');
    state.restaurant.name = input.name.trim();
    state.restaurant.location = input.location.trim();
    log(state, 'setting', 'Restaurant updated', 'Workspace information changed');
    save(state);
  }
  async resetDemo() { await pause(); save(createSeed()); }
}

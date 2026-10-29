import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockRestaurantService } from '../src/services/mock';
import { maxServings, requiredStock, stockRequirements } from '../src/lib/logic';

const contents = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => contents.get(key) ?? null,
  setItem: (key: string, value: string) => { contents.set(key, value); },
  removeItem: (key: string) => { contents.delete(key); },
  clear: () => { contents.clear(); },
});

describe('Mise mock restaurant service', () => {
  beforeEach(() => contents.clear());
  it('seeds a complete and valid primary loop', async () => {
    const service = new MockRestaurantService();
    const data = await service.getState();
    expect(data.ingredients.length).toBeGreaterThan(5);
    expect(data.menu.length).toBeGreaterThan(3);
    expect(maxServings(data.menu[0]!, data.ingredients)).toBeGreaterThan(0);
  });
  it('deducts exact quantities from all recipe ingredients once', async () => {
    const service = new MockRestaurantService();
    const before = await service.getState();
    const order = await service.placeOrder({ service: 'Dine in', tableLabel: 'Table 12', note: '', lines: [{ menuItemId: 'dish-pizza', quantity: 2 }, { menuItemId: 'dish-coffee', quantity: 1 }] });
    const after = await service.getState();
    expect(after.orders[0]!.id).toBe(order.id);
    expect(after.nextOrderNumber).toBe(before.nextOrderNumber + 1);
    for (const consumption of order.consumption) {
      const oldStock = before.ingredients.find((x) => x.id === consumption.ingredientId)!;
      const newStock = after.ingredients.find((x) => x.id === consumption.ingredientId)!;
      expect(newStock.quantity).toBeCloseTo(oldStock.quantity - consumption.quantity, 3);
    }
    expect(order.total).toBe(2 * 490 + 240);
  });
  it('blocks out-of-stock orders without modifying inventory or order numbers', async () => {
    const service = new MockRestaurantService();
    const before = await service.getState();
    await expect(service.placeOrder({ service: 'Takeaway', tableLabel: '', note: '', lines: [{ menuItemId: 'dish-pizza', quantity: 100 }] })).rejects.toThrow('Not enough');
    const after = await service.getState();
    expect(after.ingredients).toEqual(before.ingredients);
    expect(after.nextOrderNumber).toBe(before.nextOrderNumber);
  });
  it('returns original stock on cancellation, even when the recipe changes later', async () => {
    const service = new MockRestaurantService();
    const initial = await service.getState();
    const order = await service.placeOrder({ service: 'Takeaway', tableLabel: '', note: '', lines: [{ menuItemId: 'dish-coffee', quantity: 2 }] });
    const later = await service.getState();
    const coffee = later.menu.find((x) => x.id === 'dish-coffee')!;
    await service.updateDish(coffee.id, { name: coffee.name, description: coffee.description, category: coffee.category, price: coffee.price, prepMinutes: coffee.prepMinutes, active: coffee.active, recipe: [{ ingredientId: 'ing-coffee', quantity: 40 }] });
    await service.cancelOrder(order.id);
    const final = await service.getState();
    expect(final.ingredients.map((x) => [x.id, x.quantity])).toEqual(initial.ingredients.map((x) => [x.id, x.quantity]));
    expect(final.orders.find((x) => x.id === order.id)!.status).toBe('Cancelled');
    await expect(service.cancelOrder(order.id)).rejects.toThrow('already cancelled');
  });
  it('supports restock and data persistence between service instances', async () => {
    const service = new MockRestaurantService();
    await service.addIngredient({ name: 'Fresh rosemary', category: 'Produce', unit: 'g', quantity: 50, reorderAt: 40, unitCost: 1 });
    const next = new MockRestaurantService();
    const herb = (await next.getState()).ingredients.find((x) => x.name === 'Fresh rosemary')!;
    await next.restockIngredient(herb.id, 80);
    expect((await service.getState()).ingredients.find((x) => x.id === herb.id)!.quantity).toBe(130);
  });
  it('calculates shared ingredient demand correctly across multiple menu items', async () => {
    const service = new MockRestaurantService();
    const data = await service.getState();
    const needed = requiredStock(data.menu, [{ menuItemId: 'dish-pizza', quantity: 1 }, { menuItemId: 'dish-salad', quantity: 2 }]);
    expect(needed.get('ing-tomato')).toBe(120 + 2 * 180);
    expect(stockRequirements(data.ingredients, needed).every((x) => x.sufficient)).toBeTruthy();
  });
});

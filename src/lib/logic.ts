import type { Ingredient, MenuItem, Order, RestaurantState, StockRequirement } from '../models/types';

export function requiredStock(menu: MenuItem[], lines: { menuItemId: string; quantity: number }[]): Map<string, number> {
  const required = new Map<string, number>();
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0 || line.quantity > 100) throw new Error('Enter a valid quantity between 1 and 100.');
    const dish = menu.find((item) => item.id === line.menuItemId);
    if (!dish || !dish.active) throw new Error('One of these dishes is no longer available.');
    if (!dish.recipe.length) throw new Error(`${dish.name} needs a recipe before it can be ordered.`);
    for (const ingredient of dish.recipe) required.set(ingredient.ingredientId, (required.get(ingredient.ingredientId) ?? 0) + ingredient.quantity * line.quantity);
  }
  return required;
}
export function stockRequirements(ingredients: Ingredient[], required: Map<string, number>): StockRequirement[] {
  return Array.from(required.entries()).map(([id, amount]) => {
    const ingredient = ingredients.find((item) => item.id === id);
    if (!ingredient) throw new Error('An ingredient in the recipe was removed. Edit the recipe before taking an order.');
    return { ingredient, required: amount, available: ingredient.quantity, sufficient: ingredient.quantity + 0.00001 >= amount };
  });
}
export function maxServings(dish: MenuItem, ingredients: Ingredient[]): number {
  if (!dish.active || !dish.recipe.length) return 0;
  return Math.max(0, Math.min(...dish.recipe.map((entry) => {
    const item = ingredients.find((stock) => stock.id === entry.ingredientId);
    return item && entry.quantity > 0 ? Math.floor((item.quantity + 0.00001) / entry.quantity) : 0;
  })));
}
export function lowStock(ingredients: Ingredient[]) { return ingredients.filter((item) => item.quantity <= item.reorderAt).sort((a, b) => (a.reorderAt ? a.quantity / a.reorderAt : 1) - (b.reorderAt ? b.quantity / b.reorderAt : 1)); }
export function inventoryValue(ingredients: Ingredient[]) { return ingredients.reduce((value, item) => value + item.quantity * item.unitCost, 0); }
export function orderItemCount(order: Order) { return order.lines.reduce((sum, line) => sum + line.quantity, 0); }
export function revenue(orders: Order[]) { return orders.filter((order) => order.status !== 'Cancelled').reduce((sum, order) => sum + order.total, 0); }
export function todayOrders(state: RestaurantState) { return state.orders.filter((order) => new Date(order.createdAt).toDateString() === new Date().toDateString()); }

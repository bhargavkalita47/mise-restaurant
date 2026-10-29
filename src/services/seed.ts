import type { RestaurantState, Ingredient, MenuItem, Activity, Order } from '../models/types';
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const stock = (id: string, name: string, category: Ingredient['category'], unit: Ingredient['unit'], quantity: number, reorderAt: number, unitCost: number): Ingredient => ({ id, name, category, unit, quantity, reorderAt, unitCost, updatedAt: ago(48) });
const dish = (id: string, name: string, description: string, category: MenuItem['category'], price: number, prepMinutes: number, recipe: [string, number][]): MenuItem => ({ id, name, description, category, price, prepMinutes, recipe: recipe.map(([ingredientId, quantity]) => ({ ingredientId, quantity })), active: true, createdAt: ago(2000) });

export function createSeed(): RestaurantState {
  const ingredients: Ingredient[] = [
    stock('ing-dough', 'Pizza dough', 'Bakery', 'pcs', 22, 6, 45),
    stock('ing-tomato', 'Cherry tomatoes', 'Produce', 'g', 1450, 700, 0.28),
    stock('ing-mozzarella', 'Fresh mozzarella', 'Dairy', 'g', 930, 650, 0.9),
    stock('ing-basil', 'Fresh basil', 'Produce', 'g', 90, 100, 2.5),
    stock('ing-olive', 'Extra virgin olive oil', 'Pantry', 'ml', 1900, 500, 0.7),
    stock('ing-pasta', 'Penne pasta', 'Pantry', 'g', 3000, 1000, 0.17),
    stock('ing-mushrooms', 'Wild mushrooms', 'Produce', 'g', 490, 600, 0.8),
    stock('ing-parmesan', 'Parmesan', 'Dairy', 'g', 780, 350, 1.5),
    stock('ing-cream', 'Fresh cream', 'Dairy', 'ml', 1100, 400, 0.34),
    stock('ing-coffee', 'Coffee beans', 'Beverages', 'g', 780, 500, 1.2),
    stock('ing-milk', 'Whole milk', 'Dairy', 'ml', 3200, 1500, 0.08),
    stock('ing-croissant', 'Butter croissant', 'Bakery', 'pcs', 8, 10, 52),
    stock('ing-arugula', 'Arugula', 'Produce', 'g', 260, 200, 0.75),
    stock('ing-butter', 'Salted butter', 'Dairy', 'g', 720, 300, 0.6),
  ];
  const menu: MenuItem[] = [
    dish('dish-pizza', 'Margherita pizza', 'San Marzano tomatoes, basil, fresh mozzarella', 'Mains', 490, 18, [['ing-dough', 1], ['ing-tomato', 120], ['ing-mozzarella', 130], ['ing-basil', 12], ['ing-olive', 15]]),
    dish('dish-pasta', 'Wild mushroom pasta', 'Creamy mushrooms, parmesan and cracked pepper', 'Mains', 540, 20, [['ing-pasta', 140], ['ing-mushrooms', 160], ['ing-parmesan', 35], ['ing-cream', 90]]),
    dish('dish-salad', 'Summer caprese', 'Cherry tomatoes, creamy mozzarella and basil', 'Small plates', 390, 10, [['ing-tomato', 180], ['ing-mozzarella', 110], ['ing-basil', 9], ['ing-olive', 12], ['ing-arugula', 30]]),
    dish('dish-coffee', 'Flat white', 'Double espresso with silky steamed milk', 'Coffee & drinks', 240, 5, [['ing-coffee', 18], ['ing-milk', 170]]),
    dish('dish-croissant', 'Butter croissant', 'Baked fresh, served warm with salted butter', 'Bakery', 210, 3, [['ing-croissant', 1], ['ing-butter', 12]]),
  ];
  const orders: Order[] = [
    { id: 'order-sample-1', number: 1041, service: 'Dine in', tableLabel: 'Table 04', note: '', lines: [{ menuItemId: 'dish-pizza', name: 'Margherita pizza', quantity: 2, unitPrice: 490 }, { menuItemId: 'dish-coffee', name: 'Flat white', quantity: 2, unitPrice: 240 }], consumption: [], total: 1460, status: 'Served', createdAt: ago(126), updatedAt: ago(92) },
    { id: 'order-sample-2', number: 1042, service: 'Dine in', tableLabel: 'Table 08', note: 'No extra salt', lines: [{ menuItemId: 'dish-pasta', name: 'Wild mushroom pasta', quantity: 1, unitPrice: 540 }, { menuItemId: 'dish-salad', name: 'Summer caprese', quantity: 1, unitPrice: 390 }], consumption: [], total: 930, status: 'Ready', createdAt: ago(44), updatedAt: ago(18) },
    { id: 'order-sample-3', number: 1043, service: 'Takeaway', tableLabel: '', note: '', lines: [{ menuItemId: 'dish-coffee', name: 'Flat white', quantity: 2, unitPrice: 240 }, { menuItemId: 'dish-croissant', name: 'Butter croissant', quantity: 1, unitPrice: 210 }], consumption: [], total: 690, status: 'Preparing', createdAt: ago(11), updatedAt: ago(11) },
  ];
  for (const order of orders) {
    const totals = new Map<string, number>();
    for (const line of order.lines) {
      const found = menu.find((item) => item.id === line.menuItemId);
      if (found) for (const ingredient of found.recipe) totals.set(ingredient.ingredientId, (totals.get(ingredient.ingredientId) ?? 0) + ingredient.quantity * line.quantity);
    }
    order.consumption = Array.from(totals, ([ingredientId, quantity]) => ({ ingredientId, quantity }));
  }
  const activity: Activity[] = [
    { id: 'act-1', kind: 'order', title: 'Order #1043 placed', description: 'Takeaway · 3 items · stock deducted', createdAt: ago(11) },
    { id: 'act-2', kind: 'order', title: 'Order #1042 ready', description: 'Table 08 is ready to serve', createdAt: ago(18) },
    { id: 'act-3', kind: 'stock', title: 'Fresh delivery received', description: 'Whole milk and coffee beans restocked', createdAt: ago(75) },
    { id: 'act-4', kind: 'order', title: 'Order #1041 served', description: 'Table 04 · 4 items', createdAt: ago(92) },
    { id: 'act-5', kind: 'menu', title: 'Menu updated', description: 'Summer caprese recipe adjusted', createdAt: ago(680) },
  ];

  return { version: 1, restaurant: { name: 'Paloma Kitchen', location: 'Indiranagar, Bengaluru', currency: 'INR' }, ingredients, menu, orders, activity, nextOrderNumber: 1044 };
}

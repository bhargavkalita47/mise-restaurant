export type IngredientCategory = 'Produce' | 'Dairy' | 'Pantry' | 'Bakery' | 'Beverages' | 'Other';
export type IngredientUnit = 'g' | 'ml' | 'pcs';
export type MenuCategory = 'Mains' | 'Small plates' | 'Coffee & drinks' | 'Bakery';
export type OrderStatus = 'Preparing' | 'Ready' | 'Served' | 'Cancelled';
export type ServiceType = 'Dine in' | 'Takeaway';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: IngredientUnit;
  quantity: number;
  reorderAt: number;
  unitCost: number; // INR per stock unit
  updatedAt: string;
}
export interface RecipeLine { ingredientId: string; quantity: number; }
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  price: number; // INR
  prepMinutes: number;
  recipe: RecipeLine[];
  active: boolean;
  createdAt: string;
}
export interface OrderLine {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}
export interface Order {
  id: string;
  number: number;
  service: ServiceType;
  tableLabel: string;
  note: string;
  lines: OrderLine[];
  consumption: { ingredientId: string; quantity: number }[]; // exact snapshot for safe cancellation
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
export type ActivityKind = 'order' | 'stock' | 'menu' | 'setting';
export interface Activity {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  createdAt: string;
}
export interface Restaurant {
  name: string;
  location: string;
  currency: 'INR';
}
export interface RestaurantState {
  version: 1;
  restaurant: Restaurant;
  ingredients: Ingredient[];
  menu: MenuItem[];
  orders: Order[];
  activity: Activity[];
  nextOrderNumber: number;
}
export type NewIngredient = Omit<Ingredient, 'id' | 'updatedAt'>;
export type NewDish = Omit<MenuItem, 'id' | 'createdAt'>;
export interface PlaceOrderInput {
  service: ServiceType;
  tableLabel: string;
  note: string;
  lines: { menuItemId: string; quantity: number }[];
}
export interface StockRequirement {
  ingredient: Ingredient;
  required: number;
  available: number;
  sufficient: boolean;
}

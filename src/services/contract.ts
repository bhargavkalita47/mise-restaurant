import type { NewDish, NewIngredient, Order, OrderStatus, PlaceOrderInput, RestaurantState } from '../models/types';

/** The UI only talks to this contract. Real APIs implement the exact same signatures. */
export interface RestaurantService {
  getState(): Promise<RestaurantState>;
  addIngredient(input: NewIngredient): Promise<void>;
  restockIngredient(id: string, amount: number): Promise<void>;
  addDish(input: NewDish): Promise<void>;
  updateDish(id: string, input: NewDish): Promise<void>;
  toggleDish(id: string): Promise<void>;
  placeOrder(input: PlaceOrderInput): Promise<Order>;
  setOrderStatus(id: string, status: Exclude<OrderStatus, 'Cancelled'>): Promise<void>;
  cancelOrder(id: string): Promise<void>;
  updateRestaurant(input: { name: string; location: string }): Promise<void>;
  resetDemo(): Promise<void>;
}

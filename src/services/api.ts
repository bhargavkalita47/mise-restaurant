import type { NewDish, NewIngredient, Order, OrderStatus, PlaceOrderInput, RestaurantState } from '../models/types';
import type { RestaurantService } from './contract';

/** Drop-in production transport. Server must authenticate requests and enforce all invariants. */
export class ApiRestaurantService implements RestaurantService {
  private base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  private async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await fetch(`${this.base}${path}`, {
      method,
      credentials: 'include', // httpOnly session cookie; don't keep bearer tokens in localStorage
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      const message = payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string' ? payload.message : `Request failed (${response.status}).`;
      throw new Error(message);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
  getState() { return this.request<RestaurantState>('/state'); }
  addIngredient(input: NewIngredient) { return this.request<void>('/ingredients', 'POST', input); }
  restockIngredient(id: string, amount: number) { return this.request<void>(`/ingredients/${encodeURIComponent(id)}/restock`, 'POST', { amount }); }
  addDish(input: NewDish) { return this.request<void>('/menu', 'POST', input); }
  updateDish(id: string, input: NewDish) { return this.request<void>(`/menu/${encodeURIComponent(id)}`, 'PUT', input); }
  toggleDish(id: string) { return this.request<void>(`/menu/${encodeURIComponent(id)}/toggle`, 'POST'); }
  placeOrder(input: PlaceOrderInput) { return this.request<Order>('/orders', 'POST', input); }
  setOrderStatus(id: string, status: Exclude<OrderStatus, 'Cancelled'>) { return this.request<void>(`/orders/${encodeURIComponent(id)}/status`, 'PATCH', { status }); }
  cancelOrder(id: string) { return this.request<void>(`/orders/${encodeURIComponent(id)}/cancel`, 'POST'); }
  updateRestaurant(input: { name: string; location: string }) { return this.request<void>('/restaurant', 'PATCH', input); }
  async resetDemo(): Promise<void> { throw new Error('Reset is available only in the local sample workspace.'); }
}

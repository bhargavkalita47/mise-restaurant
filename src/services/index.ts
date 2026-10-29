import { ApiRestaurantService } from './api';
import { MockRestaurantService } from './mock';
import type { RestaurantService } from './contract';

export const isDemo = import.meta.env.VITE_DATA_MODE !== 'api';
export const restaurantService: RestaurantService = isDemo ? new MockRestaurantService() : new ApiRestaurantService();

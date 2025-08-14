import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '../types/store';
import { ServiceRequirements } from './usePaymentStore';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Order {
  id: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  items: CartItem[];
  status: OrderStatus;
  paymentIntentId?: string;
  serviceRequirements: ServiceRequirements;
  createdAt: Date;
  completedAt?: Date;
  updatedAt?: Date;
  total: number;
  subtotal: number;
  gst: number;
  promoCode?: string;
  promoDiscount?: number;
  paymentMethod?: string;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt'>) => Promise<string>;
  getOrderById: (orderId: string) => Order | undefined;
  getUserOrders: (userId?: string) => Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  setCurrentOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearOrders: () => void;
}

const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      isLoading: false,
      error: null,

      createOrder: async (orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> => {
        set({ isLoading: true, error: null });
        
        try {
          // Generate a unique order ID
          const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const newOrder: Order = {
            ...orderData,
            id: orderId,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          set(state => ({
            orders: [newOrder, ...state.orders],
            currentOrder: newOrder,
            isLoading: false
          }));

          // In a real implementation, this would make an API call
          // await orderApi.createOrder(newOrder);
          
          return orderId;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      getOrderById: (orderId: string): Order | undefined => {
        return get().orders.find(order => order.id === orderId);
      },

      getUserOrders: (userId?: string): Order[] => {
        const orders = get().orders;
        if (!userId) {
          return orders;
        }
        return orders.filter(order => order.userId === userId);
      },

      updateOrderStatus: (orderId: string, status: OrderStatus) => {
        set(state => ({
          orders: state.orders.map(order =>
            order.id === orderId
              ? { ...order, status, updatedAt: new Date() }
              : order
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, status, updatedAt: new Date() }
            : state.currentOrder
        }));
      },

      setCurrentOrder: (order: Order | null) => {
        set({ currentOrder: order });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearOrders: () => {
        set({ orders: [], currentOrder: null, error: null });
      }
    }),
    {
      name: 'ausjobs-orders',
      partialize: (state) => ({
        orders: state.orders,
        currentOrder: state.currentOrder
      })
    }
  )
);

export default useOrderStore;
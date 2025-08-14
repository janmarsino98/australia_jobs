import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus, CreateOrderRequest, ApiError } from '../types/api';
import { orderApi, orderApiUtils } from '../services/orderApi';

// Hook interface
export interface UseOrdersReturn {
  // Data
  orders: Order[];
  selectedOrder: Order | null;
  orderHistory: { orders: Order[]; total: number; };
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  
  // Error states
  error: ApiError | null;
  createError: ApiError | null;
  updateError: ApiError | null;
  
  // Actions
  fetchOrders: (userId?: string) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<Order | null>;
  createOrder: (orderData: CreateOrderRequest) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<Order | null>;
  cancelOrder: (orderId: string, reason?: string) => Promise<Order | null>;
  fetchOrderHistory: (page?: number, limit?: number) => Promise<void>;
  
  // Utilities
  refresh: () => Promise<void>;
  clearErrors: () => void;
}

// Main orders hook
export const useOrders = (userId?: string): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<{ orders: Order[]; total: number; }>({ orders: [], total: 0 });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [error, setError] = useState<ApiError | null>(null);
  const [createError, setCreateError] = useState<ApiError | null>(null);
  const [updateError, setUpdateError] = useState<ApiError | null>(null);

  // Fetch user orders
  const fetchOrders = useCallback(async (userIdParam?: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await orderApi.getUserOrders(userIdParam || userId);
      setOrders(orderApiUtils.sortOrdersByDate(data));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to fetch orders:', apiError);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch single order
  const fetchOrder = useCallback(async (orderId: string): Promise<Order | null> => {
    try {
      setError(null);
      
      const order = await orderApi.getOrderById(orderId);
      setSelectedOrder(order);
      return order;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to fetch order:', apiError);
      return null;
    }
  }, []);

  // Create new order
  const createOrder = useCallback(async (orderData: CreateOrderRequest): Promise<Order | null> => {
    try {
      setIsCreating(true);
      setCreateError(null);
      
      // Validate order data
      const validation = orderApiUtils.validateOrderData(orderData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      const order = await orderApi.createOrder(orderData);
      
      // Add to local orders list
      setOrders(prevOrders => orderApiUtils.sortOrdersByDate([order, ...prevOrders]));
      
      return order;
    } catch (err) {
      const apiError = err as ApiError;
      setCreateError(apiError);
      console.error('Failed to create order:', apiError);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<Order | null> => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      const updatedOrder = await orderApi.updateOrderStatus(orderId, status);
      
      // Update local orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? updatedOrder : order
        )
      );
      
      // Update selected order if it matches
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      
      return updatedOrder;
    } catch (err) {
      const apiError = err as ApiError;
      setUpdateError(apiError);
      console.error('Failed to update order status:', apiError);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [selectedOrder]);

  // Cancel order
  const cancelOrder = useCallback(async (orderId: string, reason?: string): Promise<Order | null> => {
    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      const cancelledOrder = await orderApi.cancelOrder(orderId, reason);
      
      // Update local orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? cancelledOrder : order
        )
      );
      
      // Update selected order if it matches
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(cancelledOrder);
      }
      
      return cancelledOrder;
    } catch (err) {
      const apiError = err as ApiError;
      setUpdateError(apiError);
      console.error('Failed to cancel order:', apiError);
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [selectedOrder]);

  // Fetch order history with pagination
  const fetchOrderHistory = useCallback(async (page = 1, limit = 10): Promise<void> => {
    try {
      setError(null);
      
      const data = await orderApi.getOrderHistory(page, limit);
      setOrderHistory(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to fetch order history:', apiError);
    }
  }, []);

  // Refresh orders
  const refresh = useCallback(async (): Promise<void> => {
    await fetchOrders();
  }, [fetchOrders]);

  // Clear errors
  const clearErrors = useCallback((): void => {
    setError(null);
    setCreateError(null);
    setUpdateError(null);
  }, []);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    // Data
    orders,
    selectedOrder,
    orderHistory,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    
    // Error states
    error,
    createError,
    updateError,
    
    // Actions
    fetchOrders,
    fetchOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    fetchOrderHistory,
    
    // Utilities
    refresh,
    clearErrors
  };
};

// Hook for single order
export const useOrder = (orderId?: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchOrder = useCallback(async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await orderApi.getOrderById(id);
      setOrder(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to fetch order:', apiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId, fetchOrder]);

  const updateStatus = useCallback(async (status: OrderStatus): Promise<boolean> => {
    if (!orderId) return false;
    
    try {
      const updatedOrder = await orderApi.updateOrderStatus(orderId, status);
      setOrder(updatedOrder);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to update order status:', apiError);
      return false;
    }
  }, [orderId]);

  const cancel = useCallback(async (reason?: string): Promise<boolean> => {
    if (!orderId) return false;
    
    try {
      const cancelledOrder = await orderApi.cancelOrder(orderId, reason);
      setOrder(cancelledOrder);
      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error('Failed to cancel order:', apiError);
      return false;
    }
  }, [orderId]);

  return {
    order,
    isLoading,
    error,
    refetch: orderId ? () => fetchOrder(orderId) : undefined,
    updateStatus,
    cancel,
    canCancel: order ? orderApiUtils.canCancelOrder(order) : false,
    isCompleted: order ? orderApiUtils.isOrderFinal(order) : false
  };
};

// Hook for order statistics
export const useOrderStats = (orders: Order[] = []) => {
  const stats = {
    total: orders.length,
    totalValue: orderApiUtils.calculateOrdersTotal(orders),
    byStatus: {
      pending: orderApiUtils.filterOrdersByStatus(orders, [OrderStatus.PENDING]).length,
      paid: orderApiUtils.filterOrdersByStatus(orders, [OrderStatus.PAID]).length,
      processing: orderApiUtils.filterOrdersByStatus(orders, [OrderStatus.PROCESSING]).length,
      completed: orderApiUtils.filterOrdersByStatus(orders, [OrderStatus.COMPLETED]).length,
      failed: orderApiUtils.filterOrdersByStatus(orders, [OrderStatus.FAILED]).length,
      cancelled: orderApiUtils.filterOrdersByStatus(orders, [OrderStatus.CANCELLED]).length
    },
    recentOrders: orderApiUtils.sortOrdersByDate(orders).slice(0, 5),
    averageOrderValue: orders.length > 0 ? orderApiUtils.calculateOrdersTotal(orders) / orders.length : 0
  };

  return stats;
};

export default useOrders;
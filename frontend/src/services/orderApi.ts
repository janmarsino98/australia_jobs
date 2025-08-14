import httpClient from '../httpClient';
import {
  Order,
  OrderStatus,
  CreateOrderRequest,
  OrderResponse,
  OrdersResponse,
  ApiError
} from '../types/api';

// Order API Service Interface
export interface OrderApiService {
  createOrder: (orderData: CreateOrderRequest) => Promise<Order>;
  getOrderById: (orderId: string) => Promise<Order>;
  getUserOrders: (userId?: string) => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<Order>;
  cancelOrder: (orderId: string, reason?: string) => Promise<Order>;
  getOrderHistory: (page?: number, limit?: number) => Promise<{ orders: Order[]; total: number; }>;
}

// Error handling utility
const handleApiError = (error: any): never => {
  if (error.response?.data) {
    const apiError: ApiError = {
      message: error.response.data.message || error.response.data.error || 'An error occurred',
      code: error.response.data.code,
      field: error.response.data.field,
      details: error.response.data.details
    };
    throw apiError;
  }
  
  if (error.request) {
    throw new Error('Network error - unable to reach server');
  }
  
  throw new Error(error.message || 'An unexpected error occurred');
};

// Order API implementation
export const orderApi: OrderApiService = {
  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      // Validate required fields
      if (!orderData.customerDetails?.email) {
        throw new Error('Customer email is required');
      }
      
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      const response = await httpClient.post<OrderResponse>('/api/orders', {
        ...orderData,
        createdAt: new Date().toISOString()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create order');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Fetch order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await httpClient.get<OrderResponse>(`/api/orders/${orderId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch order');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Fetch orders for a user (or current user if no userId provided)
   */
  async getUserOrders(userId?: string): Promise<Order[]> {
    try {
      const url = userId ? `/api/orders/user/${userId}` : '/api/orders/user';
      const response = await httpClient.get<OrdersResponse>(url);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch user orders');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      if (!Object.values(OrderStatus).includes(status)) {
        throw new Error('Invalid order status');
      }

      const response = await httpClient.patch<OrderResponse>(`/api/orders/${orderId}/status`, {
        status,
        updatedAt: new Date().toISOString()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update order status');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const response = await httpClient.patch<OrderResponse>(`/api/orders/${orderId}/cancel`, {
        reason,
        cancelledAt: new Date().toISOString()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to cancel order');
      }
      
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get paginated order history
   */
  async getOrderHistory(page = 1, limit = 10): Promise<{ orders: Order[]; total: number; }> {
    try {
      const response = await httpClient.get(`/api/orders/history`, {
        params: { page, limit }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch order history');
      }
      
      return {
        orders: response.data.data,
        total: response.data.meta?.totalItems || response.data.data.length
      };
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Utility functions for order operations
export const orderApiUtils = {
  /**
   * Check if order can be cancelled
   */
  canCancelOrder: (order: Order): boolean => {
    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.PAID];
    return cancellableStatuses.includes(order.status);
  },

  /**
   * Check if order is in a final state
   */
  isOrderFinal: (order: Order): boolean => {
    const finalStatuses = [OrderStatus.COMPLETED, OrderStatus.FAILED, OrderStatus.CANCELLED];
    return finalStatuses.includes(order.status);
  },

  /**
   * Calculate order processing time
   */
  calculateProcessingTime: (order: Order): string => {
    if (order.completedAt && order.createdAt) {
      const created = new Date(order.createdAt);
      const completed = new Date(order.completedAt);
      const diffMs = completed.getTime() - created.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      }
    }
    return 'N/A';
  },

  /**
   * Get status display text
   */
  getStatusDisplayText: (status: OrderStatus): string => {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pending Payment',
      [OrderStatus.PAID]: 'Payment Received',
      [OrderStatus.PROCESSING]: 'In Progress',
      [OrderStatus.COMPLETED]: 'Completed',
      [OrderStatus.FAILED]: 'Failed',
      [OrderStatus.CANCELLED]: 'Cancelled'
    };
    return statusMap[status] || status;
  },

  /**
   * Get status color class for UI
   */
  getStatusColorClass: (status: OrderStatus): string => {
    const colorMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'text-yellow-600 bg-yellow-100',
      [OrderStatus.PAID]: 'text-blue-600 bg-blue-100',
      [OrderStatus.PROCESSING]: 'text-purple-600 bg-purple-100',
      [OrderStatus.COMPLETED]: 'text-green-600 bg-green-100',
      [OrderStatus.FAILED]: 'text-red-600 bg-red-100',
      [OrderStatus.CANCELLED]: 'text-gray-600 bg-gray-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  },

  /**
   * Sort orders by creation date (newest first)
   */
  sortOrdersByDate: (orders: Order[], ascending = false): Order[] => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  },

  /**
   * Filter orders by status
   */
  filterOrdersByStatus: (orders: Order[], statuses: OrderStatus[]): Order[] => {
    return orders.filter(order => statuses.includes(order.status));
  },

  /**
   * Calculate total value of orders
   */
  calculateOrdersTotal: (orders: Order[]): number => {
    return orders.reduce((total, order) => total + order.total, 0);
  },

  /**
   * Format order reference number
   */
  formatOrderReference: (orderId: string): string => {
    // Take last 8 characters and format as XXX-XXXXX
    const ref = orderId.slice(-8).toUpperCase();
    return `${ref.slice(0, 3)}-${ref.slice(3)}`;
  },

  /**
   * Get estimated completion date
   */
  getEstimatedCompletion: (order: Order): Date | null => {
    if (order.status === OrderStatus.COMPLETED) {
      return new Date(order.completedAt!);
    }
    
    if (order.status === OrderStatus.PROCESSING) {
      // Estimate based on service delivery times
      const fastestDelivery = Math.min(
        ...order.items.map(item => {
          const deliveryTime = item.deliveryTime.toLowerCase();
          if (deliveryTime.includes('instant')) return 0;
          if (deliveryTime.includes('hour')) {
            const hours = parseInt(deliveryTime.match(/\d+/)?.[0] || '1');
            return hours;
          }
          if (deliveryTime.includes('day')) {
            const days = parseInt(deliveryTime.match(/\d+/)?.[0] || '1');
            return days * 24;
          }
          return 48; // Default 2 days
        })
      );
      
      const estimatedDate = new Date(order.createdAt);
      estimatedDate.setHours(estimatedDate.getHours() + fastestDelivery);
      return estimatedDate;
    }
    
    return null;
  },

  /**
   * Validate order data before submission
   */
  validateOrderData: (orderData: CreateOrderRequest): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Validate customer details
    if (!orderData.customerDetails?.email) {
      errors.push('Customer email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.customerDetails.email)) {
      errors.push('Valid email address is required');
    }
    
    if (!orderData.customerDetails?.firstName) {
      errors.push('First name is required');
    }
    
    if (!orderData.customerDetails?.lastName) {
      errors.push('Last name is required');
    }
    
    // Validate items
    if (!orderData.items || orderData.items.length === 0) {
      errors.push('At least one item is required');
    }
    
    orderData.items?.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.price < 0) {
        errors.push(`Item ${index + 1}: Price cannot be negative`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

export default orderApi;
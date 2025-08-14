import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, CartState } from '../types/store';
import { STORE_PRODUCTS } from './useStoreStore';

const CART_STORAGE_KEY = 'ausjobs-cart';

const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            subtotal: 0,
            gst: 0,
            total: 0,
            promoCode: undefined,
            promoDiscount: 0,
            isOpen: false,

            // Actions
            addItem: (product: Product) => {
                const existingItems = get().items;
                
                // Handle conflicts first
                const resolvedItems = resolveConflicts(existingItems, product);
                
                // Check if item already exists
                const existingItem = resolvedItems.find(item => item.productId === product.id);
                
                let newItems: CartItem[];
                if (existingItem) {
                    // Update quantity for existing item
                    newItems = resolvedItems.map(item =>
                        item.productId === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                } else {
                    // Add new item
                    const cartItem: CartItem = {
                        id: `cart-${Date.now()}-${product.id}`,
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        category: product.category,
                        quantity: 1,
                        deliveryTime: product.deliveryTime,
                        conflictsWith: product.metadata.includedServices
                    };
                    newItems = [...resolvedItems, cartItem];
                }

                set({ items: newItems });
                get().calculateTotals();
            },

            removeItem: (itemId: string) => {
                const newItems = get().items.filter(item => item.id !== itemId);
                set({ items: newItems });
                get().calculateTotals();
            },

            updateQuantity: (itemId: string, quantity: number) => {
                if (quantity <= 0) {
                    get().removeItem(itemId);
                    return;
                }

                const newItems = get().items.map(item =>
                    item.id === itemId ? { ...item, quantity } : item
                );
                set({ items: newItems });
                get().calculateTotals();
            },

            clearCart: () => {
                set({ 
                    items: [], 
                    subtotal: 0, 
                    gst: 0, 
                    total: 0, 
                    promoCode: undefined, 
                    promoDiscount: 0 
                });
            },

            applyPromoCode: async (code: string) => {
                // Mock promo code validation - Agent 5 will replace with API call
                const mockPromoCodes = {
                    'SAVE10': { discount: 0.1, description: '10% off' },
                    'WELCOME': { discount: 0.15, description: '15% welcome discount' },
                    'FIRSTTIME': { discount: 0.2, description: '20% first-time customer' }
                };

                const promo = mockPromoCodes[code as keyof typeof mockPromoCodes];
                if (promo) {
                    set({ promoCode: code, promoDiscount: promo.discount });
                    get().calculateTotals();
                } else {
                    throw new Error('Invalid promo code');
                }
            },

            removePromoCode: () => {
                set({ promoCode: undefined, promoDiscount: 0 });
                get().calculateTotals();
            },

            toggleCart: () => {
                set(state => ({ isOpen: !state.isOpen }));
            },

            getRecommendations: (): Product[] => {
                const cartItems = get().items;
                return getPackageRecommendations(cartItems);
            },

            resolveConflicts: (newItem: Product) => {
                const existingItems = get().items;
                const resolvedItems = resolveConflicts(existingItems, newItem);
                set({ items: resolvedItems });
                get().calculateTotals();
            },

            calculateTotals: () => {
                const { items, promoDiscount } = get();
                const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const discountAmount = subtotal * promoDiscount;
                const discountedSubtotal = subtotal - discountAmount;
                const gst = discountedSubtotal * 0.1; // 10% GST for Australia
                const total = discountedSubtotal + gst;

                set({ 
                    subtotal: Number(subtotal.toFixed(2)), 
                    gst: Number(gst.toFixed(2)), 
                    total: Number(total.toFixed(2)) 
                });
            }
        }),
        {
            name: CART_STORAGE_KEY,
            partialize: (state) => ({
                items: state.items,
                promoCode: state.promoCode,
                promoDiscount: state.promoDiscount
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.calculateTotals();
                }
            }
        }
    )
);

// Helper functions
const getPackageRecommendations = (cartItems: CartItem[]): Product[] => {
    const hasResume = cartItems.some(item => 
        item.name.toLowerCase().includes('resume') && 
        item.category === 'professional-service'
    );
    const hasCoverLetter = cartItems.some(item => 
        item.name.toLowerCase().includes('cover letter') && 
        item.category === 'professional-service'
    );
    
    if (hasResume && hasCoverLetter) {
        return []; // Already has both
    }
    if (hasResume || hasCoverLetter) {
        const packageProduct = STORE_PRODUCTS.find(p => p.id === 'professional-package');
        return packageProduct ? [packageProduct] : [];
    }
    return [];
};

const resolveConflicts = (existingItems: CartItem[], newItem: Product): CartItem[] => {
    if (newItem.metadata.isPackage && newItem.metadata.includedServices) {
        // Remove individual services that are included in package
        return existingItems.filter(item => 
            !newItem.metadata.includedServices?.includes(item.productId)
        );
    }
    
    // If adding individual service, check if package already exists
    const packageInCart = existingItems.find(item => {
        const product = STORE_PRODUCTS.find(p => p.id === item.productId);
        return product?.metadata.isPackage && 
               product?.metadata.includedServices?.includes(newItem.id);
    });
    
    if (packageInCart) {
        // Don't add individual service if package already includes it
        return existingItems;
    }
    
    return existingItems;
};

export default useCartStore;
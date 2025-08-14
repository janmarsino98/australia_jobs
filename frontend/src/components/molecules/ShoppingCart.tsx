import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Tag } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import useCartStore from '../../stores/useCartStore';
import CartIcon from '../atoms/CartIcon';
import PriceTag from '../atoms/PriceTag';
import ServiceBadge from '../atoms/ServiceBadge';

interface ShoppingCartProps {
    trigger?: React.ReactNode;
    onCheckout?: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ trigger, onCheckout }) => {
    const { 
        items, 
        subtotal, 
        gst, 
        total, 
        promoCode, 
        promoDiscount,
        isOpen,
        toggleCart,
        updateQuantity, 
        removeItem, 
        clearCart,
        applyPromoCode,
        removePromoCode,
        getRecommendations
    } = useCartStore();

    const [promoInput, setPromoInput] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const { toast } = useToast();

    const recommendations = getRecommendations();
    const hasItems = items.length > 0;

    const handlePromoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoInput.trim()) return;

        setPromoLoading(true);
        try {
            await applyPromoCode(promoInput.trim().toUpperCase());
            toast({
                title: "🎉 Promo code applied!",
                description: `You saved ${(promoDiscount * 100).toFixed(0)}% on your order!`,
                duration: 3000,
            });
            setPromoInput('');
        } catch {
            toast({
                title: "❌ Invalid promo code",
                description: "Please check your promo code and try again.",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setPromoLoading(false);
        }
    };

    const handleRemoveItem = (itemId: string) => {
        // Find the item to show its name in the toast
        const item = items.find(item => item.id === itemId);
        removeItem(itemId);
        
        if (item) {
            toast({
                title: "🗑️ Removed from Cart",
                description: `${item.name} has been removed from your cart.`,
                duration: 2000,
            });
        }
    };

    const handleClearCart = () => {
        const itemCount = items.length;
        clearCart();
        toast({
            title: "🧹 Cart Cleared",
            description: `All ${itemCount} ${itemCount === 1 ? 'item' : 'items'} have been removed from your cart.`,
            duration: 2500,
        });
    };

    const handleCheckout = () => {
        if (onCheckout) {
            onCheckout();
        } else {
            // Navigate to checkout page - will be implemented by Agent 4
            console.log('Navigate to checkout');
        }
        toggleCart();
    };

    const formatCurrency = (amount: number) => `AU$${amount.toFixed(2)}`;

    return (
        <Sheet open={isOpen} onOpenChange={toggleCart}>
            <SheetTrigger asChild>
                {trigger || <CartIcon />}
            </SheetTrigger>
            <SheetContent className="flex flex-col w-full max-w-md bg-main-white-bg">
                <SheetHeader className="px-6 py-4 border-b border-navbar-border bg-dark-white">
                    <SheetTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-main-text" />
                            <span className="text-2xl font-semibold text-main-text">🛒 Your Cart</span>
                        </div>
                        <Badge className="bg-pill-bg text-pill-text">
                            {items.length} items
                        </Badge>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-auto py-4">
                    {!hasItems ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                Your cart is empty
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add some services to get started
                            </p>
                            <Button 
                                variant="outline" 
                                onClick={toggleCart}
                                className="text-sm"
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cart Items */}
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-medium text-sm leading-tight">
                                                        {item.name}
                                                    </h4>
                                                    <ServiceBadge type={item.category} className="mt-1" />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {item.deliveryTime}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="text-sm font-medium w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={item.quantity >= 5} // Max 5 of each service
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <PriceTag amount={item.price * item.quantity} currency="AUD" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recommendations */}
                            {recommendations.length > 0 && (
                                <div className="space-y-2">
                                    <Separator />
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">
                                            💡 Recommended for you
                                        </h4>
                                        {recommendations.map((product) => (
                                            <div key={product.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{product.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <ServiceBadge type={product.category} />
                                                        {product.savings && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Save AU${product.savings}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <PriceTag 
                                                        amount={product.price} 
                                                        currency="AUD"
                                                        strikethrough={product.originalPrice}
                                                    />
                                                    <Button 
                                                        size="sm" 
                                                        className="mt-1 text-xs"
                                                        onClick={() => {
                                                            useCartStore.getState().addItem(product);
                                                        }}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Promo Code */}
                            <div className="space-y-2">
                                <Separator />
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Promo Code
                                    </h4>
                                    {promoCode ? (
                                        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                    {promoCode}
                                                </Badge>
                                                <span className="text-sm text-green-600">
                                                    {(promoDiscount * 100).toFixed(0)}% off
                                                </span>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={removePromoCode}
                                                className="text-green-600 hover:text-green-700"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handlePromoSubmit} className="flex gap-2">
                                            <Input
                                                placeholder="Enter code"
                                                value={promoInput}
                                                onChange={(e) => setPromoInput(e.target.value)}
                                                className="flex-1 text-sm"
                                            />
                                            <Button 
                                                type="submit" 
                                                variant="outline" 
                                                size="sm"
                                                disabled={promoLoading || !promoInput.trim()}
                                            >
                                                Apply
                                            </Button>
                                        </form>
                                    )}
                                </div>
                            </div>

                            {/* Clear Cart */}
                            {hasItems && (
                                <div className="pt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearCart}
                                        className="w-full text-muted-foreground hover:text-destructive"
                                    >
                                        Clear Cart
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Enhanced Cart Footer */}
                {hasItems && (
                    <div className="p-6 border-t border-navbar-border bg-dark-white space-y-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-searchbar-text">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {promoDiscount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount ({promoCode})</span>
                                    <span>-{formatCurrency(subtotal * promoDiscount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-searchbar-text">
                                <span>GST (10%)</span>
                                <span>{formatCurrency(gst)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold text-base text-main-text">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-[48px] text-[16px] font-semibold" 
                            onClick={handleCheckout}
                        >
                            🚀 Checkout (AU${total.toFixed(2)})
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default ShoppingCart;
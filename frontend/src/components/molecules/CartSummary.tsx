import React from 'react';
import { ShoppingCart, Tag, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import useCartStore from '../../stores/useCartStore';
import PriceTag from '../atoms/PriceTag';

interface CartSummaryProps {
    showTitle?: boolean;
    showItems?: boolean;
    onCheckout?: () => void;
    className?: string;
    compact?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
    showTitle = true,
    showItems = true,
    onCheckout,
    className = '',
    compact = false
}) => {
    const { 
        items, 
        subtotal, 
        gst, 
        total, 
        promoCode, 
        promoDiscount 
    } = useCartStore();

    const hasItems = items.length > 0;
    const totalItems = items.reduce((count, item) => count + item.quantity, 0);

    const handleCheckout = () => {
        if (onCheckout) {
            onCheckout();
        } else {
            // Navigate to checkout page - will be implemented by Agent 4
            console.log('Navigate to checkout');
        }
    };

    const formatCurrency = (amount: number) => `AU$${amount.toFixed(2)}`;

    if (!hasItems) {
        return (
            <Card className={className}>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                        Your cart is empty
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            {showTitle && (
                <CardHeader className={compact ? "pb-3" : ""}>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ShoppingCart className="h-5 w-5" />
                        Order Summary
                        <Badge variant="secondary" className="ml-auto">
                            {totalItems} item{totalItems !== 1 ? 's' : ''}
                        </Badge>
                    </CardTitle>
                </CardHeader>
            )}
            
            <CardContent className={compact ? "pt-0" : ""}>
                <div className="space-y-4">
                    {/* Items List */}
                    {showItems && (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                    <div className="flex-1">
                                        <p className="font-medium leading-tight">{item.name}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {item.deliveryTime}
                                        </p>
                                        {item.quantity > 1 && (
                                            <p className="text-muted-foreground text-xs">
                                                Qty: {item.quantity}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <PriceTag 
                                            amount={item.price * item.quantity} 
                                            currency="AUD"
                                            className="text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                            <Separator />
                        </div>
                    )}

                    {/* Pricing Breakdown */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        
                        {promoDiscount > 0 && promoCode && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    Discount ({promoCode})
                                </span>
                                <span>-{formatCurrency(subtotal * promoDiscount)}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between text-sm">
                            <span>GST (10%)</span>
                            <span>{formatCurrency(gst)}</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between font-semibold text-base">
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>

                    {/* Free Services Note */}
                    {items.some(item => item.price === 0) && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700">
                                💡 Free services will be processed immediately without payment
                            </p>
                        </div>
                    )}

                    {/* Checkout Button */}
                    <Button 
                        className="w-full" 
                        size={compact ? "default" : "lg"}
                        onClick={handleCheckout}
                        disabled={!hasItems}
                    >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {total === 0 ? 'Process Free Services' : `Checkout (${formatCurrency(total)})`}
                    </Button>

                    {/* Additional Info */}
                    {!compact && (
                        <div className="pt-2 space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center justify-between">
                                <span>💳 Secure checkout with Stripe</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>🔒 SSL encrypted</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>📧 Order confirmation via email</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CartSummary;
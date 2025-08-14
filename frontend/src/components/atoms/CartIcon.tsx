import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import useCartStore from '../../stores/useCartStore';

interface CartIconProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'ghost' | 'outline' | 'secondary';
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const CartIcon = React.forwardRef<HTMLButtonElement, CartIconProps>(({ 
    className = '', 
    size = 'lg',
    variant = 'default',
    onClick
}, ref) => {
    const { items, toggleCart } = useCartStore();
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick) {
            onClick(event);
        } else {
            toggleCart();
        }
    };

    const sizeClasses = {
        sm: 'h-10 w-10',
        md: 'h-12 w-12',
        lg: 'h-14 w-14'
    };

    const iconSizes = {
        sm: 18,
        md: 22,
        lg: 26
    };

    return (
        <Button
            ref={ref}
            variant={variant}
            size="icon"
            className={`relative ${sizeClasses[size]} bg-pill-bg hover:bg-pill-text text-pill-text hover:text-white transition-all duration-200 border-2 border-pill-text shadow-lg hover:shadow-xl ${className}`}
            onClick={handleClick}
            aria-label={`🛒 Shopping cart with ${itemCount} items`}
        >
            <ShoppingCart size={iconSizes[size]} className="drop-shadow-sm" />
            {itemCount > 0 && (
                <Badge 
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-red-500 text-white border-2 border-white shadow-md animate-pulse"
                >
                    {itemCount > 99 ? '99+' : itemCount}
                </Badge>
            )}
        </Button>
    );
});

CartIcon.displayName = "CartIcon";

export default CartIcon;
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
    size = 'md',
    variant = 'ghost',
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
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12'
    };

    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24
    };

    return (
        <Button
            ref={ref}
            variant={variant}
            size="icon"
            className={`relative ${sizeClasses[size]} ${className}`}
            onClick={handleClick}
            aria-label={`Shopping cart with ${itemCount} items`}
        >
            <ShoppingCart size={iconSizes[size]} />
            {itemCount > 0 && (
                <Badge 
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                >
                    {itemCount > 99 ? '99+' : itemCount}
                </Badge>
            )}
        </Button>
    );
});

CartIcon.displayName = "CartIcon";

export default CartIcon;
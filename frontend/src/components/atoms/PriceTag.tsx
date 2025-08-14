import React from 'react';

interface PriceTagProps {
  amount: number;
  currency: 'AUD';
  strikethrough?: number;
  savings?: number;
  className?: string;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  amount,
  currency,
  strikethrough,
  savings,
  className = '',
}) => {
  const formatPrice = (price: number) => {
    return `${currency === 'AUD' ? 'AU$' : '$'}${price}`;
  };

  const isFree = amount === 0;

  return (
    <div className={`flex flex-col items-end ${className}`}>
      <div className="flex items-center gap-2">
        {strikethrough && (
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(strikethrough)}
          </span>
        )}
        <span className={`font-semibold ${isFree ? 'text-green-600 text-lg' : 'text-2xl'}`}>
          {isFree ? 'FREE' : formatPrice(amount)}
        </span>
      </div>
      {savings && savings > 0 && (
        <span className="text-xs text-green-600 font-medium">
          Save {formatPrice(savings)}
        </span>
      )}
    </div>
  );
};

export default PriceTag;
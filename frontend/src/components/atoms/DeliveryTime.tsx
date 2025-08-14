import React from 'react';

interface DeliveryTimeProps {
  time: string;
  className?: string;
}

export const DeliveryTime: React.FC<DeliveryTimeProps> = ({
  time,
  className = '',
}) => {
  const getTimeIcon = (timeStr: string) => {
    const lowerTime = timeStr.toLowerCase();
    
    if (lowerTime.includes('instant') || lowerTime.includes('immediate')) {
      return '⚡';
    } else if (lowerTime.includes('hour')) {
      return '🕐';
    } else if (lowerTime.includes('day')) {
      return '📅';
    } else if (lowerTime.includes('week')) {
      return '🗓️';
    }
    return '⏱️';
  };

  const getTimeColor = (timeStr: string) => {
    const lowerTime = timeStr.toLowerCase();
    
    if (lowerTime.includes('instant') || lowerTime.includes('immediate')) {
      return 'text-green-600';
    } else if (lowerTime.includes('hour')) {
      return 'text-blue-600';
    } else if (lowerTime.includes('day') && !lowerTime.includes('7') && !lowerTime.includes('10')) {
      return 'text-yellow-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className={`flex items-center gap-1 text-sm ${getTimeColor(time)} ${className}`}>
      <span className="text-base">{getTimeIcon(time)}</span>
      <span className="font-medium">
        Delivery: {time}
      </span>
    </div>
  );
};

export default DeliveryTime;
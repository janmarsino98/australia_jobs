import React from 'react';
import { Badge } from '../ui/badge';

interface ServiceBadgeProps {
  type: 'ai-service' | 'professional-service' | 'package';
  className?: string;
}

export const ServiceBadge: React.FC<ServiceBadgeProps> = ({
  type,
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'ai-service':
        return {
          text: 'AI Powered',
          variant: 'default' as const,
          className: 'bg-pill-bg text-pill-text hover:bg-pill-bg/80',
        };
      case 'professional-service':
        return {
          text: 'Professional',
          variant: 'secondary' as const,
          className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        };
      case 'package':
        return {
          text: 'Package Deal',
          variant: 'outline' as const,
          className: 'border-green-500 text-green-700 hover:bg-green-50',
        };
      default:
        return {
          text: 'Service',
          variant: 'outline' as const,
          className: '',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <Badge 
      variant={config.variant} 
      className={`text-xs font-medium ${config.className} ${className}`}
    >
      {config.text}
    </Badge>
  );
};

export default ServiceBadge;
import React from 'react';
import { Button } from '../ui/button';

interface HeroAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface HeroSectionProps {
  title: string;
  subtitle: string;
  actions?: HeroAction[];
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  actions,
  className = "",
}) => {
  return (
    <section className={`px-6 py-4 bg-gradient-to-r from-main-text to-searchbar-text text-white ${className}`}>
      <div className="max-w-6xl mx-auto text-center py-[60px]">
        <h1 className="text-4xl font-bold mb-6">
          {title}
        </h1>
        <p className="text-xl mb-8 max-w-3xl mx-auto">
          {subtitle}
        </p>
        {actions && actions.length > 0 && (
          <div className="flex gap-4 justify-center flex-wrap">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="lg"
                onClick={action.onClick}
                className={
                  action.variant === 'secondary'
                    ? "bg-transparent border-2 border-white text-white hover:bg-white hover:text-main-text"
                    : "bg-white text-main-text hover:bg-gray-100"
                }
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}; 
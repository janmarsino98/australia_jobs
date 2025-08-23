import React from 'react';

interface CategoryNavigationProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'All Services' },
  { id: 'ai-service', label: 'AI Services' },
  { id: 'professional-service', label: 'Professional Services' },
  { id: 'package', label: 'Packages' }
];

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  activeCategory,
  onCategoryChange
}) => {
  const handleKeyDown = (event: React.KeyboardEvent, categoryId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCategoryChange(categoryId);
    }
  };

  return (
    <nav role="tablist" aria-label="Service categories" className="flex flex-wrap justify-center gap-2 py-4 sm:py-6">
      {categories.map((category) => (
        <button
          key={category.id}
          role="tab"
          aria-selected={activeCategory === category.id}
          aria-controls={`category-${category.id}-panel`}
          onClick={() => onCategoryChange(category.id)}
          onKeyDown={(e) => handleKeyDown(e, category.id)}
          className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-pill-text focus-visible:ring-offset-2 min-h-[44px] ${
            activeCategory === category.id
              ? 'bg-pill-text text-white'
              : 'bg-pill-bg text-pill-text hover:bg-pill-text hover:text-white'
          }`}
        >
          {category.label}
        </button>
      ))}
    </nav>
  );
};

export default CategoryNavigation;
import React from 'react';

interface StatItem {
  number: string;
  label: string;
}

interface StatsSectionProps {
  stats: StatItem[];
  className?: string;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats, className = "" }) => {
  return (
    <section className={`px-6 py-[60px] ${className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col space-y-2">
              <div className="text-3xl font-bold text-pill-text">
                {stat.number}
              </div>
              <div className="text-searchbar-text font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}; 
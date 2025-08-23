import React from 'react';

const stats = [
  {
    number: '1000+',
    label: 'Resumes Reviewed',
    description: 'Comprehensive analysis completed'
  },
  {
    number: '95%',
    label: 'Success Rate',
    description: 'Clients see improved results'
  },
  {
    number: '24hr',
    label: 'Delivery',
    description: 'Fast turnaround time'
  }
];

const StatsSection: React.FC = () => {
  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card rounded-lg p-4 sm:p-6 text-center shadow-sm border border-navbar-border"
            >
              <div className="text-xl sm:text-2xl font-semibold text-main-text mb-2">
                {stat.number}
              </div>
              <div className="text-[15px] sm:text-[16px] font-medium text-main-text mb-1">
                {stat.label}
              </div>
              <div className="text-xs sm:text-sm text-searchbar-text">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
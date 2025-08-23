import React from 'react';

interface StoreHeroProps {
  onSearch?: (query: string) => void;
}

const StoreHero: React.FC<StoreHeroProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <section className="bg-main-white-bg py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-main-text mb-4">
          Boost Your Career
        </h1>
        <p className="text-lg sm:text-xl text-searchbar-text mb-6 sm:mb-8 max-w-2xl mx-auto">
          AI-powered and professional resume services to help you stand out in your job search
        </p>
        
        {/* Search Bar */}
        {/* <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8" role="search">
          <div className="relative">
            <label htmlFor="service-search" className="sr-only">
              Search for services
            </label>
            <input
              id="service-search"
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-dark-white border border-navbar-border rounded-lg text-[16px] text-main-text placeholder-searchbar-text focus:outline-none focus-visible:ring-2 focus-visible:ring-pill-text focus:border-transparent transition-colors"
              aria-describedby="search-hint"
            />
            <div id="search-hint" className="sr-only">
              Enter keywords to find resume and career services
            </div>
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-searchbar-text hover:text-pill-text transition-colors focus-visible:ring-2 focus-visible:ring-pill-text rounded"
              aria-label="Search for services"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form> */}
      </div>
    </section>
  );
};

export default StoreHero;
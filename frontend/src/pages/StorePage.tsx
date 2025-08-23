import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreStore } from '../stores/useStoreStore';
import useCartStore from '../stores/useCartStore';
import useAuthStore from '../stores/useAuthStore';
import { Product } from '../types/store';
import ProductGrid from '../components/organisms/ProductGrid';
import ShoppingCart from '../components/molecules/ShoppingCart';
import StoreHero from '../components/organisms/StoreHero';
import Breadcrumb from '../components/molecules/Breadcrumb';
import StatsSection from '../components/organisms/StatsSection';
import { ProductGridSkeleton } from '../components/molecules/ProductCardSkeleton';
import { useToast } from '../components/ui/use-toast';
import CartIcon from '../components/atoms/CartIcon';

const StorePage: React.FC = () => {
    const navigate = useNavigate();
    const { products, isLoading, error, setProducts, setLoading, setError } = useStoreStore();
    const { addItem } = useCartStore();
    const { user } = useAuthStore();
    const [sortBy, setSortBy] = useState<'price' | 'name' | 'deliveryTime'>('price');
    const [filters, setFilters] = useState({});
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const { toast } = useToast();
    
    const handleProductSelect = (product: Product) => {
        if (product.price === 0 && product.id === 'ai-resume-review') {
            // For free AI resume review, navigate to resume upload page
            navigate('/resume-upload');
        } else if (product.price === 0) {
            // For other free services, just log for now
            console.log('Redirecting to free service:', product.id);
        } else {
            // Add paid services to cart
            addItem(product);
            toast({
                title: "🛒 Added to Cart!",
                description: `${product.name} (AU$${product.price.toFixed(2)}) has been added to your cart.`,
                duration: 3000,
            });
        }
    };

    // Filter products based on category and search query
    useEffect(() => {
        let filtered = products;
        
        // Filter by category
        if (activeCategory !== 'all') {
            filtered = filtered.filter(product => product.category === activeCategory);
        }
        
        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.features.some(feature => 
                    feature.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }
        
        setFilteredProducts(filtered);
    }, [products, activeCategory, searchQuery]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    // const handleCategoryChange = (category: string) => {
    //     setActiveCategory(category);
    // };

    useEffect(() => {
        // Initialize with hardcoded products for now
        // This will be replaced with API calls by Agent 5
        const initializeStore = async () => {
            setLoading(true);
            try {
                const STORE_PRODUCTS: Product[] = [
                    {
                        id: 'ai-resume-review',
                        name: 'AI Resume Review',
                        category: 'ai-service',
                        price: 0,
                        currency: 'AUD',
                        description: 'Get instant automated analysis of your resume with comprehensive feedback on formatting, content, and ATS optimization. Our AI analyzes your resume against industry standards and provides detailed recommendations for improvement.',
                        shortDescription: 'Instant automated resume analysis',
                        features: [
                            'Instant automated analysis',
                            'ATS compatibility score', 
                            'Basic improvement suggestions',
                            'Immediate PDF report download'
                        ],
                        deliveryTime: 'Instant',
                        active: true,
                        metadata: {
                            isPackage: false,
                            isFree: true
                        }
                    },
                    {
                        id: 'ai-resume-building',
                        name: 'AI Resume Building',
                        category: 'ai-service',
                        price: 25,
                        currency: 'AUD',
                        description: 'Let our AI create a professional resume tailored to your target role. Input your experience and let AI format and optimize your content for maximum impact.',
                        shortDescription: 'AI-powered resume creation',
                        features: [
                            'AI-generated content suggestions',
                            'Professional formatting',
                            'Keyword optimization',
                            '2 revision rounds'
                        ],
                        deliveryTime: '1-2 hours',
                        active: true,
                        metadata: {
                            isPackage: false,
                            isFree: false
                        }
                    },
                    {
                        id: 'professional-resume-review',
                        name: 'Professional Resume Review',
                        category: 'professional-service',
                        price: 85,
                        currency: 'AUD',
                        description: 'Get your resume reviewed by experienced HR professionals and career consultants. Receive detailed feedback with industry-specific insights and personalized recommendations.',
                        shortDescription: 'Human expert resume review',
                        features: [
                            'Expert human review',
                            'Industry-specific feedback',
                            'Personal consultation call',
                            'Unlimited revision rounds'
                        ],
                        deliveryTime: '1-2 business days',
                        active: true,
                        metadata: {
                            isPackage: false,
                            isFree: false
                        }
                    },
                    {
                        id: 'professional-cover-letter',
                        name: 'Professional Cover Letter',
                        category: 'professional-service',
                        price: 65,
                        currency: 'AUD',
                        description: 'Get a compelling cover letter written by professional writers that highlights your strengths and aligns with your target role.',
                        shortDescription: 'Expert-written cover letter',
                        features: [
                            'Professional writing',
                            'Role-specific customization',
                            'Multiple format options',
                            '1 revision round included'
                        ],
                        deliveryTime: '2-3 business days',
                        active: true,
                        metadata: {
                            isPackage: false,
                            isFree: false
                        }
                    },
                    {
                        id: 'professional-package',
                        name: 'Complete Professional Package',
                        category: 'package',
                        price: 120,
                        originalPrice: 150,
                        savings: 30,
                        currency: 'AUD',
                        description: 'Get both professional resume review and cover letter writing services at a discounted rate. Perfect for job seekers who want comprehensive professional assistance.',
                        shortDescription: 'Resume + Cover Letter bundle',
                        features: [
                            'Professional resume review',
                            'Custom cover letter writing',
                            'Personal consultation call',
                            'Priority delivery'
                        ],
                        deliveryTime: '2-3 business days',
                        active: true,
                        metadata: {
                            isPackage: true,
                            includedServices: ['professional-resume-review', 'professional-cover-letter'],
                            isFree: false
                        }
                    }
                ];

                setProducts(STORE_PRODUCTS);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load products');
            } finally {
                setLoading(false);
            }
        };

        initializeStore();
    }, [setProducts, setLoading, setError]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-main-white-bg">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumb skeleton */}
                    <div className="py-4 px-6">
                        <div className="h-4 bg-muted rounded w-40 animate-pulse"></div>
                    </div>
                    
                    {/* Hero skeleton */}
                    <div className="py-16 px-6">
                        <div className="max-w-4xl mx-auto text-center space-y-4">
                            <div className="h-10 bg-muted rounded w-64 mx-auto animate-pulse"></div>
                            <div className="h-6 bg-muted rounded w-96 mx-auto animate-pulse"></div>
                            <div className="h-12 bg-muted rounded-lg w-80 mx-auto animate-pulse"></div>
                        </div>
                    </div>
                    
                    {/* Category navigation skeleton */}
                    <div className="flex justify-center gap-2 py-6 px-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-12 bg-muted rounded-full w-24 animate-pulse"></div>
                        ))}
                    </div>
                    
                    {/* Stats skeleton */}
                    <div className="py-12 px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-card p-6 rounded-lg border border-navbar-border">
                                    <div className="h-8 bg-muted rounded w-16 mx-auto mb-2 animate-pulse"></div>
                                    <div className="h-5 bg-muted rounded w-24 mx-auto mb-1 animate-pulse"></div>
                                    <div className="h-4 bg-muted rounded w-32 mx-auto animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Product grid skeleton */}
                    <div className="px-6 pb-12">
                        <ProductGridSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-main-white-bg">
                <div className="max-w-7xl mx-auto px-6 py-16">
                    <div className="text-center max-w-md mx-auto">
                        <div className="text-destructive mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-main-text mb-2">Something went wrong</h2>
                        <p className="text-searchbar-text mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-pill-text text-white px-6 py-3 rounded-lg hover:bg-pill-text/90 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const breadcrumbItems = [
        { label: 'Home', path: '/' },
        { label: 'Services', path: '/services' },
        { label: 'Store' }
    ];

    return (
        <div className="min-h-screen bg-main-white-bg">
            {/* Skip Link */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-pill-text text-white px-4 py-2 rounded-lg z-50 focus-visible:ring-2 focus-visible:ring-white"
            >
                Skip to main content
            </a>
            
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb Navigation */}
                <Breadcrumb items={breadcrumbItems} />
                
                {/* Hero Section */}
                <StoreHero onSearch={handleSearch} />
                
                {/* Category Navigation */}
                {/* <div className="px-4 sm:px-6">
                    <CategoryNavigation 
                        activeCategory={activeCategory}
                        onCategoryChange={handleCategoryChange}
                    />
                </div> */}
                
                {/* Stats Section */}
                <div className="-mt-16">
                    <StatsSection />
                </div>
                
                {/* Results Count */}
                {searchQuery && (
                    <div className="px-4 sm:px-6 mb-4">
                        <p className="text-sm text-searchbar-text">
                            {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} found for "{searchQuery}"
                        </p>
                    </div>
                )}
                
                {/* Product Grid */}
                <main id="main-content" className="px-4 sm:px-6 pb-12" role="main" aria-label="Service listings">
                    {filteredProducts.length > 0 ? (
                        <ProductGrid
                            products={filteredProducts}
                            filters={filters}
                            sortBy={sortBy}
                            onProductSelect={handleProductSelect}
                            onFiltersChange={setFilters}
                            onSortChange={setSortBy}
                            showComparison={false}
                            featuredProductIds={['ai-resume-review', 'professional-package']}
                            user={user}
                        />
                    ) : (
                        <div className="text-center py-16">
                            <div className="text-searchbar-text mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-main-text mb-2">No services found</h3>
                            <p className="text-searchbar-text mb-6">
                                {searchQuery ? `No services match "${searchQuery}"` : 'No services available in this category'}
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveCategory('all');
                                }}
                                className="bg-pill-text text-white px-6 py-3 rounded-lg hover:bg-pill-text/90 transition-colors"
                            >
                                Show All Services
                            </button>
                        </div>
                    )}
                </main>
            </div>
            
            {/* Floating Cart Button - Positioned near toast area */}
            <div className="fixed top-4 right-4 z-50">
                <CartIcon size="lg" />
            </div>
            
            {/* Shopping Cart - Keep existing functionality */}
            <ShoppingCart />
        </div>
    );
};

export default StorePage;
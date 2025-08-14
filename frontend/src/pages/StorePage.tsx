import React, { useEffect, useState } from 'react';
import { useStoreStore } from '../stores/useStoreStore';
import useCartStore from '../stores/useCartStore';
import { Product } from '../types/store';
import ProductGrid from '../components/organisms/ProductGrid';
import ShoppingCart from '../components/molecules/ShoppingCart';
import CartIcon from '../components/atoms/CartIcon';
import { useToast } from '../components/ui/use-toast';

const StorePage: React.FC = () => {
    const { products, isLoading, error, setProducts, setLoading, setError } = useStoreStore();
    const { addItem } = useCartStore();
    const [sortBy, setSortBy] = useState<'price' | 'name' | 'deliveryTime'>('price');
    const [filters, setFilters] = useState({});
    const { toast } = useToast();
    
    const handleProductSelect = (product: Product) => {
        if (product.price === 0) {
            // For free services, show toast and redirect directly to the service
            toast({
                title: "🎯 Free Analysis Started!",
                description: `${product.name} is ready for you. Let's get started!`,
                duration: 4000,
            });
            console.log('Redirecting to free service:', product.id);
            // This would typically navigate to a service page
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
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading store...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <p className="text-red-600">Error: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-main-white-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12 px-6 py-4">
                    <h1 className="text-4xl font-bold text-main-text mb-4">
                        🚀 Boost Your Career
                    </h1>
                    <h2 className="text-2xl font-semibold text-searchbar-text mb-6">
                        AI-Powered & Professional Resume Services
                    </h2>
                    <p className="text-[16px] text-searchbar-text max-w-3xl mx-auto leading-relaxed">
                        Transform your job search with our comprehensive suite of resume services. 
                        From instant AI analysis to expert professional review, we've got everything you need to stand out.
                    </p>
                </div>

                {/* Product Grid with enhanced functionality */}
                <ProductGrid
                    products={products}
                    filters={filters}
                    sortBy={sortBy}
                    onProductSelect={handleProductSelect}
                    onFiltersChange={setFilters}
                    onSortChange={setSortBy}
                    showComparison={true}
                    featuredProductIds={['ai-resume-review', 'professional-package']}
                />
            </div>
            
            {/* Shopping Cart */}
            <ShoppingCart />
            
            {/* Fixed Floating Cart Icon for better visibility */}
            <div className="fixed bottom-6 right-6 z-50">
                <CartIcon />
            </div>
        </div>
    );
};

export default StorePage;
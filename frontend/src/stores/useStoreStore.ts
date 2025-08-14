import { create } from 'zustand';
import { Product, StoreState } from '../types/store';

// Hardcoded products data (will be replaced with API calls by Agent 5)
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

const useStoreStore = create<StoreState>((set, get) => ({
    products: [],
    featuredProducts: [],
    isLoading: false,
    error: null,
    selectedProduct: null,

    // Actions
    setProducts: (products: Product[]) => {
        set({ 
            products,
            featuredProducts: products.filter(p => p.metadata.isFree || p.metadata.isPackage)
        });
    },

    setFeaturedProducts: (products: Product[]) => {
        set({ featuredProducts: products });
    },

    setSelectedProduct: (product: Product | null) => {
        set({ selectedProduct: product });
    },

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    getProductById: (id: string): Product | undefined => {
        return get().products.find(product => product.id === id);
    },

    getProductsByCategory: (category: string): Product[] => {
        return get().products.filter(product => product.category === category);
    }
}));

// Initialize with default products
useStoreStore.getState().setProducts(STORE_PRODUCTS);

export { useStoreStore, STORE_PRODUCTS };
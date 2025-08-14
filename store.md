# Store Page Development Plan

## Overview
This document outlines the comprehensive development plan for implementing a job search enhancement services store page for AusJobs platform. The store will feature AI-powered and professional consultant services with integrated shopping cart and checkout functionality.

## 🏗️ Architecture & Technical Foundation

### Core Components Structure
```
components/
├── pages/
│   └── StorePage.tsx              # Main store page container
├── molecules/
│   ├── ProductCard.tsx            # Individual service card
│   ├── ShoppingCart.tsx           # Cart sidebar/modal
│   ├── CartSummary.tsx           # Cart totals and checkout
│   └── ServiceComparison.tsx     # AI vs Professional comparison
├── organisms/
│   ├── ProductGrid.tsx           # Products layout container
│   ├── CheckoutForm.tsx          # Multi-step checkout process
│   └── PaymentForm.tsx           # ✅ Already exists - Stripe integration
└── atoms/
    ├── PriceTag.tsx              # Standardized pricing display
    ├── ServiceBadge.tsx          # AI/Professional indicators
    └── DeliveryTime.tsx          # Timeframe indicators
```

### State Management (Zustand Stores)
```typescript
// New stores to implement:
stores/
├── useStoreStore.ts              # Products catalog and management
├── useCartStore.ts               # Shopping cart state
├── useOrderStore.ts              # Order history and tracking
└── usePaymentStore.ts            # Payment processing state
```

## 🛍️ Product Catalog Structure

### Service Categories & Pricing (AUD)

#### AI-Powered Services (Instant/Quick Delivery)
```typescript
interface AIService {
  id: string;
  category: 'ai-service';
  deliveryTime: 'instant' | '1-2 hours';
  automated: true;
}
```

1. **AI Resume Review** - AU$0 (Free)
   - Instant automated analysis
   - ATS compatibility score
   - Basic improvement suggestions
   - Immediate PDF report download

2. **AI Resume Building** - AU$25
   - Guided AI-powered resume creation
   - Multiple professional templates
   - 1-2 hour completion time
   - Export in multiple formats

3. **AI Cover Letter Building** - AU$25
   - Job-specific cover letter generation
   - Company research integration
   - 1 hour completion time
   - Tailored to job posting

#### Professional Consultant Services (Human Expert)
```typescript
interface ProfessionalService {
  id: string;
  category: 'professional-service';
  deliveryTime: '3-5 business days' | '5-7 business days';
  expertLevel: 'certified-consultant';
}
```

4. **Professional Resume Build** - AU$50
   - 1-on-1 consultation with certified career consultant
   - Industry-specific expertise
   - 3-5 business days delivery
   - 1 revision round included

5. **Professional Cover Letter** - AU$40
   - Expert writing with industry knowledge
   - Job-specific customization
   - 3-5 business days delivery
   - Company research included

#### Package Deals (Value Propositions)
6. **Professional Package Deal** - AU$75 (Save AU$15)
   - Resume + Cover Letter by Professional
   - Combined 5-7 business day delivery
   - Coordinated branding and messaging
   - Priority consultant assignment

## 🛒 Shopping Cart Implementation

### Cart State Management
```typescript
interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  category: 'ai-service' | 'professional-service' | 'package';
  quantity: number;
  deliveryTime: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number; // GST calculation for AU
  total: number;
  addItem: (product: Product) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyPromoCode: (code: string) => void;
}
```

### Cart Features
- **Persistent Storage**: LocalStorage integration for cart persistence
- **Smart Recommendations**: Show package deals when individual items added
- **Conflict Resolution**: Handle overlapping services (e.g., individual + package)
- **Real-time Updates**: Live total calculation with GST
- **Promo Codes**: Support for discount codes and promotional offers

## 🎨 UI/UX Design Implementation

### Design System Integration
Following established AusJobs design patterns from UI_DESIGN_SYSTEM.md:

#### Product Card Design
```tsx
<Card className="rounded-lg border bg-card shadow-sm hover:shadow-lg transition-shadow">
  <CardHeader className="flex flex-col space-y-1.5 p-6">
    <div className="flex justify-between items-start">
      <ServiceBadge type="ai" | "professional" />
      <PriceTag amount={25} currency="AUD" strikethrough={originalPrice} />
    </div>
    <CardTitle className="text-2xl font-semibold">{serviceName}</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">
      {shortDescription}
    </CardDescription>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    <ul className="space-y-2 text-sm">
      {features.map(feature => <li key={feature}>✓ {feature}</li>)}
    </ul>
    <DeliveryTime time={deliveryEstimate} />
  </CardContent>
  <CardFooter className="flex items-center p-6 pt-0">
    <Button variant="default" className="w-full" onClick={addToCart}>
      Add to Cart
    </Button>
  </CardFooter>
</Card>
```

#### Color Scheme Application
- **AI Services**: `bg-pill-bg` (#EFF4FF) with `text-pill-text` (#2557D6)
- **Professional Services**: `bg-secondary` with professional badge styling
- **Package Deals**: Accent colors with savings highlight
- **Free Services**: Special "FREE" badge with distinct styling

### Responsive Layout
- **Desktop**: 3-column product grid with sidebar cart
- **Tablet**: 2-column grid with collapsible cart
- **Mobile**: Single column with bottom cart summary

## 🔄 User Flow & Interaction Design

### Primary User Journeys

#### 1. Quick Free User (AI Resume Review)
```
Landing → Store → "Free AI Review" → Instant Access → Results
```
- Immediate service delivery
- Email capture for results
- Upsell to paid services post-review

#### 2. Budget-Conscious User (AI Services)
```
Store → Compare AI vs Professional → Select AI Service → Cart → Checkout
```
- Clear value proposition
- Speed and cost benefits highlighted
- Instant gratification messaging

#### 3. Professional User (Consultant Services)
```
Store → Professional Services → Package Recommendation → Cart → Consultation Booking
```
- Quality and expertise emphasis
- Consultant credentials display
- Scheduling integration for consultation

#### 4. Value Seeker (Package Deal)
```
Store → Individual Services → Package Suggestion → Savings Display → Cart
```
- Automatic package recommendations
- Clear savings visualization
- Combined timeline explanation

## 🔐 Checkout & Payment Integration

### Multi-Step Checkout Process
```typescript
enum CheckoutStep {
  CART_REVIEW = 'cart-review',
  USER_DETAILS = 'user-details', 
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation'
}
```

#### Step 1: Cart Review
- Service summary with delivery times
- Final opportunity for upsells
- Promo code application
- Terms acceptance

#### Step 2: User Details
- Contact information collection
- Service-specific requirements (resume upload, job posting details)
- Delivery preferences
- Communication preferences

#### Step 3: Payment Processing
- **Existing Integration**: Leverage current `PaymentForm.tsx` component
- **Stripe Elements**: Already configured with proper error handling
- **Payment Methods**: Credit/Debit cards, potentially PayPal
- **Security**: PCI compliance through Stripe

#### Step 4: Confirmation & Next Steps
- Order confirmation with unique order ID
- Service-specific next steps
- Calendar booking for consultant services
- File upload instructions for AI services

### Free Service Handling
```typescript
// Special handling for AU$0 services
const handleFreeService = (service: Product) => {
  if (service.price === 0) {
    // Skip payment, go directly to service delivery
    return processImmediateService(service);
  }
  // Regular checkout flow for paid services
  return initiateCheckout(service);
};
```

## 📱 Backend Integration Points

### API Endpoints Required
```typescript
// Store/Products API
GET    /api/store/products              // Fetch all services
GET    /api/store/products/:id          // Get specific service details
POST   /api/store/validate-promo        // Validate promo codes

// Cart/Orders API  
POST   /api/orders                      // Create new order
GET    /api/orders/:userId              // Get user order history
PUT    /api/orders/:orderId             // Update order status

// Service Delivery API
POST   /api/services/ai/resume-review   // Process free AI review
POST   /api/services/ai/resume-build    // Initiate AI resume building
POST   /api/services/professional/book  // Book professional consultation

// Payment Integration
POST   /api/payments/create-intent      // Create Stripe payment intent
POST   /api/payments/confirm            // Confirm payment completion
```

### Database Schema Extensions
```mongodb
// Products collection
{
  _id: ObjectId,
  name: string,
  category: 'ai-service' | 'professional-service' | 'package',
  price: number,
  currency: 'AUD',
  description: string,
  features: string[],
  deliveryTime: string,
  active: boolean,
  metadata: {
    isPackage: boolean,
    includedServices?: ObjectId[],
    savings?: number
  }
}

// Orders collection
{
  _id: ObjectId,
  userId: ObjectId,
  items: [{
    productId: ObjectId,
    quantity: number,
    price: number
  }],
  status: 'pending' | 'paid' | 'processing' | 'completed',
  paymentIntentId: string,
  createdAt: Date,
  completedAt?: Date
}
```

## 🧪 Testing Strategy

### Component Testing (Jest + RTL)
```typescript
// Example test files to create:
- ProductCard.test.tsx
- ShoppingCart.test.tsx  
- CheckoutForm.test.tsx
- StorePage.test.tsx
- useCartStore.test.ts
```

### User Flow Testing (Cypress E2E)
```typescript
// Critical user journeys:
- "Free AI Review Complete Flow"
- "AI Service Purchase and Checkout"
- "Professional Service Booking"
- "Package Deal Selection and Savings"
- "Cart Persistence Across Sessions"
```

### Payment Testing
- Stripe test cards for various scenarios
- Error handling for payment failures
- Webhook testing for payment confirmations
- Refund process testing

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create base store page structure
- [ ] Implement product catalog display
- [ ] Set up basic cart functionality
- [ ] Create product cards with design system

### Phase 2: Cart & Checkout (Week 2)
- [ ] Complete shopping cart implementation
- [ ] Integrate with existing PaymentForm
- [ ] Handle free service delivery
- [ ] Add cart persistence

### Phase 3: Advanced Features (Week 3)
- [ ] Package deal recommendations
- [ ] Promo code system
- [ ] Professional service booking
- [ ] Order confirmation flow

### Phase 4: Polish & Testing (Week 4)
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility compliance

## 🎯 Success Metrics & KPIs

### Conversion Metrics
- **Free to Paid Conversion**: % of free users upgrading
- **Package Deal Uptake**: % choosing package vs individual
- **Cart Abandonment Rate**: Checkout completion percentage
- **Average Order Value**: Revenue per transaction

### User Experience Metrics
- **Time to First Purchase**: User journey efficiency
- **Service Delivery Satisfaction**: Post-purchase ratings
- **Return Customer Rate**: Repeat service usage

## 🔧 Technical Considerations

### Performance Optimization
- **Lazy Loading**: Product images and descriptions
- **Memoization**: Expensive calculations (cart totals, recommendations)
- **Caching**: Product catalog API responses
- **Bundle Splitting**: Store-specific code chunks

### Security Measures
- **Input Validation**: All form inputs and API calls
- **XSS Prevention**: Sanitize user-generated content
- **CSRF Protection**: Maintain existing token system
- **PCI Compliance**: Through Stripe integration

### Accessibility Compliance
- **WCAG 2.1 AA**: Full compliance for all components
- **Screen Reader Support**: Proper ARIA labels and roles
- **Keyboard Navigation**: Complete keyboard accessibility
- **Color Contrast**: Meet or exceed 4.5:1 ratio requirements

## 📝 Documentation & Handoff

### Developer Documentation
- Component API documentation
- Store setup and usage guides
- Testing guidelines and examples
- Deployment and environment setup

### User Documentation
- Service descriptions and FAQ
- Checkout process guide
- Refund and cancellation policies
- Professional service booking instructions

---

## 📋 Next Steps

1. **Review and Approve** this comprehensive plan
2. **Set up development environment** with required dependencies
3. **Create base project structure** following the outlined architecture
4. **Begin Phase 1 implementation** with foundation components
5. **Set up testing framework** for continuous quality assurance

This plan provides a robust foundation for building a professional, scalable store page that integrates seamlessly with the existing AusJobs platform while delivering exceptional user experience and business value.
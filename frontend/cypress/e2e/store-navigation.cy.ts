describe('Store Navigation and Basic Functionality', () => {
  beforeEach(() => {
    cy.visit('/store');
  });

  it('displays the store page and product cards', () => {
    // Verify store page loads
    cy.get('[data-testid="store-page"]').should('be.visible');
    
    // Verify product cards are displayed
    cy.get('[data-testid*="product-card"]').should('have.length.greaterThan', 0);
    
    // Verify free AI resume review is available
    cy.contains('AI Resume Review').should('be.visible');
    cy.contains('FREE').should('be.visible');
  });

  it('allows adding items to cart', () => {
    // Find and click on a paid service
    cy.get('[data-testid="ai-resume-building-card"]')
      .should('be.visible')
      .within(() => {
        cy.contains('Add to Cart').click();
      });
    
    // Verify cart icon shows item count
    cy.get('[data-testid="cart-icon"]').should('contain', '1');
    
    // Open cart to verify item was added
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="shopping-cart"]').should('be.visible');
    cy.contains('AI Resume Building').should('be.visible');
  });

  it('displays different service categories correctly', () => {
    // Verify AI services have correct badge
    cy.get('[data-testid*="ai-service"]').should('contain', 'AI Powered');
    
    // Verify professional services have correct badge
    cy.get('[data-testid*="professional-service"]').should('contain', 'Professional');
    
    // Verify package deals have correct badge
    cy.get('[data-testid*="package"]').should('contain', 'Package Deal');
  });

  it('shows correct pricing information', () => {
    // Verify free service pricing
    cy.contains('AI Resume Review')
      .parents('[data-testid*="product-card"]')
      .should('contain', 'FREE');
    
    // Verify paid service pricing
    cy.contains('AI Resume Building')
      .parents('[data-testid*="product-card"]')
      .should('contain', 'AU$');
    
    // Verify package deal shows savings
    cy.get('[data-testid*="package"]')
      .should('contain', 'Save');
  });

  it('displays delivery time information', () => {
    // Verify instant delivery for free services
    cy.contains('AI Resume Review')
      .parents('[data-testid*="product-card"]')
      .should('contain', 'Instant');
    
    // Verify delivery times are displayed for all services
    cy.get('[data-testid*="product-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'Delivery:');
    });
  });

  it('handles responsive design', () => {
    // Test mobile viewport
    cy.viewport('iphone-6');
    cy.get('[data-testid="store-page"]').should('be.visible');
    cy.get('[data-testid*="product-card"]').should('be.visible');
    
    // Test tablet viewport
    cy.viewport('ipad-2');
    cy.get('[data-testid="store-page"]').should('be.visible');
    cy.get('[data-testid*="product-card"]').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1200, 800);
    cy.get('[data-testid="store-page"]').should('be.visible');
    cy.get('[data-testid*="product-card"]').should('be.visible');
  });

  it('shows product features correctly', () => {
    // Verify product cards show feature lists
    cy.get('[data-testid*="product-card"]').each(($card) => {
      cy.wrap($card).within(() => {
        // Should have at least one feature with checkmark
        cy.get('li').should('have.length.greaterThan', 0);
        cy.contains('✓').should('be.visible');
      });
    });
  });
});

describe('Free Service Flow', () => {
  it('completes free AI resume review flow', () => {
    cy.visit('/store');
    
    // Click on free AI resume review
    cy.get('[data-testid="ai-resume-review-card"]').within(() => {
      cy.contains('Get Free Review').click();
    });
    
    // Should redirect to service page or process immediately
    // This will depend on the implementation by other agents
    cy.url().should('not.equal', '/store');
    
    // Verify we're on a service or upload page
    cy.get('body').should('contain.text', 'resume').or('contain.text', 'upload');
  });
});

describe('Shopping Cart Functionality', () => {
  beforeEach(() => {
    cy.visit('/store');
  });

  it('manages cart items correctly', () => {
    // Add item to cart
    cy.get('[data-testid="ai-resume-building-card"]').within(() => {
      cy.contains('Add to Cart').click();
    });
    
    // Open cart
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="shopping-cart"]').should('be.visible');
    
    // Verify item is in cart
    cy.contains('AI Resume Building').should('be.visible');
    cy.contains('AU$25').should('be.visible');
    
    // Test quantity controls
    cy.get('[data-testid="quantity-plus"]').click();
    cy.get('[data-testid="quantity-display"]').should('contain', '2');
    
    cy.get('[data-testid="quantity-minus"]').click();
    cy.get('[data-testid="quantity-display"]').should('contain', '1');
    
    // Test item removal
    cy.get('[data-testid="remove-item"]').click();
    cy.contains('Your cart is empty').should('be.visible');
  });

  it('calculates totals correctly', () => {
    // Add a paid item
    cy.get('[data-testid="ai-resume-building-card"]').within(() => {
      cy.contains('Add to Cart').click();
    });
    
    // Open cart
    cy.get('[data-testid="cart-icon"]').click();
    
    // Verify subtotal, GST, and total
    cy.contains('Subtotal').should('be.visible');
    cy.contains('GST (10%)').should('be.visible');
    cy.contains('Total').should('be.visible');
    
    // For AU$25 item: subtotal AU$25, GST AU$2.50, total AU$27.50
    cy.contains('AU$25.00').should('be.visible'); // Subtotal
    cy.contains('AU$2.50').should('be.visible');  // GST
    cy.contains('AU$27.50').should('be.visible'); // Total
  });

  it('applies promo codes', () => {
    // Add item to cart
    cy.get('[data-testid="ai-resume-building-card"]').within(() => {
      cy.contains('Add to Cart').click();
    });
    
    // Open cart
    cy.get('[data-testid="cart-icon"]').click();
    
    // Apply promo code
    cy.get('[data-testid="promo-input"]').type('SAVE10');
    cy.get('[data-testid="apply-promo"]').click();
    
    // Verify discount is applied
    cy.contains('10% off').should('be.visible');
    cy.contains('Discount (SAVE10)').should('be.visible');
    
    // Verify updated totals
    cy.contains('AU$24.75').should('be.visible'); // New total with discount
  });
});
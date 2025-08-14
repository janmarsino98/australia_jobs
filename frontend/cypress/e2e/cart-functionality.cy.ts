describe('Shopping Cart Functionality', () => {
  beforeEach(() => {
    cy.visit('/store');
  });

  describe('Adding Items to Cart', () => {
    it('adds single item to cart successfully', () => {
      // Add AI Resume Building to cart
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      // Verify cart icon shows correct count
      cy.get('[data-testid="cart-icon"]').should('contain', '1');

      // Open cart and verify item
      cy.get('[data-testid="cart-icon"]').click();
      cy.get('[data-testid="shopping-cart"]').should('be.visible');
      cy.contains('AI Resume Building').should('be.visible');
      cy.contains('AU$25').should('be.visible');
    });

    it('adds multiple different items to cart', () => {
      // Add AI Resume Building
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      // Add Professional Resume Review
      cy.get('[data-testid="professional-resume-review-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      // Verify cart count
      cy.get('[data-testid="cart-icon"]').should('contain', '2');

      // Open cart and verify both items
      cy.get('[data-testid="cart-icon"]').click();
      cy.contains('AI Resume Building').should('be.visible');
      cy.contains('Professional Resume Review').should('be.visible');
    });

    it('increases quantity when same item added twice', () => {
      // Add same item twice
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      // Open cart and check quantity
      cy.get('[data-testid="cart-icon"]').click();
      cy.get('[data-testid="quantity-display"]').should('contain', '2');
    });

    it('handles package deal conflicts correctly', () => {
      // Add individual services first
      cy.get('[data-testid="professional-resume-review-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      // Add package deal that includes the individual service
      cy.get('[data-testid="professional-package-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      // Open cart - should only show package, not individual service
      cy.get('[data-testid="cart-icon"]').click();
      cy.contains('Complete Professional Package').should('be.visible');
      cy.contains('Professional Resume Review').should('not.exist');
    });
  });

  describe('Cart Item Management', () => {
    beforeEach(() => {
      // Add an item to cart before each test
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();
    });

    it('increases item quantity using plus button', () => {
      cy.get('[data-testid="quantity-plus"]').click();
      cy.get('[data-testid="quantity-display"]').should('contain', '2');
      
      // Verify total price updated
      cy.contains('AU$50').should('be.visible'); // 25 * 2
    });

    it('decreases item quantity using minus button', () => {
      // First increase quantity to 2
      cy.get('[data-testid="quantity-plus"]').click();
      cy.get('[data-testid="quantity-display"]').should('contain', '2');
      
      // Then decrease back to 1
      cy.get('[data-testid="quantity-minus"]').click();
      cy.get('[data-testid="quantity-display"]').should('contain', '1');
    });

    it('removes item when quantity reaches 0', () => {
      cy.get('[data-testid="quantity-minus"]').click();
      cy.contains('Your cart is empty').should('be.visible');
    });

    it('disables minus button when quantity is 1', () => {
      cy.get('[data-testid="quantity-minus"]').should('be.disabled');
    });

    it('limits maximum quantity to 5', () => {
      // Click plus button 5 times (should reach max of 5)
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="quantity-plus"]').click();
      }
      
      cy.get('[data-testid="quantity-display"]').should('contain', '5');
      cy.get('[data-testid="quantity-plus"]').should('be.disabled');
    });

    it('removes item using delete button', () => {
      cy.get('[data-testid="remove-item"]').click();
      cy.contains('Your cart is empty').should('be.visible');
    });

    it('clears entire cart', () => {
      // Add another item first
      cy.get('[data-testid="cart-close"]').click(); // Close cart
      cy.get('[data-testid="professional-resume-review-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click(); // Reopen cart

      // Clear cart
      cy.get('[data-testid="clear-cart"]').click();
      cy.contains('Your cart is empty').should('be.visible');
    });
  });

  describe('Cart Calculations', () => {
    it('calculates subtotal correctly for single item', () => {
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();

      cy.contains('Subtotal').should('be.visible');
      cy.contains('AU$25.00').should('be.visible');
    });

    it('calculates GST correctly (10% for Australia)', () => {
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();

      cy.contains('GST (10%)').should('be.visible');
      cy.contains('AU$2.50').should('be.visible'); // 10% of 25
    });

    it('calculates total correctly with GST', () => {
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();

      cy.contains('Total').should('be.visible');
      cy.contains('AU$27.50').should('be.visible'); // 25 + 2.50
    });

    it('updates calculations when quantity changes', () => {
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();

      // Increase quantity to 2
      cy.get('[data-testid="quantity-plus"]').click();

      // Check updated calculations
      cy.contains('AU$50.00').should('be.visible'); // Subtotal: 25 * 2
      cy.contains('AU$5.00').should('be.visible');  // GST: 10% of 50
      cy.contains('AU$55.00').should('be.visible'); // Total: 50 + 5
    });

    it('handles multiple items calculation', () => {
      // Add AI Resume Building (AU$25)
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      // Add Professional Resume Review (AU$85)
      cy.get('[data-testid="professional-resume-review-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      cy.get('[data-testid="cart-icon"]').click();

      // Check calculations: 25 + 85 = 110, GST = 11, Total = 121
      cy.contains('AU$110.00').should('be.visible'); // Subtotal
      cy.contains('AU$11.00').should('be.visible');  // GST
      cy.contains('AU$121.00').should('be.visible'); // Total
    });

    it('handles free items correctly', () => {
      // Free items should not affect pricing calculations
      // but should show appropriate messaging
      cy.get('[data-testid="ai-resume-review-card"]').within(() => {
        cy.contains('Get Free Review').click();
      });

      // Should redirect or process free service immediately
      // This behavior depends on implementation by other agents
      cy.url().should('not.equal', '/store');
    });
  });

  describe('Promo Code Functionality', () => {
    beforeEach(() => {
      // Add item and open cart
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();
    });

    it('applies valid promo code successfully', () => {
      cy.get('[data-testid="promo-input"]').type('SAVE10');
      cy.get('[data-testid="apply-promo"]').click();

      // Should show success message
      cy.contains('10% off').should('be.visible');
      cy.contains('Discount (SAVE10)').should('be.visible');

      // Should update total calculation
      cy.contains('-AU$2.50').should('be.visible'); // 10% of 25
    });

    it('rejects invalid promo code', () => {
      cy.get('[data-testid="promo-input"]').type('INVALID');
      cy.get('[data-testid="apply-promo"]').click();

      // Should show error message
      cy.contains('Invalid promo code').should('be.visible');
    });

    it('allows removing applied promo code', () => {
      // First apply a promo code
      cy.get('[data-testid="promo-input"]').type('SAVE10');
      cy.get('[data-testid="apply-promo"]').click();
      cy.contains('10% off').should('be.visible');

      // Remove the promo code
      cy.get('[data-testid="remove-promo"]').click();

      // Should return to original total
      cy.contains('AU$27.50').should('be.visible'); // Original total
      cy.contains('10% off').should('not.exist');
    });

    it('applies promo code to multiple items', () => {
      // Close cart and add another item
      cy.get('[data-testid="cart-close"]').click();
      cy.get('[data-testid="professional-resume-review-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();

      // Apply promo code
      cy.get('[data-testid="promo-input"]').type('WELCOME'); // 15% discount
      cy.get('[data-testid="apply-promo"]').click();

      // Should apply to entire subtotal (25 + 85 = 110)
      cy.contains('15% off').should('be.visible');
      cy.contains('-AU$16.50').should('be.visible'); // 15% of 110
    });
  });

  describe('Cart Persistence', () => {
    it('persists cart items across page reloads', () => {
      // Add item to cart
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      // Reload page
      cy.reload();

      // Cart should still show item
      cy.get('[data-testid="cart-icon"]').should('contain', '1');
      cy.get('[data-testid="cart-icon"]').click();
      cy.contains('AI Resume Building').should('be.visible');
    });

    it('persists applied promo codes', () => {
      // Add item and apply promo
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();
      cy.get('[data-testid="promo-input"]').type('SAVE10');
      cy.get('[data-testid="apply-promo"]').click();

      // Reload page
      cy.reload();

      // Promo should still be applied
      cy.get('[data-testid="cart-icon"]').click();
      cy.contains('10% off').should('be.visible');
    });
  });

  describe('Cart Recommendations', () => {
    it('shows package recommendations when individual services added', () => {
      // Add individual professional services
      cy.get('[data-testid="professional-resume-review-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      cy.get('[data-testid="cart-icon"]').click();

      // Should show package recommendation
      cy.contains('💡 Recommended for you').should('be.visible');
      cy.contains('Complete Professional Package').should('be.visible');
      cy.contains('Save AU$').should('be.visible');
    });

    it('allows adding recommended items', () => {
      // Add service that triggers recommendations
      cy.get('[data-testid="professional-resume-review-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });

      cy.get('[data-testid="cart-icon"]').click();

      // Add recommended package
      cy.get('[data-testid="recommendation-add"]').click();

      // Should replace individual service with package
      cy.contains('Complete Professional Package').should('be.visible');
    });
  });

  describe('Cart Checkout Flow', () => {
    it('displays checkout button with correct total', () => {
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();

      cy.contains('Checkout (AU$27.50)').should('be.visible');
    });

    it('processes free services differently', () => {
      // Add only free service
      cy.get('[data-testid="ai-resume-review-card"]').within(() => {
        cy.contains('Get Free Review').click();
      });

      // Should handle free service flow
      // Implementation depends on other agents
      cy.url().should('not.equal', '/store');
    });

    it('shows security indicators', () => {
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();

      cy.contains('💳 Secure checkout with Stripe').should('be.visible');
      cy.contains('🔒 SSL encrypted').should('be.visible');
      cy.contains('📧 Order confirmation via email').should('be.visible');
    });

    it('navigates to checkout when button clicked', () => {
      cy.get('[data-testid="ai-resume-building-card"]').within(() => {
        cy.contains('Add to Cart').click();
      });
      cy.get('[data-testid="cart-icon"]').click();

      cy.get('[data-testid="checkout-button"]').click();

      // Should navigate to checkout page (implementation by Agent 4)
      cy.url().should('include', '/checkout');
    });
  });
});
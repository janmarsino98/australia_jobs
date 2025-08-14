import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceComparison from '../ServiceComparison';
import { Product } from '../../../types/store';

const mockAIService: Product = {
  id: 'ai-service',
  name: 'AI Resume Review',
  category: 'ai-service',
  price: 0,
  currency: 'AUD',
  description: 'AI-powered resume analysis',
  shortDescription: 'Instant automated resume analysis',
  features: ['Instant analysis', 'ATS optimization'],
  deliveryTime: 'Instant',
  active: true,
  metadata: {
    isPackage: false,
    isFree: true
  }
};

const mockProfessionalService: Product = {
  id: 'professional-service',
  name: 'Professional Resume Review',
  category: 'professional-service',
  price: 85,
  currency: 'AUD',
  description: 'Expert human resume review',
  shortDescription: 'Human expert resume review',
  features: ['Expert review', 'Personal consultation'],
  deliveryTime: '1-2 business days',
  active: true,
  metadata: {
    isPackage: false,
    isFree: false
  }
};

describe('ServiceComparison', () => {
  const mockOnSelectService = jest.fn();

  beforeEach(() => {
    mockOnSelectService.mockClear();
  });

  it('displays no services message when no services provided', () => {
    render(<ServiceComparison onSelectService={mockOnSelectService} />);
    
    expect(screen.getByText('No services available for comparison')).toBeInTheDocument();
  });

  it('displays AI service information correctly', () => {
    render(
      <ServiceComparison 
        aiService={mockAIService} 
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('AI Resume Review')).toBeInTheDocument();
    expect(screen.getByText('Instant automated resume analysis')).toBeInTheDocument();
    expect(screen.getByText('AI Powered')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('displays professional service information correctly', () => {
    render(
      <ServiceComparison 
        professionalService={mockProfessionalService} 
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('Professional Resume Review')).toBeInTheDocument();
    expect(screen.getByText('Human expert resume review')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('AU$85')).toBeInTheDocument();
  });

  it('displays both services when both are provided', () => {
    render(
      <ServiceComparison 
        aiService={mockAIService}
        professionalService={mockProfessionalService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('AI Resume Review')).toBeInTheDocument();
    expect(screen.getByText('Professional Resume Review')).toBeInTheDocument();
    expect(screen.getByText('AI vs Professional Services')).toBeInTheDocument();
  });

  it('displays comparison features for both services', () => {
    render(
      <ServiceComparison 
        aiService={mockAIService}
        professionalService={mockProfessionalService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    const comparisonFeatures = [
      'Delivery Time',
      'Price',
      'Quality Level',
      'Revision Rounds',
      'Personal Consultation',
      'Industry Expertise'
    ];

    comparisonFeatures.forEach(feature => {
      expect(screen.getAllByText(`${feature}:`)).toHaveLength(2); // Should appear in both columns
    });
  });

  it('shows correct feature comparisons for AI service', () => {
    render(
      <ServiceComparison 
        aiService={mockAIService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('Instant')).toBeInTheDocument(); // Delivery Time
    expect(screen.getByText('Automated')).toBeInTheDocument(); // Quality Level
    expect(screen.getByText('Unlimited')).toBeInTheDocument(); // Revision Rounds
    expect(screen.getByText('Not Included')).toBeInTheDocument(); // Personal Consultation
    expect(screen.getByText('General')).toBeInTheDocument(); // Industry Expertise
  });

  it('shows correct feature comparisons for professional service', () => {
    render(
      <ServiceComparison 
        professionalService={mockProfessionalService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('1-2 business days')).toBeInTheDocument(); // Delivery Time
    expect(screen.getByText('Expert Review')).toBeInTheDocument(); // Quality Level
    expect(screen.getByText('3 Rounds')).toBeInTheDocument(); // Revision Rounds
    expect(screen.getByText('30 min Call')).toBeInTheDocument(); // Personal Consultation
    expect(screen.getByText('Industry Specific')).toBeInTheDocument(); // Industry Expertise
  });

  it('displays status icons for features', () => {
    render(
      <ServiceComparison 
        aiService={mockAIService}
        professionalService={mockProfessionalService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getAllByText('✅')).toHaveLength.greaterThan(0);
    expect(screen.getAllByText('👍')).toHaveLength.greaterThan(0);
    expect(screen.getAllByText('⚠️')).toHaveLength.greaterThan(0);
    expect(screen.getAllByText('❌')).toHaveLength.greaterThan(0);
  });

  it('applies correct status colors', () => {
    render(
      <ServiceComparison 
        aiService={mockAIService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    // Check for different status color classes
    expect(document.querySelector('.text-green-600')).toBeInTheDocument();
    expect(document.querySelector('.text-blue-600')).toBeInTheDocument();
    expect(document.querySelector('.text-gray-500')).toBeInTheDocument();
  });

  it('calls onSelectService when AI service button is clicked', () => {
    render(
      <ServiceComparison 
        aiService={mockAIService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    const button = screen.getByText('Get Free Review');
    fireEvent.click(button);
    
    expect(mockOnSelectService).toHaveBeenCalledWith(mockAIService);
  });

  it('calls onSelectService when professional service button is clicked', () => {
    render(
      <ServiceComparison 
        professionalService={mockProfessionalService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    const button = screen.getByText('Select Professional Service');
    fireEvent.click(button);
    
    expect(mockOnSelectService).toHaveBeenCalledWith(mockProfessionalService);
  });

  it('displays correct button text for free vs paid AI services', () => {
    const paidAIService = { ...mockAIService, price: 25 };
    
    const { rerender } = render(
      <ServiceComparison 
        aiService={mockAIService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('Get Free Review')).toBeInTheDocument();
    
    rerender(
      <ServiceComparison 
        aiService={paidAIService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('Select AI Service')).toBeInTheDocument();
  });

  it('displays quick comparison summary', () => {
    render(
      <ServiceComparison 
        aiService={mockAIService}
        professionalService={mockProfessionalService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('Quick Comparison')).toBeInTheDocument();
    expect(screen.getByText('AI Service')).toBeInTheDocument();
    expect(screen.getByText('Professional Service')).toBeInTheDocument();
    
    // Check for quick comparison points
    expect(screen.getByText('✅ Instant results')).toBeInTheDocument();
    expect(screen.getByText('✅ Free option available')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Automated analysis')).toBeInTheDocument();
    expect(screen.getByText('✅ Human expertise')).toBeInTheDocument();
    expect(screen.getByText('✅ Personal consultation')).toBeInTheDocument();
    expect(screen.getByText('✅ Industry-specific advice')).toBeInTheDocument();
  });

  it('handles instant delivery time correctly', () => {
    const instantService = { ...mockAIService, deliveryTime: 'Instant' };
    render(
      <ServiceComparison 
        aiService={instantService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('Instant')).toBeInTheDocument();
    // Should have excellent status (green color)
    expect(document.querySelector('.text-green-600.bg-green-50')).toBeInTheDocument();
  });

  it('handles different delivery times correctly', () => {
    const slowService = { ...mockProfessionalService, deliveryTime: '5-7 business days' };
    render(
      <ServiceComparison 
        professionalService={slowService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('5-7 business days')).toBeInTheDocument();
    // Should have good status (blue color) for non-instant delivery
    expect(document.querySelector('.text-blue-600.bg-blue-50')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ServiceComparison 
        aiService={mockAIService}
        onSelectService={mockOnSelectService}
        className="custom-comparison"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-comparison');
  });

  it('handles edge case with missing feature gracefully', () => {
    // This tests the default case in getFeatureComparison
    render(
      <ServiceComparison 
        aiService={mockAIService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    // All known features should render without errors
    expect(screen.getByText('Delivery Time:')).toBeInTheDocument();
    expect(screen.getByText('Price:')).toBeInTheDocument();
    expect(screen.getByText('Quality Level:')).toBeInTheDocument();
  });

  it('displays pricing correctly for different scenarios', () => {
    const paidService = { ...mockAIService, price: 50 };
    
    render(
      <ServiceComparison 
        aiService={paidService}
        onSelectService={mockOnSelectService} 
      />
    );
    
    expect(screen.getByText('AU$50')).toBeInTheDocument();
  });
});
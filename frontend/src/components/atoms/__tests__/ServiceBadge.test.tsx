import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceBadge from '../ServiceBadge';

describe('ServiceBadge', () => {
  it('displays AI service badge correctly', () => {
    render(<ServiceBadge type="ai-service" />);
    
    const badge = screen.getByText('AI Powered');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-pill-bg', 'text-pill-text');
  });

  it('displays professional service badge correctly', () => {
    render(<ServiceBadge type="professional-service" />);
    
    const badge = screen.getByText('Professional');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
  });

  it('displays package service badge correctly', () => {
    render(<ServiceBadge type="package" />);
    
    const badge = screen.getByText('Package Deal');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('border-green-500', 'text-green-700');
  });

  it('applies custom className when provided', () => {
    render(<ServiceBadge type="ai-service" className="custom-badge" />);
    
    const badge = screen.getByText('AI Powered');
    expect(badge).toHaveClass('custom-badge');
  });

  it('has consistent text styling across all badge types', () => {
    const { rerender } = render(<ServiceBadge type="ai-service" />);
    expect(screen.getByText('AI Powered')).toHaveClass('text-xs', 'font-medium');
    
    rerender(<ServiceBadge type="professional-service" />);
    expect(screen.getByText('Professional')).toHaveClass('text-xs', 'font-medium');
    
    rerender(<ServiceBadge type="package" />);
    expect(screen.getByText('Package Deal')).toHaveClass('text-xs', 'font-medium');
  });

  it('handles edge case with default fallback', () => {
    // This tests the default case in the switch statement
    render(<ServiceBadge type={'unknown-type' as any} />);
    
    const badge = screen.getByText('Service');
    expect(badge).toBeInTheDocument();
  });
});
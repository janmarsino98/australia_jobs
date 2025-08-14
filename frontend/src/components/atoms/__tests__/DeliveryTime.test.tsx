import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeliveryTime from '../DeliveryTime';

describe('DeliveryTime', () => {
  it('displays instant delivery with correct icon and color', () => {
    render(<DeliveryTime time="Instant" />);
    
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('Delivery: Instant')).toBeInTheDocument();
    
    const container = screen.getByText('Delivery: Instant').closest('div');
    expect(container).toHaveClass('text-green-600');
  });

  it('displays immediate delivery with instant styling', () => {
    render(<DeliveryTime time="Immediate" />);
    
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('Delivery: Immediate')).toBeInTheDocument();
    
    const container = screen.getByText('Delivery: Immediate').closest('div');
    expect(container).toHaveClass('text-green-600');
  });

  it('displays hour delivery with correct icon and color', () => {
    render(<DeliveryTime time="2-3 hours" />);
    
    expect(screen.getByText('🕐')).toBeInTheDocument();
    expect(screen.getByText('Delivery: 2-3 hours')).toBeInTheDocument();
    
    const container = screen.getByText('Delivery: 2-3 hours').closest('div');
    expect(container).toHaveClass('text-blue-600');
  });

  it('displays day delivery with correct icon and color', () => {
    render(<DeliveryTime time="3-5 days" />);
    
    expect(screen.getByText('📅')).toBeInTheDocument();
    expect(screen.getByText('Delivery: 3-5 days')).toBeInTheDocument();
    
    const container = screen.getByText('Delivery: 3-5 days').closest('div');
    expect(container).toHaveClass('text-yellow-600');
  });

  it('displays longer day delivery with gray color', () => {
    render(<DeliveryTime time="7-10 days" />);
    
    expect(screen.getByText('📅')).toBeInTheDocument();
    expect(screen.getByText('Delivery: 7-10 days')).toBeInTheDocument();
    
    const container = screen.getByText('Delivery: 7-10 days').closest('div');
    expect(container).toHaveClass('text-gray-600');
  });

  it('displays week delivery with correct icon and color', () => {
    render(<DeliveryTime time="1-2 weeks" />);
    
    expect(screen.getByText('🗓️')).toBeInTheDocument();
    expect(screen.getByText('Delivery: 1-2 weeks')).toBeInTheDocument();
    
    const container = screen.getByText('Delivery: 1-2 weeks').closest('div');
    expect(container).toHaveClass('text-gray-600');
  });

  it('displays default icon and color for unknown time format', () => {
    render(<DeliveryTime time="Custom timeframe" />);
    
    expect(screen.getByText('⏱️')).toBeInTheDocument();
    expect(screen.getByText('Delivery: Custom timeframe')).toBeInTheDocument();
    
    const container = screen.getByText('Delivery: Custom timeframe').closest('div');
    expect(container).toHaveClass('text-gray-600');
  });

  it('applies custom className when provided', () => {
    render(<DeliveryTime time="Instant" className="custom-delivery" />);
    
    const container = screen.getByText('Delivery: Instant').closest('div');
    expect(container).toHaveClass('custom-delivery');
  });

  it('handles case insensitive time detection', () => {
    render(<DeliveryTime time="INSTANT DELIVERY" />);
    
    expect(screen.getByText('⚡')).toBeInTheDocument();
    const container = screen.getByText('Delivery: INSTANT DELIVERY').closest('div');
    expect(container).toHaveClass('text-green-600');
  });

  it('maintains consistent structure across all delivery times', () => {
    const { rerender } = render(<DeliveryTime time="Instant" />);
    
    let container = screen.getByText('Delivery: Instant').closest('div');
    expect(container).toHaveClass('flex', 'items-center', 'gap-1', 'text-sm');
    
    rerender(<DeliveryTime time="2 hours" />);
    container = screen.getByText('Delivery: 2 hours').closest('div');
    expect(container).toHaveClass('flex', 'items-center', 'gap-1', 'text-sm');
    
    rerender(<DeliveryTime time="3 days" />);
    container = screen.getByText('Delivery: 3 days').closest('div');
    expect(container).toHaveClass('flex', 'items-center', 'gap-1', 'text-sm');
  });
});
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PriceTag from '../PriceTag';

describe('PriceTag', () => {
  it('displays free price correctly', () => {
    render(<PriceTag amount={0} currency="AUD" />);
    
    expect(screen.getByText('FREE')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toHaveClass('text-green-600', 'text-lg');
  });

  it('displays paid price correctly', () => {
    render(<PriceTag amount={25} currency="AUD" />);
    
    expect(screen.getByText('AU$25')).toBeInTheDocument();
    expect(screen.getByText('AU$25')).toHaveClass('text-2xl');
  });

  it('displays strikethrough price when provided', () => {
    render(<PriceTag amount={25} currency="AUD" strikethrough={50} />);
    
    expect(screen.getByText('AU$50')).toBeInTheDocument();
    expect(screen.getByText('AU$50')).toHaveClass('line-through', 'text-muted-foreground');
    expect(screen.getByText('AU$25')).toBeInTheDocument();
  });

  it('displays savings when provided', () => {
    render(<PriceTag amount={25} currency="AUD" savings={10} />);
    
    expect(screen.getByText('Save AU$10')).toBeInTheDocument();
    expect(screen.getByText('Save AU$10')).toHaveClass('text-green-600');
  });

  it('displays complete price with all features', () => {
    render(
      <PriceTag 
        amount={25} 
        currency="AUD" 
        strikethrough={50} 
        savings={25}
      />
    );
    
    expect(screen.getByText('AU$50')).toHaveClass('line-through');
    expect(screen.getByText('AU$25')).toBeInTheDocument();
    expect(screen.getByText('Save AU$25')).toBeInTheDocument();
  });

  it('does not display savings when savings is 0', () => {
    render(<PriceTag amount={25} currency="AUD" savings={0} />);
    
    expect(screen.queryByText(/Save/)).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<PriceTag amount={25} currency="AUD" className="custom-class" />);
    
    const container = screen.getByText('AU$25').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('formats currency correctly for AUD', () => {
    render(<PriceTag amount={99.50} currency="AUD" />);
    
    expect(screen.getByText('AU$99.5')).toBeInTheDocument();
  });
});
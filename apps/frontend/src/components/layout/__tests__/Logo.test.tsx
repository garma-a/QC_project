import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo, LogoCompact } from '../Logo';
import React from 'react';

describe('Logo component', () => {
  it('renders standard Logo correctly', () => {
    render(<Logo />);
    expect(screen.getByText('MAGDI YACOUB')).toBeInTheDocument();
    expect(screen.getByText('Heart Center')).toBeInTheDocument();
    expect(screen.getByText('LABORATORY QC')).toBeInTheDocument();
    
    // Test for svg (lucide-react Heart)
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders standard Logo with custom className', () => {
    const { container } = render(<Logo className="custom-logo" />);
    expect(container.firstChild).toHaveClass('custom-logo');
  });

  it('renders compact Logo correctly', () => {
    render(<LogoCompact />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders compact Logo with custom className', () => {
    const { container } = render(<LogoCompact className="custom-compact-logo" />);
    expect(container.firstChild).toHaveClass('custom-compact-logo');
  });
});

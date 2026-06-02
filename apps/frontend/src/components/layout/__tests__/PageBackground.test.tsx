import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageBackground } from '../PageBackground';
import React from 'react';

describe('PageBackground component', () => {
  it('renders background elements', () => {
    const { container } = render(<PageBackground />);
    
    // Contains animated elements
    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);

    // Contains svg hearts
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});

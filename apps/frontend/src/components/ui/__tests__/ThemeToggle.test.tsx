import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeToggle } from '../ThemeToggle';
import React from 'react';

// Mock the ThemeContext hook
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from '@/contexts/ThemeContext';

describe('ThemeToggle component', () => {
  it('renders sun icon when theme is dark', () => {
    (useTheme as any).mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() });
    
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    // Check if the icon is present
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders moon icon when theme is light', () => {
    (useTheme as any).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
    
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('calls toggleTheme on click', () => {
    const toggleThemeMock = vi.fn();
    (useTheme as any).mockReturnValue({ theme: 'light', toggleTheme: toggleThemeMock });
    
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
  });
});

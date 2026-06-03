import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import React from 'react';

beforeAll(() => {
  if (typeof window !== 'undefined') {
    window.HTMLElement.prototype.hasPointerCapture = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  }
});

describe('Select component', () => {
  it('renders correctly', () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('forwards ref to trigger correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Select>
        <SelectTrigger ref={ref} data-testid="select-trigger">
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

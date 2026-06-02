import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Select, SelectOption } from '../select';
import React from 'react';

describe('Select component', () => {
  it('renders correctly with options', () => {
    render(
      <Select data-testid="select">
        <SelectOption value="1">Option 1</SelectOption>
        <SelectOption value="2">Option 2</SelectOption>
      </Select>
    );

    const select = screen.getByTestId('select');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('renders placeholder correctly', () => {
    render(
      <Select placeholder="Select an option" data-testid="select">
        <SelectOption value="1">Option 1</SelectOption>
      </Select>
    );

    expect(screen.getByText('Select an option')).toBeDisabled();
  });

  it('handles value changes', () => {
    render(
      <Select data-testid="select">
        <SelectOption value="1">Option 1</SelectOption>
        <SelectOption value="2">Option 2</SelectOption>
      </Select>
    );

    const select = screen.getByTestId('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '2' } });
    expect(select.value).toBe('2');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLSelectElement>();
    render(<Select ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});

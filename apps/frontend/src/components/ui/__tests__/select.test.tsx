import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../select';

describe('Select component', () => {
  it('renders correctly with options', () => {
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
  });

  it('renders placeholder correctly', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Custom Placeholder" />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByText('Custom Placeholder')).toBeInTheDocument();
  });

  it('handles controlled value', () => {
    render(
      <Select value="2">
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('forwards ref correctly to trigger', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Select>
        <SelectTrigger ref={ref} />
      </Select>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

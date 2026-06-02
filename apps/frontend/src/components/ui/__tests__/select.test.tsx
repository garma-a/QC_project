import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';

describe('Select component', () => {
  it('renders trigger and placeholder correctly', () => {
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

    expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });
});

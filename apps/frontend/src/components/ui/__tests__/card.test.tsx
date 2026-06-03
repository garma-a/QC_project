import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardContent } from '../card';

describe('Card components', () => {
  it('renders the Card container correctly', () => {
    render(<Card data-testid="card">Card Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-card');
  });

  it('renders the Card components properly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>My Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Inner content</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('My Title').tagName).toBe('H3');
    
    expect(screen.getByText('Inner content')).toBeInTheDocument();
  });

  it('applies custom classes to all card components', () => {
    render(
      <Card className="custom-card" data-testid="card">
        <CardHeader className="custom-header" data-testid="card-header">
          <CardTitle className="custom-title">Title</CardTitle>
        </CardHeader>
        <CardContent className="custom-content" data-testid="card-content">
          Content
        </CardContent>
      </Card>
    );

    expect(screen.getByTestId('card')).toHaveClass('custom-card');
    expect(screen.getByTestId('card-header')).toHaveClass('custom-header');
    expect(screen.getByText('Title')).toHaveClass('custom-title');
    expect(screen.getByTestId('card-content')).toHaveClass('custom-content');
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../dialog';
import React, { useState } from 'react';

const TestDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>Open Dialog</DialogTrigger>
      <DialogContent data-testid="dialog-content">
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog Description</DialogDescription>
        </DialogHeader>
        <div>Dialog Inner Content</div>
      </DialogContent>
    </Dialog>
  );
};

describe('Dialog component', () => {
  it('does not render content initially when closed', () => {
    render(<TestDialog />);
    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
  });

  it('renders content when trigger is clicked', () => {
    render(<TestDialog />);
    fireEvent.click(screen.getByText('Open Dialog'));
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog Description')).toBeInTheDocument();
  });

  it('closes dialog when pressing Escape', () => {
    render(<TestDialog />);
    fireEvent.click(screen.getByText('Open Dialog'));
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
  });
});

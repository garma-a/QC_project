import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../table';

describe('Table components', () => {
  it('renders correctly', () => {
    render(
      <Table data-testid="table">
        <TableHeader data-testid="header">
          <TableRow>
            <TableHead>Header 1</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-testid="body">
          <TableRow data-testid="row">
            <TableCell data-testid="cell">Cell 1</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByTestId('table')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('body')).toBeInTheDocument();
    expect(screen.getByText('Header 1')).toBeInTheDocument();
    expect(screen.getByTestId('row')).toBeInTheDocument();
    expect(screen.getByTestId('cell')).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
  });

  it('applies custom classes', () => {
    render(
      <Table className="custom-table" data-testid="table">
        <TableHeader className="custom-header" data-testid="header">
          <TableRow className="custom-row" data-testid="row">
            <TableHead className="custom-head" data-testid="head">Head</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="custom-body" data-testid="body">
          <TableRow>
            <TableCell className="custom-cell" data-testid="cell">Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByTestId('table')).toHaveClass('custom-table');
    expect(screen.getByTestId('header')).toHaveClass('custom-header');
    expect(screen.getByTestId('row')).toHaveClass('custom-row');
    expect(screen.getByTestId('head')).toHaveClass('custom-head');
    expect(screen.getByTestId('body')).toHaveClass('custom-body');
    expect(screen.getByTestId('cell')).toHaveClass('custom-cell');
  });
});

import { DropdownMenu, MenuItem, MenuSeparator } from '@/components/dropdown-menu';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

function renderMenu(onEdit = vi.fn(), onDelete = vi.fn()) {
  return {
    onEdit,
    onDelete,
    ...render(
      <DropdownMenu label="Actions">
        <MenuItem onSelect={onEdit}>Edit</MenuItem>
        <MenuItem onSelect={onEdit}>Share</MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={onDelete} disabled>
          Delete
        </MenuItem>
      </DropdownMenu>,
    ),
  };
}

async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(results.violations).toEqual([]);
}

describe('DropdownMenu accessibility', () => {
  it('exposes an accessible trigger that is collapsed by default', async () => {
    const { container } = renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await expectNoViolations(container);
  });

  it('opens a labelled menu with menuitems and no violations', async () => {
    const { container } = renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(menu).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    await expectNoViolations(container);
  });

  it('marks the disabled item with aria-disabled', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('selects an item, fires onSelect and closes', () => {
    const { onEdit } = renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not select a disabled item', () => {
    const { onDelete } = renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes on Escape and restores focus to the trigger', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe('DropdownMenu keyboard navigation', () => {
  const item = (name: string) => screen.getByRole('menuitem', { name });

  it('opens on ArrowDown, focusing the first item with roving tabindex', () => {
    renderMenu();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Actions' }), { key: 'ArrowDown' });
    expect(item('Edit')).toHaveFocus();
    expect(item('Edit')).toHaveAttribute('tabindex', '0');
    expect(item('Share')).toHaveAttribute('tabindex', '-1');
  });

  it('opens on ArrowUp focusing the last enabled item', () => {
    renderMenu();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Actions' }), { key: 'ArrowUp' });
    // Delete is disabled, so the last *enabled* item is Share.
    expect(item('Share')).toHaveFocus();
  });

  it('moves with Arrow keys and wraps around, skipping the disabled item', () => {
    renderMenu();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Actions' }), { key: 'ArrowDown' });
    const menu = screen.getByRole('menu');

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(item('Share')).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' }); // past disabled Delete → wraps to Edit
    expect(item('Edit')).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowUp' }); // wraps back up to Share
    expect(item('Share')).toHaveFocus();
  });

  it('jumps to the first / last enabled item with Home / End', () => {
    renderMenu();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Actions' }), { key: 'ArrowDown' });
    const menu = screen.getByRole('menu');

    fireEvent.keyDown(menu, { key: 'End' });
    expect(item('Share')).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'Home' });
    expect(item('Edit')).toHaveFocus();
  });

  it('selects the focused item with Enter and closes', () => {
    const { onEdit } = renderMenu();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Actions' }), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Enter' });
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

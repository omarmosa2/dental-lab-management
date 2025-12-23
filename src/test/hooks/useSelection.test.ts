import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelection } from '../../renderer/hooks/useSelection';

describe('useSelection Hook', () => {
  const mockItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useSelection());
    
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should toggle selection', () => {
    const { result } = renderHook(() => useSelection());
    
    act(() => {
      result.current.toggleSelection(1);
    });
    
    expect(result.current.isSelected(1)).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    
    act(() => {
      result.current.toggleSelection(1);
    });
    
    expect(result.current.isSelected(1)).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('should select all items', () => {
    const { result } = renderHook(() => useSelection());
    
    act(() => {
      result.current.selectAll(mockItems);
    });
    
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isAllSelected(mockItems)).toBe(true);
  });

  it('should deselect all items', () => {
    const { result } = renderHook(() => useSelection());
    
    act(() => {
      result.current.selectAll(mockItems);
      result.current.deselectAll();
    });
    
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected(mockItems)).toBe(false);
  });

  it('should get selected items', () => {
    const { result } = renderHook(() => useSelection());
    
    act(() => {
      result.current.toggleSelection(1);
      result.current.toggleSelection(3);
    });
    
    const selectedItems = result.current.getSelectedItems(mockItems);
    expect(selectedItems).toHaveLength(2);
    expect(selectedItems[0].id).toBe(1);
    expect(selectedItems[1].id).toBe(3);
  });

  it('should detect some selected state', () => {
    const { result } = renderHook(() => useSelection());
    
    act(() => {
      result.current.toggleSelection(1);
    });
    
    expect(result.current.isSomeSelected(mockItems)).toBe(true);
    expect(result.current.isAllSelected(mockItems)).toBe(false);
  });
});
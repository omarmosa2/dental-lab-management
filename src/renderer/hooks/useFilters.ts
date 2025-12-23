import { useState, useMemo, useCallback } from 'react';

export interface FilterConfig {
  [key: string]: string | [string, string];
}

export interface UseFiltersOptions<T> {
  data: T[];
  filterFn: (item: T, filters: FilterConfig) => boolean;
  initialFilters?: FilterConfig;
}

export function useFilters<T>({ data, filterFn, initialFilters = {} }: UseFiltersOptions<T>) {
  const [filters, setFilters] = useState<FilterConfig>(initialFilters);

  // Update a single filter
  const updateFilter = useCallback((key: string, value: string | [string, string]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Clear a single filter
  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Reset to initial filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Count active filters (non-empty values)
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => {
      if (Array.isArray(value)) {
        return value[0] !== '' || value[1] !== '';
      }
      return value !== '';
    }).length;
  }, [filters]);

  // Check if any filter is active
  const hasActiveFilters = activeFiltersCount > 0;

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!hasActiveFilters) {
      return data;
    }
    return data.filter(item => filterFn(item, filters));
  }, [data, filters, hasActiveFilters, filterFn]);

  return {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    resetFilters,
    activeFiltersCount,
    hasActiveFilters,
    filteredData,
  };
}
import { useState, useCallback } from 'react';
import type { Dentist, Order, Material } from '../../shared/types/api.types';

export type SearchResultType = 'dentist' | 'order' | 'material';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  url: string;
  data: Dentist | Order | Material;
}

export function useSearchViewModel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      const normalizedQuery = searchQuery.trim().toLowerCase();

      // Search dentists
      const dentistsResponse = await window.api.dentists.search(searchQuery);
      if (dentistsResponse.ok && dentistsResponse.data) {
        dentistsResponse.data.forEach((dentist) => {
          searchResults.push({
            id: `dentist-${dentist.id}`,
            type: 'dentist',
            title: dentist.name,
            subtitle: `${dentist.phone} • ${dentist.residence}`,
            url: '/doctors',
            data: dentist,
          });
        });
      }

      // Search orders by order number
      const ordersResponse = await window.api.orders.list({
        search: searchQuery,
      });
      if (ordersResponse.ok && ordersResponse.data) {
        ordersResponse.data.orders.slice(0, 10).forEach((order) => {
          searchResults.push({
            id: `order-${order.id}`,
            type: 'order',
            title: `طلب #${order.order_number}`,
            subtitle: `${order.case_type} • ${order.status}`,
            url: '/orders',
            data: order,
          });
        });
      }

      // Search materials
      const materialsResponse = await window.api.materials.list();
      if (materialsResponse.ok && materialsResponse.data) {
        const filteredMaterials = materialsResponse.data.filter(
          (material) =>
            material.name.toLowerCase().includes(normalizedQuery) ||
            material.code.toLowerCase().includes(normalizedQuery)
        );

        filteredMaterials.slice(0, 10).forEach((material) => {
          searchResults.push({
            id: `material-${material.id}`,
            type: 'material',
            title: material.name,
            subtitle: `الكود: ${material.code} • الكمية: ${material.quantity} ${material.unit}`,
            url: '/materials',
            data: material,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      search(newQuery);
    },
    [search]
  );

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    query,
    results,
    loading,
    isOpen,
    setQuery: handleQueryChange,
    search,
    clear,
    open,
    close,
  };
}
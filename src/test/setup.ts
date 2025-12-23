import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.api
(global as any).window = (global as any).window || {};
((global as any).window as any).api = {
  dentists: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    search: vi.fn(),
    count: vi.fn(),
  },
  orders: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    changeStatus: vi.fn(),
  },
  materials: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getLowStock: vi.fn(),
    updateQuantity: vi.fn(),
    count: vi.fn(),
  },
  workers: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    activate: vi.fn(),
    deactivate: vi.fn(),
    count: vi.fn(),
  },
  expenses: {
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    getTotalByPeriod: vi.fn(),
    count: vi.fn(),
  },
  payments: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    getByOrder: vi.fn(),
  },
  reports: {
    orders: vi.fn(),
    dentists: vi.fn(),
    materials: vi.fn(),
    payments: vi.fn(),
    expenses: vi.fn(),
    financial: vi.fn(),
    dashboardStats: vi.fn(),
    recentOrders: vi.fn(),
  },
};

(global.window as any).exportApi = {
  dentists: vi.fn(),
  orders: vi.fn(),
  materials: vi.fn(),
  workers: vi.fn(),
  expenses: vi.fn(),
  payments: vi.fn(),
};

(global.window as any).printApi = {
  order: vi.fn(),
  invoice: vi.fn(),
  report: vi.fn(),
};
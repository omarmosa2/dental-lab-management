import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type {
  ApiResponse,
  Dentist,
  CreateDentistDto,
  UpdateDentistDto,
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  OrderFilters,
  PaginationParams,
  Payment,
  CreatePaymentDto,
  PaymentFilters,
  Material,
  CreateMaterialDto,
  UpdateMaterialDto,
  Expense,
  CreateExpenseDto,
  ExpenseFilters,
  Worker,
  CreateWorkerDto,
  UpdateWorkerDto,
} from './shared/types/api.types';
import type {
  WhatsAppSettings,
  WhatsAppConnectionStatus,
  SendMessageRequest,
  SendMessageResponse,
  WhatsAppMessageLog,
  WhatsAppSettingsUpdateDto,
} from './shared/types/whatsapp.types';
import type { LicenseInfo } from './shared/types/license.types';

export interface ReportFilters {
  dateFrom?: number;
  dateTo?: number;
  dentistId?: number;
  status?: string;
  materialId?: number;
  category?: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  completedOrders: number;
  pendingOrders: number;
  totalOrders: number;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalExpenses: number;
  lowStockMaterials: number;
}

// Indicate preload is executed (debugging)
console.log('[preload] preload script executed');
contextBridge.exposeInMainWorld('agorraPreload', { loaded: true });

// Expose electron IPC for progress listeners
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
      ipcRenderer.on(channel, listener);
    },
    removeListener: (channel: string, listener: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, listener);
    },
  },
});

export interface AppSettings {
  id: number;
  app_name: string;
  theme: 'light' | 'dark';
  auto_backup: boolean;
  backup_interval_hours: number;
  backup_directory: string;
  notifications: boolean;
  last_backup_date?: number;
  created_at: number;
  updated_at: number;
}

export interface UpdateSettingsDto {
  app_name?: string;
  theme?: 'light' | 'dark';
  auto_backup?: boolean;
  backup_interval_hours?: number;
  backup_directory?: string;
  notifications?: boolean;
}

export interface BackupInfo {
  id: number;
  filename: string;
  filepath: string;
  size: number;
  created_at: number;
}

// Define the API interface
export interface ElectronAPI {
  dentists: {
    list: (page?: number, limit?: number) => Promise<ApiResponse<Dentist[]>>;
    count: () => Promise<ApiResponse<number>>;
    get: (id: number) => Promise<ApiResponse<Dentist>>;
    create: (dto: CreateDentistDto) => Promise<ApiResponse<Dentist>>;
    update: (id: number, dto: Partial<CreateDentistDto>) => Promise<ApiResponse<void>>;
    delete: (id: number) => Promise<ApiResponse<void>>;
    search: (query: string) => Promise<ApiResponse<Dentist[]>>;
  };
  orders: {
    list: (filters?: OrderFilters, pagination?: PaginationParams) => Promise<ApiResponse<Order[]>>;
    get: (id: number) => Promise<ApiResponse<Order>>;
    create: (dto: CreateOrderDto) => Promise<ApiResponse<Order>>;
    update: (id: number, dto: Partial<CreateOrderDto>) => Promise<ApiResponse<void>>;
    delete: (id: number) => Promise<ApiResponse<void>>;
    changeStatus: (id: number, status: string) => Promise<ApiResponse<void>>;
    paymentStatus: (id: number) => Promise<ApiResponse<{ total: number; paid: number; remaining: number }>>;
    count: (filters?: OrderFilters) => Promise<ApiResponse<number>>;
  };
  payments: {
    list: (filters?: PaymentFilters) => Promise<ApiResponse<Payment[]>>;
    get: (id: number) => Promise<ApiResponse<Payment>>;
    create: (dto: CreatePaymentDto) => Promise<ApiResponse<Payment>>;
    delete: (id: number) => Promise<ApiResponse<void>>;
    byOrder: (orderId: number) => Promise<ApiResponse<Payment[]>>;
    remaining: (orderId: number) => Promise<ApiResponse<number>>;
  };
  materials: {
    list: (page?: number, limit?: number) => Promise<ApiResponse<Material[]>>;
    count: () => Promise<ApiResponse<number>>;
    get: (id: number) => Promise<ApiResponse<Material>>;
    create: (dto: CreateMaterialDto) => Promise<ApiResponse<Material>>;
    update: (id: number, dto: Partial<CreateMaterialDto>) => Promise<ApiResponse<void>>;
    delete: (id: number) => Promise<ApiResponse<void>>;
    getLowStock: () => Promise<ApiResponse<Material[]>>;
    lowStock: () => Promise<ApiResponse<Material[]>>;
    updateQuantity: (id: number, quantity: number) => Promise<ApiResponse<void>>;
  };
  expenses: {
    list: (filters?: ExpenseFilters, page?: number, limit?: number) => Promise<ApiResponse<Expense[]>>;
    count: (filters?: ExpenseFilters) => Promise<ApiResponse<number>>;
    get: (id: number) => Promise<ApiResponse<Expense>>;
    create: (dto: CreateExpenseDto) => Promise<ApiResponse<Expense>>;
    delete: (id: number) => Promise<ApiResponse<void>>;
    getTotalByPeriod: (dateFrom: number, dateTo: number) => Promise<ApiResponse<number>>;
  };
  workers: {
    list: (page?: number, limit?: number) => Promise<ApiResponse<Worker[]>>;
    count: () => Promise<ApiResponse<number>>;
    listActive: () => Promise<ApiResponse<Worker[]>>;
    get: (id: number) => Promise<ApiResponse<Worker>>;
    create: (dto: CreateWorkerDto) => Promise<ApiResponse<Worker>>;
    update: (id: number, dto: Partial<CreateWorkerDto>) => Promise<ApiResponse<void>>;
    delete: (id: number) => Promise<ApiResponse<void>>;
    deactivate: (id: number) => Promise<ApiResponse<void>>;
    activate: (id: number) => Promise<ApiResponse<void>>;
  };
  reports: {
    orders: (filters?: ReportFilters) => Promise<ApiResponse<Order[]>>;
    dentists: () => Promise<ApiResponse<Dentist[]>>;
    materials: () => Promise<ApiResponse<Material[]>>;
    payments: (filters?: ReportFilters) => Promise<ApiResponse<Payment[]>>;
    expenses: (filters?: ReportFilters) => Promise<ApiResponse<Expense[]>>;
    financial: (filters?: ReportFilters) => Promise<ApiResponse<FinancialSummary>>;
    dashboardStats: () => Promise<ApiResponse<DashboardStats>>;
    getRecentOrders: (limit: number) => Promise<ApiResponse<Order[]>>;
  };
  settings: {
    get: () => Promise<ApiResponse<AppSettings>>;
    update: (dto: UpdateSettingsDto) => Promise<ApiResponse<void>>;
  };
  backup: {
    create: () => Promise<ApiResponse<BackupInfo>>;
    list: () => Promise<ApiResponse<BackupInfo[]>>;
    restore: (backupId: number) => Promise<ApiResponse<void>>;
    delete: (backupId: number) => Promise<ApiResponse<void>>;
    clearData: () => Promise<ApiResponse<void>>;
    getDirectory: () => Promise<ApiResponse<string>>;
    setDirectory: () => Promise<ApiResponse<string>>;
    getStats: () => Promise<ApiResponse<{
      totalBackups: number;
      totalSize: number;
      oldestBackup: number | null;
      newestBackup: number | null;
    }>>;
    checkAutoBackup: () => Promise<ApiResponse<void>>;
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api: ElectronAPI = {
  dentists: {
    list: (page, limit) => ipcRenderer.invoke('dentists:list', page, limit),
    count: () => ipcRenderer.invoke('dentists:count'),
    get: (id) => ipcRenderer.invoke('dentists:get', id),
    create: (dto) => ipcRenderer.invoke('dentists:create', dto),
    update: (id, dto) => ipcRenderer.invoke('dentists:update', id, dto),
    delete: (id) => ipcRenderer.invoke('dentists:delete', id),
    search: (query) => ipcRenderer.invoke('dentists:search', query),
  },
  orders: {
    list: (filters, pagination) => ipcRenderer.invoke('orders:list', filters, pagination),
    get: (id) => ipcRenderer.invoke('orders:get', id),
    create: (dto) => ipcRenderer.invoke('orders:create', dto),
    update: (id, dto) => ipcRenderer.invoke('orders:update', id, dto),
    delete: (id) => ipcRenderer.invoke('orders:delete', id),
    changeStatus: (id, status) => ipcRenderer.invoke('orders:changeStatus', id, status),
    paymentStatus: (id) => ipcRenderer.invoke('orders:paymentStatus', id),
    count: (filters) => ipcRenderer.invoke('orders:count', filters),
  },
  payments: {
    list: (filters) => ipcRenderer.invoke('payments:list', filters),
    get: (id) => ipcRenderer.invoke('payments:get', id),
    create: (dto) => ipcRenderer.invoke('payments:create', dto),
    delete: (id) => ipcRenderer.invoke('payments:delete', id),
    byOrder: (orderId) => ipcRenderer.invoke('payments:byOrder', orderId),
    remaining: (orderId) => ipcRenderer.invoke('payments:remaining', orderId),
  },
  materials: {
    list: (page, limit) => ipcRenderer.invoke('materials:list', page, limit),
    count: () => ipcRenderer.invoke('materials:count'),
    get: (id) => ipcRenderer.invoke('materials:get', id),
    create: (dto) => ipcRenderer.invoke('materials:create', dto),
    update: (id, dto) => ipcRenderer.invoke('materials:update', id, dto),
    delete: (id) => ipcRenderer.invoke('materials:delete', id),
    getLowStock: () => ipcRenderer.invoke('materials:getLowStock'),
    lowStock: () => ipcRenderer.invoke('materials:lowStock'),
    updateQuantity: (id, quantity) => ipcRenderer.invoke('materials:updateQuantity', id, quantity),
  },
  expenses: {
    list: (filters, page, limit) => ipcRenderer.invoke('expenses:list', filters, page, limit),
    count: (filters) => ipcRenderer.invoke('expenses:count', filters),
    get: (id) => ipcRenderer.invoke('expenses:get', id),
    create: (dto) => ipcRenderer.invoke('expenses:create', dto),
    delete: (id) => ipcRenderer.invoke('expenses:delete', id),
    getTotalByPeriod: (dateFrom, dateTo) => ipcRenderer.invoke('expenses:getTotalByPeriod', dateFrom, dateTo),
  },
  workers: {
    list: (page, limit) => ipcRenderer.invoke('workers:list', page, limit),
    count: () => ipcRenderer.invoke('workers:count'),
    listActive: () => ipcRenderer.invoke('workers:listActive'),
    get: (id) => ipcRenderer.invoke('workers:get', id),
    create: (dto) => ipcRenderer.invoke('workers:create', dto),
    update: (id, dto) => ipcRenderer.invoke('workers:update', id, dto),
    delete: (id) => ipcRenderer.invoke('workers:delete', id),
    deactivate: (id) => ipcRenderer.invoke('workers:deactivate', id),
    activate: (id) => ipcRenderer.invoke('workers:activate', id),
  },
  reports: {
    orders: (filters) => ipcRenderer.invoke('reports:orders', filters),
    dentists: () => ipcRenderer.invoke('reports:dentists'),
    materials: () => ipcRenderer.invoke('reports:materials'),
    payments: (filters) => ipcRenderer.invoke('reports:payments', filters),
    expenses: (filters) => ipcRenderer.invoke('reports:expenses', filters),
    financial: (filters) => ipcRenderer.invoke('reports:financial', filters),
    dashboardStats: () => ipcRenderer.invoke('reports:dashboardStats'),
    getRecentOrders: (limit) => ipcRenderer.invoke('reports:recentOrders', limit),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (dto) => ipcRenderer.invoke('settings:update', dto),
  },
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    list: () => ipcRenderer.invoke('backup:list'),
    restore: (backupId) => ipcRenderer.invoke('backup:restore', backupId),
    delete: (backupId) => ipcRenderer.invoke('backup:delete', backupId),
    clearData: () => ipcRenderer.invoke('backup:clearData'),
    getDirectory: () => ipcRenderer.invoke('backup:getDirectory'),
    setDirectory: () => ipcRenderer.invoke('backup:setDirectory'),
    getStats: () => ipcRenderer.invoke('backup:getStats'),
    checkAutoBackup: () => ipcRenderer.invoke('backup:checkAutoBackup'),
  },
};

contextBridge.exposeInMainWorld('api', api);

// Export API
const exportApi = {
  dentists: () => ipcRenderer.invoke('export:dentists'),
  orders: (filters?: OrderFilters) => ipcRenderer.invoke('export:orders', filters),
  materials: () => ipcRenderer.invoke('export:materials'),
  expenses: (filters?: ExpenseFilters) => ipcRenderer.invoke('export:expenses', filters),
  payments: (filters?: PaymentFilters) => ipcRenderer.invoke('export:payments', filters),
  workers: () => ipcRenderer.invoke('export:workers'),
};

contextBridge.exposeInMainWorld('exportApi', exportApi);

// Print API
const printApi = {
  order: (orderId: number) => ipcRenderer.invoke('print:order', orderId),
  invoice: (orderId: number) => ipcRenderer.invoke('print:invoice', orderId),
  report: (title: string, data: any[], columns: any[]) => ipcRenderer.invoke('print:report', title, data, columns),
};

contextBridge.exposeInMainWorld('printApi', printApi);

// WhatsApp API
const whatsAppApi = {
  connect: () => ipcRenderer.invoke('whatsapp:connect'),
  disconnect: () => ipcRenderer.invoke('whatsapp:disconnect'),
  reset: () => ipcRenderer.invoke('whatsapp:reset'),
  getStatus: () => ipcRenderer.invoke('whatsapp:getStatus') as Promise<ApiResponse<WhatsAppConnectionStatus>>,
  sendMessage: (request: SendMessageRequest) => ipcRenderer.invoke('whatsapp:sendMessage', request) as Promise<ApiResponse<SendMessageResponse>>,
  getMessageLogs: (limit?: number, offset?: number) => ipcRenderer.invoke('whatsapp:getMessageLogs', limit, offset) as Promise<ApiResponse<WhatsAppMessageLog[]>>,
  getSettings: () => ipcRenderer.invoke('whatsapp:getSettings') as Promise<ApiResponse<WhatsAppSettings | null>>,
  updateSettings: (updates: WhatsAppSettingsUpdateDto) => ipcRenderer.invoke('whatsapp:updateSettings', updates) as Promise<ApiResponse<WhatsAppSettings | null>>,
  openQRWindow: () => ipcRenderer.invoke('whatsapp:openQRWindow'),
  closeQRWindow: () => ipcRenderer.invoke('whatsapp:closeQRWindow'),
};

contextBridge.exposeInMainWorld('whatsAppApi', whatsAppApi);

// License API
const licenseApi = {
  getHardwareId: () => ipcRenderer.invoke('license:getHardwareId') as Promise<ApiResponse<string>>,
  getInfo: () => ipcRenderer.invoke('license:getInfo') as Promise<ApiResponse<LicenseInfo>>,
  isActivated: () => ipcRenderer.invoke('license:isActivated') as Promise<ApiResponse<boolean>>,
  activate: (licenseKey: string) => ipcRenderer.invoke('license:activate', licenseKey) as Promise<ApiResponse<{ success: boolean }>>,
  generateKey: (hardwareId: string) => ipcRenderer.invoke('license:generateKey', hardwareId) as Promise<ApiResponse<string>>,
  deactivate: () => ipcRenderer.invoke('license:deactivate') as Promise<ApiResponse<{ success: boolean }>>,
};

contextBridge.exposeInMainWorld('licenseApi', licenseApi);

// Database API (for testing/development)
const databaseApi = {
  seedLargeDataset: () => ipcRenderer.invoke('database:seedLargeDataset'),
  clearAllData: () => ipcRenderer.invoke('database:clearAllData'),
};

contextBridge.exposeInMainWorld('databaseApi', databaseApi);

// Utility API
const utilApi = {
  openExternal: (url: string) => ipcRenderer.invoke('util:openExternal', url),
};

contextBridge.exposeInMainWorld('utilApi', utilApi);

// Export to make this a module
export {};

// Type declaration removed - using global.d.ts instead
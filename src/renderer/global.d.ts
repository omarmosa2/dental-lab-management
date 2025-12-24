import type { 
  Dentist, 
  Order, 
  Payment, 
  Material, 
  Expense, 
  Worker,
  CreateDentistDto,
  UpdateDentistDto,
  CreateOrderDto,
  UpdateOrderDto,
  CreatePaymentDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  CreateExpenseDto,
  CreateWorkerDto,
  UpdateWorkerDto,
  OrderFilters,
  PaymentFilters,
  ExpenseFilters,
  PaginationParams,
  ApiResponse,
  ReportFilters,
  FinancialSummary,
  DashboardStats
} from '../shared/types/api.types';
import type {
  WhatsAppSettings,
  WhatsAppConnectionStatus,
  SendMessageRequest,
  SendMessageResponse,
  WhatsAppMessageLog,
  WhatsAppSettingsUpdateDto,
} from '../shared/types/whatsapp.types';
import type { LicenseInfo } from '../shared/types/license.types';

interface AppSettings {
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

interface UpdateSettingsDto {
  app_name?: string;
  theme?: 'light' | 'dark';
  auto_backup?: boolean;
  backup_interval_hours?: number;
  backup_directory?: string;
  notifications?: boolean;
}

interface BackupInfo {
  id: number;
  filename: string;
  filepath: string;
  size: number;
  created_at: number;
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        on: (channel: string, listener: (...args: any[]) => void) => void;
        removeListener: (channel: string, listener: (...args: any[]) => void) => void;
      };
    };
    whatsAppApi: {
      connect: () => Promise<ApiResponse<{ success: boolean }>>;
      disconnect: () => Promise<ApiResponse<{ success: boolean }>>;
      reset: () => Promise<ApiResponse<{ success: boolean }>>;
      getStatus: () => Promise<ApiResponse<WhatsAppConnectionStatus>>;
      sendMessage: (request: SendMessageRequest) => Promise<ApiResponse<SendMessageResponse>>;
      getMessageLogs: (limit?: number, offset?: number) => Promise<ApiResponse<WhatsAppMessageLog[]>>;
      getSettings: () => Promise<ApiResponse<WhatsAppSettings | null>>;
      updateSettings: (updates: WhatsAppSettingsUpdateDto) => Promise<ApiResponse<WhatsAppSettings | null>>;
      openQRWindow: () => Promise<ApiResponse<{ success: boolean }>>;
      closeQRWindow: () => Promise<ApiResponse<{ success: boolean }>>;
    };
    licenseApi: {
      getMachineId: () => Promise<ApiResponse<string>>;
      getInfo: () => Promise<ApiResponse<LicenseInfo>>;
      isActivated: () => Promise<ApiResponse<boolean>>;
      activate: (licenseKey: string) => Promise<ApiResponse<{ success: boolean }>>;
      deactivate: () => Promise<ApiResponse<{ success: boolean }>>;
    };
    printApi: {
      order: (orderId: number) => Promise<ApiResponse<string>>;
      invoice: (orderId: number) => Promise<ApiResponse<string>>;
      report: (title: string, data: any[], columns: any[]) => Promise<ApiResponse<string>>;
    };
    exportApi: {
      dentists: () => Promise<ApiResponse<string>>;
      orders: (filters?: OrderFilters) => Promise<ApiResponse<string>>;
      materials: () => Promise<ApiResponse<string>>;
      expenses: (filters?: ExpenseFilters) => Promise<ApiResponse<string>>;
      payments: (filters?: PaymentFilters) => Promise<ApiResponse<string>>;
      workers: () => Promise<ApiResponse<string>>;
    };
    api: {
      dentists: {
        list: (page?: number, limit?: number) => Promise<ApiResponse<Dentist[]>>;
        get: (id: number) => Promise<ApiResponse<Dentist>>;
        create: (dto: CreateDentistDto) => Promise<ApiResponse<Dentist>>;
        update: (dto: UpdateDentistDto) => Promise<ApiResponse<Dentist>>;
        delete: (id: number) => Promise<ApiResponse<void>>;
        search: (query: string) => Promise<ApiResponse<Dentist[]>>;
        count: () => Promise<ApiResponse<number>>;
      };
      orders: {
        list: (filters?: OrderFilters, pagination?: PaginationParams) => Promise<ApiResponse<{ orders: Order[]; total: number }>>;
        get: (id: number) => Promise<ApiResponse<Order>>;
        create: (dto: CreateOrderDto) => Promise<ApiResponse<Order>>;
        update: (id: number, dto: Partial<CreateOrderDto>) => Promise<ApiResponse<Order>>;
        delete: (id: number) => Promise<ApiResponse<void>>;
        changeStatus: (id: number, status: string) => Promise<ApiResponse<Order>>;
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
        get: (id: number) => Promise<ApiResponse<Material>>;
        create: (dto: CreateMaterialDto) => Promise<ApiResponse<Material>>;
        update: (dto: UpdateMaterialDto) => Promise<ApiResponse<Material>>;
        delete: (id: number) => Promise<ApiResponse<void>>;
        getLowStock: () => Promise<ApiResponse<Material[]>>;
        lowStock: () => Promise<ApiResponse<Material[]>>;
        updateQuantity: (id: number, quantity: number) => Promise<ApiResponse<Material>>;
        count: () => Promise<ApiResponse<number>>;
      };
      expenses: {
        list: (filters?: ExpenseFilters, page?: number, limit?: number) => Promise<ApiResponse<Expense[]>>;
        get: (id: number) => Promise<ApiResponse<Expense>>;
        create: (dto: CreateExpenseDto) => Promise<ApiResponse<Expense>>;
        delete: (id: number) => Promise<ApiResponse<void>>;
        getTotalByPeriod: (dateFrom: number, dateTo: number) => Promise<ApiResponse<number>>;
        getTotalByCategory: (category: string, dateFrom: number, dateTo: number) => Promise<ApiResponse<number>>;
        count: (filters?: ExpenseFilters) => Promise<ApiResponse<number>>;
      };
      workers: {
        list: (page?: number, limit?: number) => Promise<ApiResponse<Worker[]>>;
        listActive: () => Promise<ApiResponse<Worker[]>>;
        get: (id: number) => Promise<ApiResponse<Worker>>;
        create: (dto: CreateWorkerDto) => Promise<ApiResponse<Worker>>;
        update: (dto: UpdateWorkerDto) => Promise<ApiResponse<Worker>>;
        delete: (id: number) => Promise<ApiResponse<void>>;
        activate: (id: number) => Promise<ApiResponse<Worker>>;
        deactivate: (id: number) => Promise<ApiResponse<Worker>>;
        count: () => Promise<ApiResponse<number>>;
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
        checkAutoBackup: () => Promise<ApiResponse<void>>;
        getStats: () => Promise<ApiResponse<{ totalBackups: number; totalSize: number; lastBackup?: number }>>;
      };
      database: {
        seedLargeDataset: () => Promise<ApiResponse<{ success: boolean; message: string }>>;
        clearAllData: () => Promise<ApiResponse<{ success: boolean; message: string }>>;
      };
    };
    utilApi: {
      openExternal: (url: string) => Promise<ApiResponse<{ success: boolean }>>;
    };
  }
}

export {};
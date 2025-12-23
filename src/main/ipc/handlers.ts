import { ipcMain, shell } from 'electron';
import type { ApiResponse } from '../../shared/types/api.types';
import { DentistService } from '../core/services/DentistService';
import { OrderService } from '../core/services/OrderService';
import { PaymentService } from '../core/services/PaymentService';
import { MaterialService } from '../core/services/MaterialService';
import { ExpenseService } from '../core/services/ExpenseService';
import { WorkerService } from '../core/services/WorkerService';
import { ReportService } from '../core/services/ReportService';
import { ExcelExportService } from '../core/services/ExcelExportService';
import { PDFPrintService } from '../core/services/PDFPrintService';
import { SettingsService } from '../core/services/SettingsService';
import { BackupService } from '../core/services/BackupService';
import { DomainError } from '../core/utils/errors';
import { registerWhatsAppHandlers } from './whatsappHandlers';
import { registerLicenseHandlers } from './licenseHandlers';
import log from 'electron-log';
import { getDatabase } from '../core/database/connection';

// Initialize services
const dentistService = new DentistService();
const orderService = new OrderService();
const paymentService = new PaymentService();
const materialService = new MaterialService();
const expenseService = new ExpenseService();
const workerService = new WorkerService();
let settingsService: SettingsService;
let backupService: BackupService;
let reportService: ReportService;

/**
 * Wrap handler with error handling
 */
function wrapHandler<T>(handler: () => Promise<T>): Promise<ApiResponse<T>> {
  return handler()
    .then((data) => ({ ok: true, data }))
    .catch((error) => {
      log.error('IPC Handler Error:', error);
      
      if (error instanceof DomainError) {
        return {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        };
      }
      
      return {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
      };
    });
}

/**
 * Register all IPC handlers
 */
export function registerIpcHandlers(): void {
  log.info('Registering IPC handlers...');

  // Register WhatsApp handlers
  registerWhatsAppHandlers();

  // Register License handlers
  registerLicenseHandlers();

  // Dentist handlers
  ipcMain.handle('dentists:list', (_, page?: number, limit?: number) => wrapHandler(() => dentistService.listDentists(page, limit)));
  ipcMain.handle('dentists:count', () => wrapHandler(() => dentistService.countDentists()));
  ipcMain.handle('dentists:get', (_, id: number) => wrapHandler(() => dentistService.getDentist(id)));
  ipcMain.handle('dentists:create', (_, dto) => wrapHandler(() => dentistService.createDentist(dto)));
  ipcMain.handle('dentists:update', (_, dto) => wrapHandler(() => dentistService.updateDentist(dto)));
  ipcMain.handle('dentists:delete', (_, id: number) => wrapHandler(() => dentistService.deleteDentist(id)));
  ipcMain.handle('dentists:search', (_, query: string) => wrapHandler(() => dentistService.searchDentists(query)));

  // Order handlers
  ipcMain.handle('orders:list', (_, filters, pagination) => wrapHandler(() => orderService.listOrders(filters, pagination)));
  ipcMain.handle('orders:get', (_, id: number) => wrapHandler(() => orderService.getOrder(id)));
  ipcMain.handle('orders:create', (_, dto) => wrapHandler(() => orderService.createOrder(dto)));
  ipcMain.handle('orders:update', (_, id: number, data) => wrapHandler(() => orderService.updateOrder({ id, ...data })));
  ipcMain.handle('orders:delete', (_, id: number) => wrapHandler(() => orderService.deleteOrder(id)));
  ipcMain.handle('orders:changeStatus', (_, id: number, status) => wrapHandler(() => orderService.changeStatus(id, status)));
  ipcMain.handle('orders:paymentStatus', (_, id: number) => wrapHandler(() => orderService.getOrderPaymentStatus(id)));
  ipcMain.handle('orders:count', (_, filters) => wrapHandler(() => orderService.countOrders(filters)));

  // Payment handlers
  ipcMain.handle('payments:list', (_, filters) => wrapHandler(() => paymentService.listPayments(filters)));
  ipcMain.handle('payments:get', (_, id: number) => wrapHandler(() => paymentService.getPayment(id)));
  ipcMain.handle('payments:create', (_, dto) => wrapHandler(() => paymentService.createPayment(dto)));
  ipcMain.handle('payments:delete', (_, id: number) => wrapHandler(() => paymentService.deletePayment(id)));
  ipcMain.handle('payments:byOrder', (_, orderId: number) => wrapHandler(() => paymentService.getOrderPayments(orderId)));
  ipcMain.handle('payments:remaining', (_, orderId: number) => wrapHandler(() => paymentService.computeRemaining(orderId)));

  // Material handlers
  ipcMain.handle('materials:list', (_, page?: number, limit?: number) => wrapHandler(() => materialService.listMaterials(page, limit)));
  ipcMain.handle('materials:count', () => wrapHandler(() => materialService.countMaterials()));
  ipcMain.handle('materials:get', (_, id: number) => wrapHandler(() => materialService.getMaterial(id)));
  ipcMain.handle('materials:create', (_, dto) => wrapHandler(() => materialService.createMaterial(dto)));
  ipcMain.handle('materials:update', (_, dto) => wrapHandler(() => materialService.updateMaterial(dto)));
  ipcMain.handle('materials:delete', (_, id: number) => wrapHandler(() => materialService.deleteMaterial(id)));
  ipcMain.handle('materials:getLowStock', () => wrapHandler(() => materialService.checkLowStock()));
  ipcMain.handle('materials:lowStock', () => wrapHandler(() => materialService.checkLowStock()));
  ipcMain.handle('materials:updateQuantity', (_, id: number, quantity: number) => wrapHandler(() => materialService.updateQuantity(id, quantity)));

  // Expense handlers
  ipcMain.handle('expenses:list', (_, filters, page?: number, limit?: number) => wrapHandler(() => expenseService.listExpenses(filters, page, limit)));
  ipcMain.handle('expenses:count', (_, filters) => wrapHandler(() => expenseService.countExpenses(filters)));
  ipcMain.handle('expenses:get', (_, id: number) => wrapHandler(() => expenseService.getExpense(id)));
  ipcMain.handle('expenses:create', (_, dto) => wrapHandler(() => expenseService.createExpense(dto)));
  ipcMain.handle('expenses:delete', (_, id: number) => wrapHandler(() => expenseService.deleteExpense(id)));
  ipcMain.handle('expenses:getTotalByPeriod', (_, dateFrom: number, dateTo: number) => wrapHandler(() => expenseService.getTotalByPeriod(dateFrom, dateTo)));
  ipcMain.handle('expenses:totalByPeriod', (_, dateFrom: number, dateTo: number) => wrapHandler(() => expenseService.getTotalByPeriod(dateFrom, dateTo)));
  ipcMain.handle('expenses:totalByCategory', (_, category: string, dateFrom?: number, dateTo?: number) => wrapHandler(() => expenseService.getTotalByCategory(category, dateFrom, dateTo)));

  // Worker handlers
  ipcMain.handle('workers:list', (_, page?: number, limit?: number) => wrapHandler(() => workerService.listWorkers(page, limit)));
  ipcMain.handle('workers:count', () => wrapHandler(() => workerService.countWorkers()));
  ipcMain.handle('workers:listActive', () => wrapHandler(() => workerService.listActiveWorkers()));
  ipcMain.handle('workers:get', (_, id: number) => wrapHandler(() => workerService.getWorker(id)));
  ipcMain.handle('workers:create', (_, dto) => wrapHandler(() => workerService.createWorker(dto)));
  ipcMain.handle('workers:update', (_, dto) => wrapHandler(() => workerService.updateWorker(dto)));
  ipcMain.handle('workers:delete', (_, id: number) => wrapHandler(() => workerService.deleteWorker(id)));
  ipcMain.handle('workers:deactivate', (_, id: number) => wrapHandler(() => workerService.deactivateWorker(id)));
  ipcMain.handle('workers:activate', (_, id: number) => wrapHandler(() => workerService.activateWorker(id)));

  // Initialize services that need database
  const db = getDatabase();
  reportService = new ReportService(db);
  settingsService = new SettingsService();
  backupService = new BackupService();
  
  ipcMain.handle('reports:orders', (_, filters) => wrapHandler(() => reportService.generateOrdersReport(filters)));
  ipcMain.handle('reports:dentists', () => wrapHandler(() => reportService.generateDentistsReport()));
  ipcMain.handle('reports:materials', () => wrapHandler(() => reportService.generateMaterialsReport()));
  ipcMain.handle('reports:payments', (_, filters) => wrapHandler(() => reportService.generatePaymentsReport(filters)));
  ipcMain.handle('reports:expenses', (_, filters) => wrapHandler(() => reportService.generateExpensesReport(filters)));
  ipcMain.handle('reports:financial', (_, filters) => wrapHandler(() => reportService.generateFinancialSummary(filters)));
  ipcMain.handle('reports:dashboardStats', () => wrapHandler(() => reportService.getDashboardStats()));
  ipcMain.handle('reports:recentOrders', (_, limit) => wrapHandler(() => reportService.getRecentOrders(limit)));

  // Excel Export handlers
  const excelExportService = new ExcelExportService();
  const pdfPrintService = new PDFPrintService();
  
  ipcMain.handle('export:dentists', async () => {
    return wrapHandler(async () => {
      const dentists = await dentistService.listDentists();
      const filepath = await excelExportService.exportDentists(dentists);
      // Open file location
      shell.showItemInFolder(filepath);
      return filepath;
    });
  });

  ipcMain.handle('export:orders', async (_, filters) => {
    return wrapHandler(async () => {
      const result = await orderService.listOrders(filters);
      const filepath = await excelExportService.exportOrders(result.orders);
      shell.showItemInFolder(filepath);
      return filepath;
    });
  });

  ipcMain.handle('export:materials', async () => {
    return wrapHandler(async () => {
      const materials = await materialService.listMaterials();
      const filepath = await excelExportService.exportMaterials(materials);
      shell.showItemInFolder(filepath);
      return filepath;
    });
  });

  ipcMain.handle('export:expenses', async (_, filters) => {
    return wrapHandler(async () => {
      const expenses = await expenseService.listExpenses(filters);
      const filepath = await excelExportService.exportExpenses(expenses);
      shell.showItemInFolder(filepath);
      return filepath;
    });
  });

  ipcMain.handle('export:payments', async (_, filters) => {
    return wrapHandler(async () => {
      const payments = await paymentService.listPayments(filters);
      const filepath = await excelExportService.exportPayments(payments);
      shell.showItemInFolder(filepath);
      return filepath;
    });
  });

  ipcMain.handle('export:workers', async () => {
    return wrapHandler(async () => {
      const workers = await workerService.listWorkers();
      const filepath = await excelExportService.exportWorkers(workers);
      shell.showItemInFolder(filepath);
      return filepath;
    });
  });

  // PDF Print handlers
  ipcMain.handle('print:order', async (_, orderId: number) => {
    return wrapHandler(async () => {
      const order = await orderService.getOrder(orderId);
      const dentist = await dentistService.getDentist(order.dentist_id);
      const filepath = await pdfPrintService.printOrder(order, dentist);
      shell.showItemInFolder(filepath);
      return filepath;
    });
  });

  ipcMain.handle('print:invoice', async (_, orderId: number) => {
    return wrapHandler(async () => {
      const order = await orderService.getOrder(orderId);
      const dentist = await dentistService.getDentist(order.dentist_id);
      const payments = await paymentService.getOrderPayments(orderId);
      const filepath = await pdfPrintService.printInvoice(order, dentist, payments);
      shell.showItemInFolder(filepath);
      return filepath;
    });
  });

  ipcMain.handle('print:report', async (_, title: string, data: any[], columns: any[]) => {
    return wrapHandler(async () => {
      const filepath = await pdfPrintService.printReport(title, data, columns);
      shell.showItemInFolder(filepath);
      return filepath;
    });
  });

  // Settings handlers
  ipcMain.handle('settings:get', () => wrapHandler(() => Promise.resolve(settingsService.getSettings())));
  ipcMain.handle('settings:update', (_, dto) => wrapHandler(() => {
    settingsService.updateSettings(dto);
    return Promise.resolve();
  }));

  // Backup handlers
  ipcMain.handle('backup:create', () => wrapHandler(() => backupService.createBackup()));
  ipcMain.handle('backup:list', () => wrapHandler(() => Promise.resolve(backupService.listBackups())));
  ipcMain.handle('backup:restore', (_, backupId: number) => wrapHandler(() => backupService.restoreBackup(backupId)));
  ipcMain.handle('backup:delete', (_, backupId: number) => wrapHandler(() => backupService.deleteBackup(backupId)));
  ipcMain.handle('backup:clearData', () => wrapHandler(() => backupService.clearAllData()));
  ipcMain.handle('backup:getDirectory', () => wrapHandler(() => Promise.resolve(backupService.getBackupDirectory())));
  ipcMain.handle('backup:getStats', () => wrapHandler(() => Promise.resolve(backupService.getBackupStats())));
  ipcMain.handle('backup:setDirectory', async () => {
    return wrapHandler(async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { dialog } = require('electron');
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'اختر مجلد النسخ الاحتياطية',
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const newDir = result.filePaths[0];
        backupService.setBackupDirectory(newDir);
        return newDir;
      }
      
      return backupService.getBackupDirectory();
    });
  });
  ipcMain.handle('backup:checkAutoBackup', () => wrapHandler(() => backupService.checkAndRunAutoBackup()));

  // Utility handlers
  ipcMain.handle('util:openExternal', async (_, url: string) => {
    return wrapHandler(async () => {
      await shell.openExternal(url);
      return { success: true };
    });
  });

  log.info('IPC handlers registered successfully');
}
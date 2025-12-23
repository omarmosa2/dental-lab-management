"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
const electron_1 = require("electron");
const DentistService_1 = require("../core/services/DentistService");
const OrderService_1 = require("../core/services/OrderService");
const PaymentService_1 = require("../core/services/PaymentService");
const MaterialService_1 = require("../core/services/MaterialService");
const ExpenseService_1 = require("../core/services/ExpenseService");
const WorkerService_1 = require("../core/services/WorkerService");
const ReportService_1 = require("../core/services/ReportService");
const ExcelExportService_1 = require("../core/services/ExcelExportService");
const PDFPrintService_1 = require("../core/services/PDFPrintService");
const SettingsService_1 = require("../core/services/SettingsService");
const BackupService_1 = require("../core/services/BackupService");
const errors_1 = require("../core/utils/errors");
const whatsappHandlers_1 = require("./whatsappHandlers");
const licenseHandlers_1 = require("./licenseHandlers");
const electron_log_1 = __importDefault(require("electron-log"));
const connection_1 = require("../core/database/connection");
// Initialize services
const dentistService = new DentistService_1.DentistService();
const orderService = new OrderService_1.OrderService();
const paymentService = new PaymentService_1.PaymentService();
const materialService = new MaterialService_1.MaterialService();
const expenseService = new ExpenseService_1.ExpenseService();
const workerService = new WorkerService_1.WorkerService();
let settingsService;
let backupService;
let reportService;
/**
 * Wrap handler with error handling
 */
function wrapHandler(handler) {
    return handler()
        .then((data) => ({ ok: true, data }))
        .catch((error) => {
        electron_log_1.default.error('IPC Handler Error:', error);
        if (error instanceof errors_1.DomainError) {
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
function registerIpcHandlers() {
    electron_log_1.default.info('Registering IPC handlers...');
    // Register WhatsApp handlers
    (0, whatsappHandlers_1.registerWhatsAppHandlers)();
    // Register License handlers
    (0, licenseHandlers_1.registerLicenseHandlers)();
    // Dentist handlers
    electron_1.ipcMain.handle('dentists:list', (_, page, limit) => wrapHandler(() => dentistService.listDentists(page, limit)));
    electron_1.ipcMain.handle('dentists:count', () => wrapHandler(() => dentistService.countDentists()));
    electron_1.ipcMain.handle('dentists:get', (_, id) => wrapHandler(() => dentistService.getDentist(id)));
    electron_1.ipcMain.handle('dentists:create', (_, dto) => wrapHandler(() => dentistService.createDentist(dto)));
    electron_1.ipcMain.handle('dentists:update', (_, dto) => wrapHandler(() => dentistService.updateDentist(dto)));
    electron_1.ipcMain.handle('dentists:delete', (_, id) => wrapHandler(() => dentistService.deleteDentist(id)));
    electron_1.ipcMain.handle('dentists:search', (_, query) => wrapHandler(() => dentistService.searchDentists(query)));
    // Order handlers
    electron_1.ipcMain.handle('orders:list', (_, filters, pagination) => wrapHandler(() => orderService.listOrders(filters, pagination)));
    electron_1.ipcMain.handle('orders:get', (_, id) => wrapHandler(() => orderService.getOrder(id)));
    electron_1.ipcMain.handle('orders:create', (_, dto) => wrapHandler(() => orderService.createOrder(dto)));
    electron_1.ipcMain.handle('orders:update', (_, id, data) => wrapHandler(() => orderService.updateOrder({ id, ...data })));
    electron_1.ipcMain.handle('orders:delete', (_, id) => wrapHandler(() => orderService.deleteOrder(id)));
    electron_1.ipcMain.handle('orders:changeStatus', (_, id, status) => wrapHandler(() => orderService.changeStatus(id, status)));
    electron_1.ipcMain.handle('orders:paymentStatus', (_, id) => wrapHandler(() => orderService.getOrderPaymentStatus(id)));
    electron_1.ipcMain.handle('orders:count', (_, filters) => wrapHandler(() => orderService.countOrders(filters)));
    // Payment handlers
    electron_1.ipcMain.handle('payments:list', (_, filters) => wrapHandler(() => paymentService.listPayments(filters)));
    electron_1.ipcMain.handle('payments:get', (_, id) => wrapHandler(() => paymentService.getPayment(id)));
    electron_1.ipcMain.handle('payments:create', (_, dto) => wrapHandler(() => paymentService.createPayment(dto)));
    electron_1.ipcMain.handle('payments:delete', (_, id) => wrapHandler(() => paymentService.deletePayment(id)));
    electron_1.ipcMain.handle('payments:byOrder', (_, orderId) => wrapHandler(() => paymentService.getOrderPayments(orderId)));
    electron_1.ipcMain.handle('payments:remaining', (_, orderId) => wrapHandler(() => paymentService.computeRemaining(orderId)));
    // Material handlers
    electron_1.ipcMain.handle('materials:list', (_, page, limit) => wrapHandler(() => materialService.listMaterials(page, limit)));
    electron_1.ipcMain.handle('materials:count', () => wrapHandler(() => materialService.countMaterials()));
    electron_1.ipcMain.handle('materials:get', (_, id) => wrapHandler(() => materialService.getMaterial(id)));
    electron_1.ipcMain.handle('materials:create', (_, dto) => wrapHandler(() => materialService.createMaterial(dto)));
    electron_1.ipcMain.handle('materials:update', (_, dto) => wrapHandler(() => materialService.updateMaterial(dto)));
    electron_1.ipcMain.handle('materials:delete', (_, id) => wrapHandler(() => materialService.deleteMaterial(id)));
    electron_1.ipcMain.handle('materials:getLowStock', () => wrapHandler(() => materialService.checkLowStock()));
    electron_1.ipcMain.handle('materials:lowStock', () => wrapHandler(() => materialService.checkLowStock()));
    electron_1.ipcMain.handle('materials:updateQuantity', (_, id, quantity) => wrapHandler(() => materialService.updateQuantity(id, quantity)));
    // Expense handlers
    electron_1.ipcMain.handle('expenses:list', (_, filters, page, limit) => wrapHandler(() => expenseService.listExpenses(filters, page, limit)));
    electron_1.ipcMain.handle('expenses:count', (_, filters) => wrapHandler(() => expenseService.countExpenses(filters)));
    electron_1.ipcMain.handle('expenses:get', (_, id) => wrapHandler(() => expenseService.getExpense(id)));
    electron_1.ipcMain.handle('expenses:create', (_, dto) => wrapHandler(() => expenseService.createExpense(dto)));
    electron_1.ipcMain.handle('expenses:delete', (_, id) => wrapHandler(() => expenseService.deleteExpense(id)));
    electron_1.ipcMain.handle('expenses:getTotalByPeriod', (_, dateFrom, dateTo) => wrapHandler(() => expenseService.getTotalByPeriod(dateFrom, dateTo)));
    electron_1.ipcMain.handle('expenses:totalByPeriod', (_, dateFrom, dateTo) => wrapHandler(() => expenseService.getTotalByPeriod(dateFrom, dateTo)));
    electron_1.ipcMain.handle('expenses:totalByCategory', (_, category, dateFrom, dateTo) => wrapHandler(() => expenseService.getTotalByCategory(category, dateFrom, dateTo)));
    // Worker handlers
    electron_1.ipcMain.handle('workers:list', (_, page, limit) => wrapHandler(() => workerService.listWorkers(page, limit)));
    electron_1.ipcMain.handle('workers:count', () => wrapHandler(() => workerService.countWorkers()));
    electron_1.ipcMain.handle('workers:listActive', () => wrapHandler(() => workerService.listActiveWorkers()));
    electron_1.ipcMain.handle('workers:get', (_, id) => wrapHandler(() => workerService.getWorker(id)));
    electron_1.ipcMain.handle('workers:create', (_, dto) => wrapHandler(() => workerService.createWorker(dto)));
    electron_1.ipcMain.handle('workers:update', (_, dto) => wrapHandler(() => workerService.updateWorker(dto)));
    electron_1.ipcMain.handle('workers:delete', (_, id) => wrapHandler(() => workerService.deleteWorker(id)));
    electron_1.ipcMain.handle('workers:deactivate', (_, id) => wrapHandler(() => workerService.deactivateWorker(id)));
    electron_1.ipcMain.handle('workers:activate', (_, id) => wrapHandler(() => workerService.activateWorker(id)));
    // Initialize services that need database
    const db = (0, connection_1.getDatabase)();
    reportService = new ReportService_1.ReportService(db);
    settingsService = new SettingsService_1.SettingsService();
    backupService = new BackupService_1.BackupService();
    electron_1.ipcMain.handle('reports:orders', (_, filters) => wrapHandler(() => reportService.generateOrdersReport(filters)));
    electron_1.ipcMain.handle('reports:dentists', () => wrapHandler(() => reportService.generateDentistsReport()));
    electron_1.ipcMain.handle('reports:materials', () => wrapHandler(() => reportService.generateMaterialsReport()));
    electron_1.ipcMain.handle('reports:payments', (_, filters) => wrapHandler(() => reportService.generatePaymentsReport(filters)));
    electron_1.ipcMain.handle('reports:expenses', (_, filters) => wrapHandler(() => reportService.generateExpensesReport(filters)));
    electron_1.ipcMain.handle('reports:financial', (_, filters) => wrapHandler(() => reportService.generateFinancialSummary(filters)));
    electron_1.ipcMain.handle('reports:dashboardStats', () => wrapHandler(() => reportService.getDashboardStats()));
    electron_1.ipcMain.handle('reports:recentOrders', (_, limit) => wrapHandler(() => reportService.getRecentOrders(limit)));
    // Excel Export handlers
    const excelExportService = new ExcelExportService_1.ExcelExportService();
    const pdfPrintService = new PDFPrintService_1.PDFPrintService();
    electron_1.ipcMain.handle('export:dentists', async () => {
        return wrapHandler(async () => {
            const dentists = await dentistService.listDentists();
            const filepath = await excelExportService.exportDentists(dentists);
            // Open file location
            electron_1.shell.showItemInFolder(filepath);
            return filepath;
        });
    });
    electron_1.ipcMain.handle('export:orders', async (_, filters) => {
        return wrapHandler(async () => {
            const result = await orderService.listOrders(filters);
            const filepath = await excelExportService.exportOrders(result.orders);
            electron_1.shell.showItemInFolder(filepath);
            return filepath;
        });
    });
    electron_1.ipcMain.handle('export:materials', async () => {
        return wrapHandler(async () => {
            const materials = await materialService.listMaterials();
            const filepath = await excelExportService.exportMaterials(materials);
            electron_1.shell.showItemInFolder(filepath);
            return filepath;
        });
    });
    electron_1.ipcMain.handle('export:expenses', async (_, filters) => {
        return wrapHandler(async () => {
            const expenses = await expenseService.listExpenses(filters);
            const filepath = await excelExportService.exportExpenses(expenses);
            electron_1.shell.showItemInFolder(filepath);
            return filepath;
        });
    });
    electron_1.ipcMain.handle('export:payments', async (_, filters) => {
        return wrapHandler(async () => {
            const payments = await paymentService.listPayments(filters);
            const filepath = await excelExportService.exportPayments(payments);
            electron_1.shell.showItemInFolder(filepath);
            return filepath;
        });
    });
    electron_1.ipcMain.handle('export:workers', async () => {
        return wrapHandler(async () => {
            const workers = await workerService.listWorkers();
            const filepath = await excelExportService.exportWorkers(workers);
            electron_1.shell.showItemInFolder(filepath);
            return filepath;
        });
    });
    // PDF Print handlers
    electron_1.ipcMain.handle('print:order', async (_, orderId) => {
        return wrapHandler(async () => {
            const order = await orderService.getOrder(orderId);
            const dentist = await dentistService.getDentist(order.dentist_id);
            const filepath = await pdfPrintService.printOrder(order, dentist);
            electron_1.shell.showItemInFolder(filepath);
            return filepath;
        });
    });
    electron_1.ipcMain.handle('print:invoice', async (_, orderId) => {
        return wrapHandler(async () => {
            const order = await orderService.getOrder(orderId);
            const dentist = await dentistService.getDentist(order.dentist_id);
            const payments = await paymentService.getOrderPayments(orderId);
            const filepath = await pdfPrintService.printInvoice(order, dentist, payments);
            electron_1.shell.showItemInFolder(filepath);
            return filepath;
        });
    });
    electron_1.ipcMain.handle('print:report', async (_, title, data, columns) => {
        return wrapHandler(async () => {
            const filepath = await pdfPrintService.printReport(title, data, columns);
            electron_1.shell.showItemInFolder(filepath);
            return filepath;
        });
    });
    // Settings handlers
    electron_1.ipcMain.handle('settings:get', () => wrapHandler(() => Promise.resolve(settingsService.getSettings())));
    electron_1.ipcMain.handle('settings:update', (_, dto) => wrapHandler(() => {
        settingsService.updateSettings(dto);
        return Promise.resolve();
    }));
    // Backup handlers
    electron_1.ipcMain.handle('backup:create', () => wrapHandler(() => backupService.createBackup()));
    electron_1.ipcMain.handle('backup:list', () => wrapHandler(() => Promise.resolve(backupService.listBackups())));
    electron_1.ipcMain.handle('backup:restore', (_, backupId) => wrapHandler(() => backupService.restoreBackup(backupId)));
    electron_1.ipcMain.handle('backup:delete', (_, backupId) => wrapHandler(() => backupService.deleteBackup(backupId)));
    electron_1.ipcMain.handle('backup:clearData', () => wrapHandler(() => backupService.clearAllData()));
    electron_1.ipcMain.handle('backup:getDirectory', () => wrapHandler(() => Promise.resolve(backupService.getBackupDirectory())));
    electron_1.ipcMain.handle('backup:getStats', () => wrapHandler(() => Promise.resolve(backupService.getBackupStats())));
    electron_1.ipcMain.handle('backup:setDirectory', async () => {
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
    electron_1.ipcMain.handle('backup:checkAutoBackup', () => wrapHandler(() => backupService.checkAndRunAutoBackup()));
    // Utility handlers
    electron_1.ipcMain.handle('util:openExternal', async (_, url) => {
        return wrapHandler(async () => {
            await electron_1.shell.openExternal(url);
            return { success: true };
        });
    });
    electron_log_1.default.info('IPC handlers registered successfully');
}

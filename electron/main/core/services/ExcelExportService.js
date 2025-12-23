"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelExportService = exports.ExportValidationError = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const electron_log_1 = __importDefault(require("electron-log"));
const enums_1 = require("../../../shared/constants/enums");
/**
 * Export validation error
 */
class ExportValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ExportValidationError';
    }
}
exports.ExportValidationError = ExportValidationError;
class ExcelExportService {
    /**
     * Validate export data
     */
    validateExportData(data, entityName) {
        if (!Array.isArray(data)) {
            throw new ExportValidationError(`البيانات المراد تصديرها يجب أن تكون مصفوفة`);
        }
        if (data.length === 0) {
            throw new ExportValidationError(`لا توجد بيانات ${entityName} للتصدير`);
        }
        if (data.length > 50000) {
            throw new ExportValidationError(`عدد السجلات كبير جداً (${data.length}). الحد الأقصى 50,000 سجل`);
        }
        electron_log_1.default.info(`ExcelExportService: Validation passed for ${entityName}`, { count: data.length });
    }
    /**
     * Send progress update to renderer
     */
    sendProgress(progress, message) {
        const windows = electron_1.BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            windows[0].webContents.send('export:progress', { progress, message });
        }
    }
    /**
     * Validate file write permissions
     */
    validateExportDirectory(dirPath) {
        try {
            // Check if directory exists, create if not
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            // Test write permissions
            const testFile = path.join(dirPath, '.write-test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            electron_log_1.default.info('ExcelExportService: Export directory validated', { dirPath });
        }
        catch (error) {
            electron_log_1.default.error('ExcelExportService: Export directory validation failed', error);
            throw new ExportValidationError('لا يمكن الكتابة في مجلد التصدير. تحقق من الصلاحيات');
        }
    }
    /**
     * Get export directory path
     */
    getExportPath(filename) {
        const documentsPath = electron_1.app.getPath('documents');
        const exportDir = path.join(documentsPath, 'Dental Lab Exports');
        // Validate directory
        this.validateExportDirectory(exportDir);
        return path.join(exportDir, filename);
    }
    /**
     * Create workbook with RTL support
     */
    createWorkbook() {
        const workbook = new exceljs_1.default.Workbook();
        workbook.creator = 'Dental Lab Management System';
        workbook.created = new Date();
        return workbook;
    }
    /**
     * Style header row
     */
    styleHeaderRow(row) {
        row.font = { bold: true, size: 12, name: 'Arial' };
        row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' },
        };
        row.alignment = { horizontal: 'center', vertical: 'middle' };
        row.height = 25;
    }
    /**
     * Export dentists to Excel
     */
    async exportDentists(dentists) {
        try {
            electron_log_1.default.info('ExcelExportService: Exporting dentists', { count: dentists.length });
            // Validate data
            this.validateExportData(dentists, 'الأطباء');
            this.sendProgress(10, 'جاري التحقق من البيانات...');
            const workbook = this.createWorkbook();
            this.sendProgress(20, 'جاري إنشاء ملف Excel...');
            const worksheet = workbook.addWorksheet('الأطباء', {
                views: [{ rightToLeft: true }],
            });
            // Define columns
            worksheet.columns = [
                { header: 'الرقم', key: 'id', width: 10 },
                { header: 'الاسم', key: 'name', width: 25 },
                { header: 'الجنس', key: 'gender', width: 12 },
                { header: 'مكان الإقامة', key: 'residence', width: 20 },
                { header: 'رقم الهاتف', key: 'phone', width: 15 },
                { header: 'أنواع الحالات', key: 'case_types', width: 30 },
                { header: 'التكلفة', key: 'cost', width: 12 },
                { header: 'ملاحظات', key: 'notes', width: 40 },
            ];
            // Style header
            this.styleHeaderRow(worksheet.getRow(1));
            // Add data with progress updates
            this.sendProgress(40, 'جاري إضافة البيانات...');
            dentists.forEach((dentist, index) => {
                worksheet.addRow({
                    id: dentist.id,
                    name: dentist.name,
                    gender: dentist.gender === 'male' ? 'ذكر' : 'أنثى',
                    residence: dentist.residence,
                    phone: dentist.phone,
                    case_types: Array.isArray(dentist.case_types)
                        ? dentist.case_types.join(', ')
                        : dentist.case_types,
                    cost: dentist.cost,
                    notes: dentist.notes || '',
                });
                // Update progress every 100 rows
                if (index % 100 === 0) {
                    const progress = 40 + Math.floor((index / dentists.length) * 40);
                    this.sendProgress(progress, `جاري إضافة البيانات... (${index + 1}/${dentists.length})`);
                }
            });
            this.sendProgress(85, 'جاري تنسيق الملف...');
            // Auto-fit columns
            worksheet.columns.forEach((column) => {
                if (column.width && column.width < 10) {
                    column.width = 10;
                }
            });
            // Save file
            this.sendProgress(90, 'جاري حفظ الملف...');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `تقرير_الأطباء_${timestamp}.xlsx`;
            const filepath = this.getExportPath(filename);
            await workbook.xlsx.writeFile(filepath);
            // Verify file was created
            if (!fs.existsSync(filepath)) {
                throw new ExportValidationError('فشل في إنشاء الملف');
            }
            const stats = fs.statSync(filepath);
            if (stats.size === 0) {
                throw new ExportValidationError('الملف المُنشأ فارغ');
            }
            this.sendProgress(100, 'تم التصدير بنجاح');
            electron_log_1.default.info(`ExcelExportService: Dentists exported successfully`, {
                filepath,
                count: dentists.length,
                size: stats.size
            });
            return filepath;
        }
        catch (error) {
            this.sendProgress(0, 'فشل التصدير');
            electron_log_1.default.error('ExcelExportService: Failed to export dentists', error);
            if (error instanceof ExportValidationError) {
                throw error;
            }
            throw new Error(`فشل تصدير الأطباء: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }
    /**
     * Export orders to Excel
     */
    async exportOrders(orders) {
        try {
            electron_log_1.default.info('ExcelExportService: Exporting orders', { count: orders.length });
            // Validate data
            this.validateExportData(orders, 'الطلبات');
            this.sendProgress(10, 'جاري التحقق من البيانات...');
            const workbook = this.createWorkbook();
            this.sendProgress(20, 'جاري إنشاء ملف Excel...');
            const worksheet = workbook.addWorksheet('الطلبات', {
                views: [{ rightToLeft: true }],
            });
            // Define columns
            worksheet.columns = [
                { header: 'رقم الطلب', key: 'order_number', width: 20 },
                { header: 'رقم الطبيب', key: 'dentist_id', width: 12 },
                { header: 'نوع الحالة', key: 'case_type', width: 20 },
                { header: 'أرقام الأسنان', key: 'tooth_numbers', width: 25 },
                { header: 'اللون', key: 'shade', width: 15 },
                { header: 'المادة الرئيسية', key: 'main_material', width: 20 },
                { header: 'نوع التشطيب', key: 'finish_type', width: 15 },
                { header: 'الكمية', key: 'quantity', width: 10 },
                { header: 'السعر', key: 'price', width: 12 },
                { header: 'الحالة', key: 'status', width: 15 },
                { header: 'تاريخ الاستلام', key: 'date_received', width: 15 },
                { header: 'تاريخ التسليم', key: 'date_due', width: 15 },
                { header: 'ملاحظات', key: 'notes', width: 40 },
            ];
            // Style header
            this.styleHeaderRow(worksheet.getRow(1));
            // Add data with progress updates
            this.sendProgress(40, 'جاري إضافة البيانات...');
            orders.forEach((order, index) => {
                const toothNumbers = typeof order.tooth_numbers === 'string'
                    ? order.tooth_numbers
                    : JSON.parse(order.tooth_numbers).join(', ');
                worksheet.addRow({
                    order_number: order.order_number,
                    dentist_id: order.dentist_id,
                    case_type: order.case_type,
                    tooth_numbers: toothNumbers,
                    shade: order.shade,
                    main_material: order.main_material,
                    finish_type: order.finish_type,
                    quantity: order.quantity,
                    price: order.price,
                    status: enums_1.OrderStatusLabels[order.status] || order.status,
                    date_received: new Date(order.date_received * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }),
                    date_due: new Date(order.date_due * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }),
                    notes: order.notes || '',
                });
                // Update progress every 100 rows
                if (index % 100 === 0) {
                    const progress = 40 + Math.floor((index / orders.length) * 40);
                    this.sendProgress(progress, `جاري إضافة البيانات... (${index + 1}/${orders.length})`);
                }
            });
            this.sendProgress(85, 'جاري تنسيق الملف...');
            // Save file
            this.sendProgress(90, 'جاري حفظ الملف...');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `تقرير_الطلبات_${timestamp}.xlsx`;
            const filepath = this.getExportPath(filename);
            await workbook.xlsx.writeFile(filepath);
            // Verify file
            if (!fs.existsSync(filepath)) {
                throw new ExportValidationError('فشل في إنشاء الملف');
            }
            const stats = fs.statSync(filepath);
            if (stats.size === 0) {
                throw new ExportValidationError('الملف المُنشأ فارغ');
            }
            this.sendProgress(100, 'تم التصدير بنجاح');
            electron_log_1.default.info(`ExcelExportService: Orders exported successfully`, {
                filepath,
                count: orders.length,
                size: stats.size
            });
            return filepath;
        }
        catch (error) {
            this.sendProgress(0, 'فشل التصدير');
            electron_log_1.default.error('ExcelExportService: Failed to export orders', error);
            if (error instanceof ExportValidationError) {
                throw error;
            }
            throw new Error(`فشل تصدير الطلبات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }
    /**
     * Export materials to Excel
     */
    async exportMaterials(materials) {
        try {
            electron_log_1.default.info('ExcelExportService: Exporting materials', { count: materials.length });
            // Validate data
            this.validateExportData(materials, 'المواد');
            this.sendProgress(10, 'جاري التحقق من البيانات...');
            const workbook = this.createWorkbook();
            this.sendProgress(20, 'جاري إنشاء ملف Excel...');
            const worksheet = workbook.addWorksheet('المواد', {
                views: [{ rightToLeft: true }],
            });
            // Define columns
            worksheet.columns = [
                { header: 'الرقم', key: 'id', width: 10 },
                { header: 'الكود', key: 'code', width: 15 },
                { header: 'الاسم', key: 'name', width: 25 },
                { header: 'الكمية', key: 'quantity', width: 12 },
                { header: 'الوحدة', key: 'unit', width: 12 },
                { header: 'الحد الأدنى', key: 'min_quantity', width: 12 },
                { header: 'التكلفة للوحدة', key: 'cost_per_unit', width: 15 },
                { header: 'ملاحظات', key: 'notes', width: 40 },
            ];
            // Style header
            this.styleHeaderRow(worksheet.getRow(1));
            // Add data with progress updates
            this.sendProgress(40, 'جاري إضافة البيانات...');
            materials.forEach((material, index) => {
                const row = worksheet.addRow({
                    id: material.id,
                    code: material.code,
                    name: material.name,
                    quantity: material.quantity,
                    unit: material.unit,
                    min_quantity: material.min_quantity,
                    cost_per_unit: material.cost_per_unit,
                    notes: material.notes || '',
                });
                // Highlight low stock items
                if (material.quantity <= material.min_quantity) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFEF3C7' },
                    };
                }
                // Update progress every 100 rows
                if (index % 100 === 0) {
                    const progress = 40 + Math.floor((index / materials.length) * 40);
                    this.sendProgress(progress, `جاري إضافة البيانات... (${index + 1}/${materials.length})`);
                }
            });
            this.sendProgress(85, 'جاري تنسيق الملف...');
            // Save file
            this.sendProgress(90, 'جاري حفظ الملف...');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `تقرير_المواد_${timestamp}.xlsx`;
            const filepath = this.getExportPath(filename);
            await workbook.xlsx.writeFile(filepath);
            // Verify file
            if (!fs.existsSync(filepath)) {
                throw new ExportValidationError('فشل في إنشاء الملف');
            }
            const stats = fs.statSync(filepath);
            if (stats.size === 0) {
                throw new ExportValidationError('الملف المُنشأ فارغ');
            }
            this.sendProgress(100, 'تم التصدير بنجاح');
            electron_log_1.default.info(`ExcelExportService: Materials exported successfully`, {
                filepath,
                count: materials.length,
                size: stats.size
            });
            return filepath;
        }
        catch (error) {
            this.sendProgress(0, 'فشل التصدير');
            electron_log_1.default.error('ExcelExportService: Failed to export materials', error);
            if (error instanceof ExportValidationError) {
                throw error;
            }
            throw new Error(`فشل تصدير المواد: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }
    /**
     * Export expenses to Excel
     */
    async exportExpenses(expenses) {
        try {
            electron_log_1.default.info('ExcelExportService: Exporting expenses', { count: expenses.length });
            // Validate data
            this.validateExportData(expenses, 'المصروفات');
            this.sendProgress(10, 'جاري التحقق من البيانات...');
            const workbook = this.createWorkbook();
            this.sendProgress(20, 'جاري إنشاء ملف Excel...');
            const worksheet = workbook.addWorksheet('المصروفات', {
                views: [{ rightToLeft: true }],
            });
            // Define columns
            worksheet.columns = [
                { header: 'الرقم', key: 'id', width: 10 },
                { header: 'الفئة', key: 'category', width: 20 },
                { header: 'الوصف', key: 'description', width: 40 },
                { header: 'المبلغ', key: 'amount', width: 15 },
                { header: 'التاريخ', key: 'date', width: 15 },
                { header: 'ملاحظات', key: 'notes', width: 40 },
            ];
            // Style header
            this.styleHeaderRow(worksheet.getRow(1));
            // Add data with progress updates
            this.sendProgress(40, 'جاري إضافة البيانات...');
            let total = 0;
            expenses.forEach((expense, index) => {
                worksheet.addRow({
                    id: expense.id,
                    category: expense.category,
                    description: expense.description,
                    amount: expense.amount,
                    date: new Date(expense.date * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }),
                    notes: expense.notes || '',
                });
                total += expense.amount;
                // Update progress every 100 rows
                if (index % 100 === 0) {
                    const progress = 40 + Math.floor((index / expenses.length) * 35);
                    this.sendProgress(progress, `جاري إضافة البيانات... (${index + 1}/${expenses.length})`);
                }
            });
            this.sendProgress(80, 'جاري إضافة الإجمالي...');
            // Add total row
            const totalRow = worksheet.addRow({
                id: '',
                category: '',
                description: 'الإجمالي',
                amount: total,
                date: '',
                notes: '',
            });
            totalRow.font = { bold: true };
            totalRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE5E7EB' },
            };
            // Save file
            this.sendProgress(90, 'جاري حفظ الملف...');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `تقرير_المصروفات_${timestamp}.xlsx`;
            const filepath = this.getExportPath(filename);
            await workbook.xlsx.writeFile(filepath);
            // Verify file
            if (!fs.existsSync(filepath)) {
                throw new ExportValidationError('فشل في إنشاء الملف');
            }
            const stats = fs.statSync(filepath);
            if (stats.size === 0) {
                throw new ExportValidationError('الملف المُنشأ فارغ');
            }
            this.sendProgress(100, 'تم التصدير بنجاح');
            electron_log_1.default.info(`ExcelExportService: Expenses exported successfully`, {
                filepath,
                count: expenses.length,
                size: stats.size,
                total
            });
            return filepath;
        }
        catch (error) {
            this.sendProgress(0, 'فشل التصدير');
            electron_log_1.default.error('ExcelExportService: Failed to export expenses', error);
            if (error instanceof ExportValidationError) {
                throw error;
            }
            throw new Error(`فشل تصدير المصروفات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }
    /**
     * Export payments to Excel
     */
    async exportPayments(payments) {
        try {
            electron_log_1.default.info('ExcelExportService: Exporting payments', { count: payments.length });
            // Validate data
            this.validateExportData(payments, 'الدفعات');
            this.sendProgress(10, 'جاري التحقق من البيانات...');
            const workbook = this.createWorkbook();
            this.sendProgress(20, 'جاري إنشاء ملف Excel...');
            const worksheet = workbook.addWorksheet('الدفعات', {
                views: [{ rightToLeft: true }],
            });
            // Define columns
            worksheet.columns = [
                { header: 'الرقم', key: 'id', width: 10 },
                { header: 'رقم الطلب', key: 'order_id', width: 15 },
                { header: 'المبلغ', key: 'amount', width: 15 },
                { header: 'الخصم', key: 'discount', width: 12 },
                { header: 'التاريخ', key: 'date', width: 15 },
                { header: 'ملاحظات', key: 'note', width: 40 },
            ];
            // Style header
            this.styleHeaderRow(worksheet.getRow(1));
            // Add data with progress updates
            this.sendProgress(40, 'جاري إضافة البيانات...');
            let totalPaid = 0;
            let totalDiscount = 0;
            payments.forEach((payment, index) => {
                worksheet.addRow({
                    id: payment.id,
                    order_id: payment.order_id,
                    amount: payment.amount,
                    discount: payment.discount || 0,
                    date: new Date(payment.date * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }),
                    note: payment.note || '',
                });
                totalPaid += payment.amount;
                totalDiscount += payment.discount || 0;
                // Update progress every 100 rows
                if (index % 100 === 0) {
                    const progress = 40 + Math.floor((index / payments.length) * 35);
                    this.sendProgress(progress, `جاري إضافة البيانات... (${index + 1}/${payments.length})`);
                }
            });
            this.sendProgress(80, 'جاري إضافة الإجمالي...');
            // Add total row
            const totalRow = worksheet.addRow({
                id: '',
                order_id: 'الإجمالي',
                amount: totalPaid,
                discount: totalDiscount,
                date: '',
                note: '',
            });
            totalRow.font = { bold: true };
            totalRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE5E7EB' },
            };
            // Save file
            this.sendProgress(90, 'جاري حفظ الملف...');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `تقرير_الدفعات_${timestamp}.xlsx`;
            const filepath = this.getExportPath(filename);
            await workbook.xlsx.writeFile(filepath);
            // Verify file
            if (!fs.existsSync(filepath)) {
                throw new ExportValidationError('فشل في إنشاء الملف');
            }
            const stats = fs.statSync(filepath);
            if (stats.size === 0) {
                throw new ExportValidationError('الملف المُنشأ فارغ');
            }
            this.sendProgress(100, 'تم التصدير بنجاح');
            electron_log_1.default.info(`ExcelExportService: Payments exported successfully`, {
                filepath,
                count: payments.length,
                size: stats.size,
                totalPaid,
                totalDiscount
            });
            return filepath;
        }
        catch (error) {
            this.sendProgress(0, 'فشل التصدير');
            electron_log_1.default.error('ExcelExportService: Failed to export payments', error);
            if (error instanceof ExportValidationError) {
                throw error;
            }
            throw new Error(`فشل تصدير الدفعات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }
    /**
     * Export workers to Excel
     */
    async exportWorkers(workers) {
        try {
            electron_log_1.default.info('ExcelExportService: Exporting workers', { count: workers.length });
            // Validate data
            this.validateExportData(workers, 'العمال');
            this.sendProgress(10, 'جاري التحقق من البيانات...');
            const workbook = this.createWorkbook();
            this.sendProgress(20, 'جاري إنشاء ملف Excel...');
            const worksheet = workbook.addWorksheet('العمال', {
                views: [{ rightToLeft: true }],
            });
            // Define columns
            worksheet.columns = [
                { header: 'الرقم', key: 'id', width: 10 },
                { header: 'الاسم', key: 'name', width: 25 },
                { header: 'رقم الهاتف', key: 'phone', width: 15 },
                { header: 'الراتب', key: 'salary', width: 12 },
                { header: 'تاريخ التوظيف', key: 'hire_date', width: 15 },
                { header: 'الحالة', key: 'status', width: 12 },
                { header: 'ملاحظات', key: 'notes', width: 40 },
            ];
            // Style header
            this.styleHeaderRow(worksheet.getRow(1));
            // Add data with progress updates
            this.sendProgress(40, 'جاري إضافة البيانات...');
            workers.forEach((worker, index) => {
                worksheet.addRow({
                    id: worker.id,
                    name: worker.name,
                    phone: worker.phone || '',
                    salary: worker.salary || 0,
                    hire_date: new Date(worker.hire_date * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }),
                    status: worker.status === 'active' ? 'نشط' : 'غير نشط',
                    notes: worker.notes || '',
                });
                // Update progress every 100 rows
                if (index % 100 === 0) {
                    const progress = 40 + Math.floor((index / workers.length) * 40);
                    this.sendProgress(progress, `جاري إضافة البيانات... (${index + 1}/${workers.length})`);
                }
            });
            this.sendProgress(85, 'جاري تنسيق الملف...');
            // Save file
            this.sendProgress(90, 'جاري حفظ الملف...');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `تقرير_العمال_${timestamp}.xlsx`;
            const filepath = this.getExportPath(filename);
            await workbook.xlsx.writeFile(filepath);
            // Verify file
            if (!fs.existsSync(filepath)) {
                throw new ExportValidationError('فشل في إنشاء الملف');
            }
            const stats = fs.statSync(filepath);
            if (stats.size === 0) {
                throw new ExportValidationError('الملف المُنشأ فارغ');
            }
            this.sendProgress(100, 'تم التصدير بنجاح');
            electron_log_1.default.info(`ExcelExportService: Workers exported successfully`, {
                filepath,
                count: workers.length,
                size: stats.size
            });
            return filepath;
        }
        catch (error) {
            this.sendProgress(0, 'فشل التصدير');
            electron_log_1.default.error('ExcelExportService: Failed to export workers', error);
            if (error instanceof ExportValidationError) {
                throw error;
            }
            throw new Error(`فشل تصدير العمال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }
}
exports.ExcelExportService = ExcelExportService;

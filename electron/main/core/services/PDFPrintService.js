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
exports.PDFPrintService = exports.PDFValidationError = void 0;
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore - no type definitions available
const pdfkit_1 = __importDefault(require("pdfkit"));
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const electron_log_1 = __importDefault(require("electron-log"));
// @ts-ignore - no type definitions available
const arabic_reshaper_1 = __importDefault(require("arabic-reshaper"));
// @ts-ignore - no type definitions available
const bidi_js_1 = __importDefault(require("bidi-js"));
const enums_1 = require("../../../shared/constants/enums");
const currency_1 = __importDefault(require("../../../utils/currency"));
/**
 * PDF validation error
 */
class PDFValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PDFValidationError';
    }
}
exports.PDFValidationError = PDFValidationError;
class PDFPrintService {
    constructor() {
        // Path to Cairo font (you'll need to add this font to resources)
        this.fontPath = path.join(electron_1.app.getAppPath(), 'resources', 'fonts', 'Cairo-Regular.ttf');
    }
    /**
     * Send progress update to renderer
     */
    sendProgress(progress, message) {
        const windows = electron_1.BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            windows[0].webContents.send('pdf:progress', { progress, message });
        }
    }
    /**
     * Validate export directory
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
            electron_log_1.default.info('PDFPrintService: Export directory validated', { dirPath });
        }
        catch (error) {
            electron_log_1.default.error('PDFPrintService: Export directory validation failed', error);
            throw new PDFValidationError('لا يمكن الكتابة في مجلد التصدير. تحقق من الصلاحيات');
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
     * Prepare Arabic text for PDF rendering
     */
    prepareArabic(text) {
        if (!text)
            return '';
        try {
            const reshaped = (0, arabic_reshaper_1.default)(text);
            return (0, bidi_js_1.default)(reshaped);
        }
        catch (error) {
            electron_log_1.default.error('PDFPrintService: Error preparing Arabic text', error);
            return text;
        }
    }
    /**
     * Format date for display
     */
    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
    /**
     * Format currency
     */
    formatCurrency(amount) {
        return (0, currency_1.default)(amount);
    }
    /**
     * Create PDF document with Arabic support
     */
    createDocument() {
        const doc = new pdfkit_1.default({
            size: 'A4',
            margin: 50,
            bufferPages: true,
        });
        // Register Arabic font if available
        if (fs.existsSync(this.fontPath)) {
            doc.registerFont('Cairo', this.fontPath);
            doc.font('Cairo');
        }
        else {
            electron_log_1.default.warn('PDFPrintService: Arabic font not found, using default font');
        }
        return doc;
    }
    /**
     * Validate PDF data
     */
    validatePDFData(data, entityName) {
        if (!data) {
            throw new PDFValidationError(`لا توجد بيانات ${entityName} للطباعة`);
        }
        electron_log_1.default.info(`PDFPrintService: Validation passed for ${entityName}`);
    }
    /**
     * Verify PDF file was created successfully
     */
    verifyPDFFile(filepath) {
        if (!fs.existsSync(filepath)) {
            throw new PDFValidationError('فشل في إنشاء ملف PDF');
        }
        const stats = fs.statSync(filepath);
        if (stats.size === 0) {
            throw new PDFValidationError('ملف PDF المُنشأ فارغ');
        }
        // Basic PDF validation - check for PDF header
        const buffer = fs.readFileSync(filepath);
        const header = buffer.toString('utf8', 0, 5);
        if (!header.startsWith('%PDF')) {
            throw new PDFValidationError('الملف المُنشأ ليس ملف PDF صالح');
        }
        electron_log_1.default.info('PDFPrintService: PDF file verified', { filepath, size: stats.size });
    }
    /**
     * Add header to PDF
     */
    addHeader(doc, title) {
        doc.fontSize(20)
            .text(this.prepareArabic(title), { align: 'center' })
            .moveDown();
        doc.fontSize(10)
            .text(this.prepareArabic(`التاريخ: ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })}`), { align: 'right' })
            .moveDown();
        // Add line
        doc.moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke()
            .moveDown();
    }
    /**
     * Add footer to PDF
     */
    addFooter(doc) {
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
                .text(this.prepareArabic(`صفحة ${i + 1} من ${pageCount}`), 50, doc.page.height - 50, { align: 'center' });
        }
    }
    /**
     * Print order details
     */
    async printOrder(order, dentist) {
        try {
            electron_log_1.default.info('PDFPrintService: Printing order', { orderId: order.id });
            // Validate data
            this.validatePDFData(order, 'الطلب');
            this.sendProgress(10, 'جاري التحقق من البيانات...');
            this.sendProgress(20, 'جاري إنشاء ملف PDF...');
            const filename = `طلب_${order.order_number}_${Date.now()}.pdf`;
            const filepath = this.getExportPath(filename);
            const doc = this.createDocument();
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            this.sendProgress(40, 'جاري إضافة البيانات...');
            // Header
            this.addHeader(doc, `تفاصيل الطلب - ${order.order_number}`);
            // Order details
            doc.fontSize(12).text(this.prepareArabic('معلومات الطلب:'), { underline: true }).moveDown(0.5);
            const orderDetails = [
                `رقم الطلب: ${order.order_number}`,
                `نوع الحالة: ${order.case_type}`,
                `أرقام الأسنان: ${JSON.parse(order.tooth_numbers).join(', ')}`,
                `اللون: ${order.shade}`,
                `المادة الأساسية: ${order.main_material}`,
                `نوع التشطيب: ${order.finish_type}`,
                `الكمية: ${order.quantity}`,
                `السعر: ${this.formatCurrency(order.price)}`,
                `الحالة: ${enums_1.OrderStatusLabels[order.status] || order.status}`,
                `تاريخ الاستلام: ${this.formatDate(order.date_received)}`,
                `تاريخ التسليم المتوقع: ${this.formatDate(order.date_due)}`,
            ];
            if (order.date_delivered) {
                orderDetails.push(`تاريخ التسليم الفعلي: ${this.formatDate(order.date_delivered)}`);
            }
            if (order.notes) {
                orderDetails.push(`ملاحظات: ${order.notes}`);
            }
            orderDetails.forEach(detail => {
                doc.fontSize(10).text(this.prepareArabic(detail), { align: 'right' });
            });
            doc.moveDown();
            // Dentist details if provided
            if (dentist) {
                doc.fontSize(12).text(this.prepareArabic('معلومات الطبيب:'), { underline: true }).moveDown(0.5);
                const dentistDetails = [
                    `الاسم: ${dentist.name}`,
                    `الهاتف: ${dentist.phone}`,
                    `العنوان: ${dentist.residence}`,
                ];
                dentistDetails.forEach(detail => {
                    doc.fontSize(10).text(this.prepareArabic(detail), { align: 'right' });
                });
            }
            this.sendProgress(80, 'جاري إضافة التذييل...');
            // Footer
            this.addFooter(doc);
            doc.end();
            this.sendProgress(90, 'جاري حفظ الملف...');
            await new Promise((resolve, reject) => {
                stream.on('finish', () => resolve());
                stream.on('error', reject);
            });
            // Verify PDF file
            this.verifyPDFFile(filepath);
            this.sendProgress(100, 'تم الطباعة بنجاح');
            electron_log_1.default.info('PDFPrintService: Order printed successfully', { filepath });
            return filepath;
        }
        catch (error) {
            this.sendProgress(0, 'فشلت الطباعة');
            electron_log_1.default.error('PDFPrintService: Error printing order', error);
            if (error instanceof PDFValidationError) {
                throw error;
            }
            throw new Error(`فشل طباعة الطلب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }
    /**
     * Print invoice
     */
    async printInvoice(order, dentist, payments) {
        try {
            electron_log_1.default.info('PDFPrintService: Printing invoice', { orderId: order.id });
            // Validate data
            this.validatePDFData(order, 'الطلب');
            this.validatePDFData(dentist, 'الطبيب');
            this.sendProgress(10, 'جاري التحقق من البيانات...');
            this.sendProgress(20, 'جاري إنشاء الفاتورة...');
            const filename = `فاتورة_${order.order_number}_${Date.now()}.pdf`;
            const filepath = this.getExportPath(filename);
            const doc = this.createDocument();
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            this.sendProgress(40, 'جاري إضافة البيانات...');
            // Header
            this.addHeader(doc, 'فاتورة');
            // Invoice info
            doc.fontSize(10)
                .text(this.prepareArabic(`رقم الطلب: ${order.order_number}`), { align: 'right' })
                .text(this.prepareArabic(`التاريخ: ${this.formatDate(order.date_received)}`), { align: 'right' })
                .moveDown();
            // Dentist info
            doc.fontSize(12).text(this.prepareArabic('معلومات الطبيب:'), { underline: true }).moveDown(0.5);
            doc.fontSize(10)
                .text(this.prepareArabic(`الاسم: ${dentist.name}`), { align: 'right' })
                .text(this.prepareArabic(`الهاتف: ${dentist.phone}`), { align: 'right' })
                .text(this.prepareArabic(`العنوان: ${dentist.residence}`), { align: 'right' })
                .moveDown();
            // Order details table
            doc.fontSize(12).text(this.prepareArabic('تفاصيل الطلب:'), { underline: true }).moveDown(0.5);
            const tableTop = doc.y;
            const itemHeight = 25;
            // Table header
            doc.fontSize(10)
                .text(this.prepareArabic('الوصف'), 50, tableTop, { width: 200, align: 'right' })
                .text(this.prepareArabic('الكمية'), 270, tableTop, { width: 80, align: 'center' })
                .text(this.prepareArabic('السعر'), 370, tableTop, { width: 100, align: 'center' })
                .text(this.prepareArabic('المجموع'), 490, tableTop, { width: 100, align: 'center' });
            // Line under header
            doc.moveTo(50, tableTop + 15)
                .lineTo(550, tableTop + 15)
                .stroke();
            // Order item
            const itemY = tableTop + itemHeight;
            const description = `${order.case_type} - ${order.main_material} - ${order.finish_type}`;
            doc.fontSize(10)
                .text(this.prepareArabic(description), 50, itemY, { width: 200, align: 'right' })
                .text(order.quantity.toString(), 270, itemY, { width: 80, align: 'center' })
                .text(this.formatCurrency(order.price / order.quantity), 370, itemY, { width: 100, align: 'center' })
                .text(this.formatCurrency(order.price), 490, itemY, { width: 100, align: 'center' });
            doc.moveDown(3);
            // Payment summary
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = order.price - totalPaid;
            doc.fontSize(12)
                .text(this.prepareArabic(`المجموع الكلي: ${this.formatCurrency(order.price)}`), { align: 'left' })
                .text(this.prepareArabic(`المدفوع: ${this.formatCurrency(totalPaid)}`), { align: 'left' })
                .text(this.prepareArabic(`المتبقي: ${this.formatCurrency(remaining)}`), { align: 'left', underline: true });
            this.sendProgress(80, 'جاري إضافة التذييل...');
            // Footer
            this.addFooter(doc);
            doc.end();
            this.sendProgress(90, 'جاري حفظ الملف...');
            await new Promise((resolve, reject) => {
                stream.on('finish', () => resolve());
                stream.on('error', reject);
            });
            // Verify PDF file
            this.verifyPDFFile(filepath);
            this.sendProgress(100, 'تم طباعة الفاتورة بنجاح');
            electron_log_1.default.info('PDFPrintService: Invoice printed successfully', { filepath });
            return filepath;
        }
        catch (error) {
            this.sendProgress(0, 'فشلت طباعة الفاتورة');
            electron_log_1.default.error('PDFPrintService: Error printing invoice', error);
            if (error instanceof PDFValidationError) {
                throw error;
            }
            throw new Error(`فشل طباعة الفاتورة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }
    /**
     * Print comprehensive report
     */
    async printReport(title, data, columns) {
        try {
            electron_log_1.default.info('PDFPrintService: Printing report', { title, rowCount: data.length });
            // Validate data
            if (!Array.isArray(data) || data.length === 0) {
                throw new PDFValidationError('لا توجد بيانات للطباعة في التقرير');
            }
            this.sendProgress(10, 'جاري التحقق من البيانات...');
            this.sendProgress(20, 'جاري إنشاء التقرير...');
            const filename = `${this.prepareArabic(title)}_${Date.now()}.pdf`;
            const filepath = this.getExportPath(filename);
            const doc = this.createDocument();
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            this.sendProgress(30, 'جاري إضافة العنوان...');
            // Header
            this.addHeader(doc, title);
            // Calculate column widths
            const pageWidth = 500; // 550 - 50 (margins)
            const totalWidth = columns.reduce((sum, col) => sum + (col.width || 100), 0);
            const scaleFactor = pageWidth / totalWidth;
            // Table header
            let x = 50;
            const headerY = doc.y;
            columns.forEach(col => {
                const width = (col.width || 100) * scaleFactor;
                doc.fontSize(10)
                    .text(this.prepareArabic(col.label), x, headerY, { width, align: 'center' });
                x += width;
            });
            // Line under header
            doc.moveTo(50, headerY + 15)
                .lineTo(550, headerY + 15)
                .stroke();
            doc.moveDown();
            this.sendProgress(50, 'جاري إضافة البيانات...');
            // Table rows
            data.forEach((row, index) => {
                if (doc.y > 700) {
                    doc.addPage();
                    doc.moveDown();
                }
                x = 50;
                const rowY = doc.y;
                columns.forEach(col => {
                    const width = (col.width || 100) * scaleFactor;
                    const value = row[col.key]?.toString() || '';
                    doc.fontSize(9)
                        .text(this.prepareArabic(value), x, rowY, { width, align: 'center' });
                    x += width;
                });
                doc.moveDown(0.5);
                // Update progress every 50 rows
                if (index % 50 === 0) {
                    const progress = 50 + Math.floor((index / data.length) * 30);
                    this.sendProgress(progress, `جاري إضافة البيانات... (${index + 1}/${data.length})`);
                }
            });
            this.sendProgress(85, 'جاري إضافة التذييل...');
            // Footer
            this.addFooter(doc);
            doc.end();
            this.sendProgress(90, 'جاري حفظ الملف...');
            await new Promise((resolve, reject) => {
                stream.on('finish', () => resolve());
                stream.on('error', reject);
            });
            // Verify PDF file
            this.verifyPDFFile(filepath);
            this.sendProgress(100, 'تم طباعة التقرير بنجاح');
            electron_log_1.default.info('PDFPrintService: Report printed successfully', { filepath });
            return filepath;
        }
        catch (error) {
            this.sendProgress(0, 'فشلت طباعة التقرير');
            electron_log_1.default.error('PDFPrintService: Error printing report', error);
            if (error instanceof PDFValidationError) {
                throw error;
            }
            throw new Error(`فشل طباعة التقرير: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }
}
exports.PDFPrintService = PDFPrintService;

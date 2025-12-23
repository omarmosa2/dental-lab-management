/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore - no type definitions available
import PDFDocument from 'pdfkit';
import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import log from 'electron-log';
// @ts-ignore - no type definitions available
import arabicReshaper from 'arabic-reshaper';
// @ts-ignore - no type definitions available
import bidi from 'bidi-js';
/* eslint-enable @typescript-eslint/ban-ts-comment */
import type { Order, Dentist, Payment } from '../../../shared/types/api.types';
import { OrderStatusLabels } from '../../../shared/constants/enums';
import formatCurrency from '../../../utils/currency';

/**
 * PDF validation error
 */
export class PDFValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PDFValidationError';
  }
}

export class PDFPrintService {
  private fontPath: string;

  constructor() {
    // Path to Cairo font (you'll need to add this font to resources)
    this.fontPath = path.join(app.getAppPath(), 'resources', 'fonts', 'Cairo-Regular.ttf');
  }

  /**
   * Send progress update to renderer
   */
  private sendProgress(progress: number, message: string): void {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('pdf:progress', { progress, message });
    }
  }

  /**
   * Validate export directory
   */
  private validateExportDirectory(dirPath: string): void {
    try {
      // Check if directory exists, create if not
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Test write permissions
      const testFile = path.join(dirPath, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      
      log.info('PDFPrintService: Export directory validated', { dirPath });
    } catch (error) {
      log.error('PDFPrintService: Export directory validation failed', error);
      throw new PDFValidationError('لا يمكن الكتابة في مجلد التصدير. تحقق من الصلاحيات');
    }
  }

  /**
   * Get export directory path
   */
  private getExportPath(filename: string): string {
    const documentsPath = app.getPath('documents');
    const exportDir = path.join(documentsPath, 'Dental Lab Exports');
    
    // Validate directory
    this.validateExportDirectory(exportDir);
    
    return path.join(exportDir, filename);
  }

  /**
   * Prepare Arabic text for PDF rendering
   */
  private prepareArabic(text: string): string {
    if (!text) return '';
    try {
      const reshaped = arabicReshaper(text);
      return bidi(reshaped);
    } catch (error) {
      log.error('PDFPrintService: Error preparing Arabic text', error);
      return text;
    }
  }

  /**
   * Format date for display
   */
  private formatDate(timestamp: number): string {
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
  private formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  /**
   * Create PDF document with Arabic support
   */
  private createDocument(): any {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
    });

    // Register Arabic font if available
    if (fs.existsSync(this.fontPath)) {
      doc.registerFont('Cairo', this.fontPath);
      doc.font('Cairo');
    } else {
      log.warn('PDFPrintService: Arabic font not found, using default font');
    }

    return doc;
  }

  /**
   * Validate PDF data
   */
  private validatePDFData(data: any, entityName: string): void {
    if (!data) {
      throw new PDFValidationError(`لا توجد بيانات ${entityName} للطباعة`);
    }
    log.info(`PDFPrintService: Validation passed for ${entityName}`);
  }

  /**
   * Verify PDF file was created successfully
   */
  private verifyPDFFile(filepath: string): void {
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

    log.info('PDFPrintService: PDF file verified', { filepath, size: stats.size });
  }

  /**
   * Add header to PDF
   */
  private addHeader(doc: any, title: string): void {
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
  private addFooter(doc: any): void {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .text(
           this.prepareArabic(`صفحة ${i + 1} من ${pageCount}`),
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
    }
  }

  /**
   * Print order details
   */
  async printOrder(order: Order, dentist?: Dentist): Promise<string> {
    try {
      log.info('PDFPrintService: Printing order', { orderId: order.id });

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
        `الحالة: ${OrderStatusLabels[order.status as keyof typeof OrderStatusLabels] || order.status}`,
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
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });

      // Verify PDF file
      this.verifyPDFFile(filepath);

      this.sendProgress(100, 'تم الطباعة بنجاح');
      log.info('PDFPrintService: Order printed successfully', { filepath });
      return filepath;
    } catch (error) {
      this.sendProgress(0, 'فشلت الطباعة');
      log.error('PDFPrintService: Error printing order', error);
      
      if (error instanceof PDFValidationError) {
        throw error;
      }
      
      throw new Error(`فشل طباعة الطلب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  /**
   * Print invoice
   */
  async printInvoice(order: Order, dentist: Dentist, payments: Payment[]): Promise<string> {
    try {
      log.info('PDFPrintService: Printing invoice', { orderId: order.id });

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
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });

      // Verify PDF file
      this.verifyPDFFile(filepath);

      this.sendProgress(100, 'تم طباعة الفاتورة بنجاح');
      log.info('PDFPrintService: Invoice printed successfully', { filepath });
      return filepath;
    } catch (error) {
      this.sendProgress(0, 'فشلت طباعة الفاتورة');
      log.error('PDFPrintService: Error printing invoice', error);
      
      if (error instanceof PDFValidationError) {
        throw error;
      }
      
      throw new Error(`فشل طباعة الفاتورة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  /**
   * Print comprehensive report
   */
  async printReport(
    title: string,
    data: Array<Record<string, any>>,
    columns: Array<{ key: string; label: string; width?: number }>
  ): Promise<string> {
    try {
      log.info('PDFPrintService: Printing report', { title, rowCount: data.length });

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
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });

      // Verify PDF file
      this.verifyPDFFile(filepath);

      this.sendProgress(100, 'تم طباعة التقرير بنجاح');
      log.info('PDFPrintService: Report printed successfully', { filepath });
      return filepath;
    } catch (error) {
      this.sendProgress(0, 'فشلت طباعة التقرير');
      log.error('PDFPrintService: Error printing report', error);
      
      if (error instanceof PDFValidationError) {
        throw error;
      }
      
      throw new Error(`فشل طباعة التقرير: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }
}
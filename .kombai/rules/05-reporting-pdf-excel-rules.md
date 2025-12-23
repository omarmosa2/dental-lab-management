# 05 - Reporting (PDF & Excel) Rules (Expanded)

## Goals
- Generate professional A4 PDF reports (Arabic RTL) and Excel `.xlsx` files that open correctly in Office/LibreOffice.

## PDF generation technical pipeline
1. Data retrieval in ReportService -> normalized rows.
2. Convert data fields to display-friendly Arabic strings.
3. For Arabic rendering:
   - Use `arabic-reshaper` to reshape Arabic text for proper ligatures.
   - Use `bidi-js` to apply right-to-left ordering.
   - Example helper: `prepareArabic(text): string`.
4. Use `pdfkit` to create doc:
   - Register font: `doc.registerFont('Cairo', pathToCairo)`.
   - Use `doc.font('Cairo')` and `doc.fontSize(10)`.
   - For tables: compute column widths from page width minus margins, render header row right-aligned.
   - Paginate rows across pages, repeat header row on new pages.
5. Save to `app.getPath('documents')` with Arabic-friendly filename.

## Excel generation
- Use `exceljs`.
- Create workbook and worksheet with `worksheet.views = [{ rightToLeft: true }]`.
- Set headerRow with Arabic column names.
- Format date columns with localized format.
- Save to Documents folder.

## Report types (as per PDF)
- Orders report (filter: date range, dentist, status, material)
- Dentists report
- Materials (inventory) report with alerts
- Payments report (date range)
- Expenses report
- Summary / Financial report (revenues vs expenses)

## File naming convention
- `تقرير_الطلبات_YYYYMMDD_HHMM.xlsx` or `.pdf`
- Ensure filenames sanitized for filesystem.

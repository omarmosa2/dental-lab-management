الخطوات لبناء النسخة النهائية (Windows installer)

1) تثبيت الاعتماديات:
   - افتح ترمينال في جذر المشروع
   - تشغيل: `npm install`

2) بناء عملية الــ Main (ملفات الـ Electron main):
   - تشغيل: `npm run build:main`
   - هذا سيقوم بترجمة ملفات TypeScript الموجودة في `src/index.ts` و `src/main/**` إلى مجلد `electron/`.

3) بناء الـ Renderer:
   - تم إعداد المشروع لاستخدام **Vite** لبناء الـ renderer.
   - شغّل: `npm run build` (يعمل `npm run build:main` ثم `vite build`) وسيضع مخرجات الـ renderer في `dist/`.
   - بعد البناء، ملف `dist/index.html` وملف `sql-wasm.wasm` سيُنسخان تلقائيًا (يتم تشغيل `postbuild:renderer`).

4) إنشاء حزمة التثبيت (installer):
   - بعد تنفيذ خطوة 2 و 3 بنجاح، شغّل: `npm run dist` أو `npm run dist:win`
   - سينتج مجلد `dist-electron` يحتوي على المثبت (NSIS) حسب إعدادات `build` في `package.json`.
   - إذا واجهت مشاكل أثناء التوزيع، أعدّ لي الأخطاء وسأقوم بحلها.

ملاحظات مهمة:
- سكربتات `build` تم إعدادها لتستخدم Vite كـ renderer. إذا أردت الاحتفاظ بـ webpack/electron-forge، قم بتعديل `build` ليقوم ببناء الـ renderer الحالي (مثلاً: `npm run make` أو السكربت المناسب).
- أي ملف في `installer/` مثل `license-en.txt` و `icon.ico` سيُضمّن تلقائياً حسب إعدادات `build.nsis`.
- بعد التثبيت، اختبر التطبيق على بيئة Windows 64-bit.

إذا تريد، أستطيع:
- إعداد Vite للـ renderer (تحويل البنية) أو
- تكييف السكربتات لاستخدام Webpack الحالي لإنتاج مجلد `dist` المتوافق مع electron-builder.

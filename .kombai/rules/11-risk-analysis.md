phase 0

✅ تحليل وتحديد المخاطر للمشروع (Risk Identification & Mitigation)
1) تكامل Electron معقد (سيتم استخدام electron-vite)

مستوى الخطورة: متوسط–عالٍ
سبب الخطورة:

electron-vite نظام حديث نسبيًا مقارنة بـ electron-builder التقليدي.

الدمج بين main/preload/renderer قد يسبب مشاكل في المسارات أو inlined assets.

مشكلات تقليدية: contextBridge، توزيع الإصدارات، مسارات الخطوط والملفات.

إجراءات التخفيف (Mitigation):

اتباع Clean Architecture لضمان فصل responsibilities.

التأكد من أن preload يحمّل من مسار ثابت، وضبط alias في electron-vite بشكل دقيق.

تفعيل strict IPC boundary لمنع أي كسر في security sandbox.

إجراء build مبكرًا في PHASE 0 لمشروع فارغ لضبط البنية.

2) دعم اللغة العربية RTL (سيتم تكوين Tailwind)

مستوى الخطورة: متوسط
سبب الخطورة:

بعض مكونات React قد لا تدعم RTL افتراضيًا.

Tailwind لا يفعل RTL تلقائيًا بدون تفعيل plugin مخصص.

تنسيق PDF و Excel يحتاج معالجة RTL مركّبة.

إجراءات التخفيف:

تفعيل Tailwind RTL Plugin مثل tailwindcss-rtl.

ضبط <html dir="rtl" lang="ar"> في index.html.

كتابة CSS utilities مخصصة لاستبدال بعض المكونات.

testing بصري (visual QA) لكل شاشة و Form قبل الاعتماد عليها.

3) تكامل WhatsApp (سيتم استخدام wa.me links)

مستوى الخطورة: منخفض
سبب الخطورة:

wa.me موجود لكنه حساس جدًا للتنسيق، ويجب إزالة الرموز والمسافات والعلامات.

قد لا يعمل الافتتاح مع بعض المتصفحات أو الأنظمة.

إجراءات التخفيف:

إنشاء دالة formatPhoneForWhatsApp() في util layer.

اختبار 10–20 رقمًا لضمان صحة الإرسال.

fallback: إذا فشل الرابط → رسالة للمستخدم.

4) تصدير Excel بالعربية (سيتم استخدام exceljs)

مستوى الخطورة: متوسط
سبب الخطورة:

ExcelJS لا يدعم RTL تلقائيًا بدون workaround.

بعض نسخ Excel (خاصة القديمة) تظهر RTL بشكل منحرف.

إجراءات التخفيف:

تفعيل:

worksheet.views = [{ rightToLeft: true }];


تسمية الأعمدة بالعربية مباشرة.

اختبار التصدير على 3 بيئات: Windows، Office 365، LibreOffice.

5) الوضع المظلم/الفاتح (سيتم استخدام Tailwind dark mode)

مستوى الخطورة: منخفض
سبب الخطورة:

بعض الألوان قد لا تكون متناسقة في الوضعين.

عند الطباعة PDF أو Print Preview، قد تظهر الألوان الداكنة بشكل غير مقروء.

إجراءات التخفيف:

الاعتماد على تصميم theme-neutral دون contrast منخفض.

إنشاء theme.config.ts للتحكم في ألوان الواجهة.

اختبار الواجهة بالـ automated visual test.
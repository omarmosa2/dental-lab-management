# اختبار التطبيق

## خطوات الاختبار السريع:

1. **تشغيل التطبيق في وضع التطوير:**
```powershell
npm start
```

2. **بناء التطبيق للإنتاج:**
```powershell
# خطوة 1: بناء main process
npm run build:main

# خطوة 2: بناء renderer process
npm run build:renderer

# خطوة 3: تجميع التطبيق
npm run package

# خطوة 4: إنشاء المثبت
npm run make
```

## التحقق من المثبت:
- الملف سيكون في: `out/make/squirrel.windows/x64/AgorraLab-Setup.exe`
- يمكن تثبيت التطبيق على سطح المكتب
- اسم التطبيق سيكون: AgorraLab
- الأيقونة ستكون من: `assets/icon.ico`
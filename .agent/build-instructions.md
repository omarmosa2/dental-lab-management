# تعليمات البناء - AgorraLab

## المشاكل التي تم إصلاحها:

1. **الأيقونة**: تم تحديث الأيقونة لاستخدام `assets/icon.ico`
   - تم تحديث `forge.config.ts` لتضمين الأيقونة
   - تم تحديث `src/index.ts` لعرض الأيقونة في النافذة

2. **اسم التطبيق**: تم تغيير الاسم إلى "AgorraLab"
   - تم تحديث `package.json`
   - تم تحديث `forge.config.ts`
   - تم تحديث عنوان النافذة في `src/index.html`

3. **إعدادات البناء**: تم تحديث التكوينات للعمل مع Electron Forge

## أوامر البناء:

```powershell
# 1. بناء Main Process
npm run build:main

# 2. بناء Renderer Process  
npx vite build

# 3. تجميع التطبيق (Package)
npx electron-forge package

# 4. إنشاء المثبت (Installer)
npx electron-forge make
```

## ملاحظات:
- التطبيق سيتم إنشاؤه في مجلد `out/`
- اسم الملف التنفيذي سيكون `AgorraLab.exe`
- اسم ملف التثبيت سيكون `AgorraLab-Setup.exe`
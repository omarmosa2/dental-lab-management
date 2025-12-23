# نظام الترخيص - License System

## نظرة عامة

تم إضافة نظام ترخيص للتطبيق يتطلب تفعيل لمرة واحدة عند التثبيت الأول. النظام يربط كود التفعيل بـ Hardware ID الخاص بالجهاز لضمان عدم استخدام الكود على أكثر من جهاز.

---

## كيفية عمل النظام

### 1. عند التثبيت الأول

عند فتح التطبيق لأول مرة، سيظهر للمستخدم:
- **Hardware ID** (معرف الجهاز) - يمكن نسخه
- حقل لإدخال **كود التفعيل**

### 2. خطوات التفعيل

1. المستخدم ينسخ **Hardware ID** من التطبيق
2. يرسل **Hardware ID** للمطور عبر البريد الإلكتروني أو WhatsApp
3. المطور يولد كود تفعيل خاص بهذا **Hardware ID**
4. المستخدم يدخل كود التفعيل في التطبيق
5. يتم التحقق من الكود وربطه بالجهاز
6. بعد التفعيل الناجح، يمكن استخدام التطبيق بشكل كامل

### 3. التحقق من الترخيص

- يتم التحقق من الترخيص عند بدء التطبيق
- إذا لم يكن الترخيص مفعلاً، يتم توجيه المستخدم تلقائياً لصفحة التفعيل
- لا يمكن الوصول لأي صفحة في التطبيق بدون ترخيص مفعّل

---

## للمطور: توليد كود التفعيل

### الطريقة 1: من خلال التطبيق (Development Mode)

في وضع التطوير، يمكن استخدام IPC handler:

```typescript
// في DevTools Console
const hardwareId = "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX";
const result = await window.licenseApi.generateKey(hardwareId);
console.log(result.data); // كود التفعيل
```

### الطريقة 2: من خلال LicenseService

```typescript
import { getLicenseService } from './main/core/services/LicenseService';

const licenseService = getLicenseService();
const hardwareId = "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX";
const licenseKey = licenseService.generateLicenseKey(hardwareId);
console.log(licenseKey); // LICENSE-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
```

### الطريقة 3: إنشاء أداة منفصلة

يمكن إنشاء أداة CLI منفصلة لتوليد أكواد التفعيل:

```typescript
// generate-license.ts
import { getLicenseService } from './main/core/services/LicenseService';

const hardwareId = process.argv[2];
if (!hardwareId) {
  console.error('Usage: node generate-license.js <hardware-id>');
  process.exit(1);
}

const licenseService = getLicenseService();
const licenseKey = licenseService.generateLicenseKey(hardwareId);
console.log(`Hardware ID: ${hardwareId}`);
console.log(`License Key: ${licenseKey}`);
```

---

## البنية التقنية

### الملفات الرئيسية

1. **LicenseService** (`src/main/core/services/LicenseService.ts`)
   - إدارة الترخيص والتحقق
   - توليد Hardware ID
   - توليد وتحقق من أكواد التفعيل

2. **License Handlers** (`src/main/ipc/licenseHandlers.ts`)
   - IPC handlers للتواصل بين Renderer و Main Process

3. **License Activation Page** (`src/pages/LicenseActivation.tsx`)
   - صفحة التفعيل مع عرض Hardware ID وإدخال الكود

4. **License Guard** (`src/components/LicenseGuard.tsx`)
   - مكون للتحقق من الترخيص قبل السماح بالوصول

5. **Database Migration** (`src/main/core/database/migrations/0009_license.sql`)
   - جدول `license` في قاعدة البيانات

### قاعدة البيانات

```sql
CREATE TABLE license (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hardware_id TEXT NOT NULL UNIQUE,
  license_key TEXT NOT NULL UNIQUE,
  activated_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### Hardware ID

يتم توليد Hardware ID من:
- Hostname
- Platform (Windows, macOS, Linux)
- Architecture
- CPU Model
- Total Memory
- Network Interfaces MAC Addresses

يتم إنشاء hash SHA256 من هذه المعلومات وتنسيقه كـ `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`

### License Key Format

صيغة كود التفعيل: `LICENSE-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`

الكود يتم توليده من:
- Hardware ID
- Secret Key (يجب تغييره في الإنتاج)

---

## الأمان

### Secret Key

⚠️ **مهم جداً**: يجب تغيير `LICENSE_SECRET_KEY` في الإنتاج!

يمكن تعيينه كمتغير بيئة:

```bash
# .env
LICENSE_SECRET_KEY=your-secret-key-here-change-this
```

أو في `LicenseService.ts`:

```typescript
this.secretKey = process.env.LICENSE_SECRET_KEY || 'your-production-secret-key';
```

### التحقق

- كل كود تفعيل مرتبط بـ Hardware ID محدد
- لا يمكن استخدام نفس الكود على جهاز آخر
- الكود يتم التحقق منه عند كل بدء للتطبيق

---

## API Reference

### Renderer API (window.licenseApi)

```typescript
// الحصول على Hardware ID
const result = await window.licenseApi.getHardwareId();
// Returns: { ok: true, data: "XXXX-XXXX-..." }

// الحصول على معلومات الترخيص
const info = await window.licenseApi.getInfo();
// Returns: { ok: true, data: { hardwareId, isActivated, activatedAt, licenseKey } }

// التحقق من حالة التفعيل
const activated = await window.licenseApi.isActivated();
// Returns: { ok: true, data: true/false }

// تفعيل الترخيص
const activate = await window.licenseApi.activate("LICENSE-XXXX-...");
// Returns: { ok: true, data: { success: true } }

// توليد كود تفعيل (للمطور فقط)
const key = await window.licenseApi.generateKey(hardwareId);
// Returns: { ok: true, data: "LICENSE-XXXX-..." }
```

---

## الاختبار

### اختبار التفعيل

1. افتح التطبيق
2. انسخ Hardware ID
3. استخدم `generateKey` لتوليد كود تفعيل
4. أدخل الكود في التطبيق
5. يجب أن يتم التفعيل بنجاح

### اختبار التحقق

1. فعّل الترخيص
2. أغلق التطبيق
3. افتح التطبيق مرة أخرى
4. يجب أن يتم التوجيه مباشرة للقائمة الرئيسية (بدون صفحة التفعيل)

---

## استكشاف الأخطاء

### المشكلة: لا يظهر Hardware ID

**الحل**: تأكد من أن IPC handlers مسجلة بشكل صحيح

### المشكلة: كود التفعيل لا يعمل

**الحل**: 
- تأكد من أن الكود مطابق تماماً (حساس لحالة الأحرف)
- تأكد من أن Hardware ID صحيح
- تأكد من أن Secret Key متطابق

### المشكلة: التطبيق لا يتحقق من الترخيص

**الحل**: تأكد من أن `LicenseGuard` يحيط بجميع الصفحات المحمية

---

## ملاحظات مهمة

1. **لا تشارك Secret Key**: يجب أن يبقى سرياً
2. **احتفظ بنسخة احتياطية**: من قاعدة البيانات بعد التفعيل
3. **Hardware ID فريد**: كل جهاز له Hardware ID مختلف
4. **كود واحد = جهاز واحد**: لا يمكن استخدام نفس الكود على أكثر من جهاز

---

## التطوير المستقبلي

يمكن إضافة:
- نظام ترخيص عبر الإنترنت
- ربط بخادم للتحقق من الترخيص
- ترخيص محدود المدة (Subscription)
- ترخيص متعدد الأجهزة (مع إدارة)
- لوحة تحكم للمطور لإدارة التراخيص


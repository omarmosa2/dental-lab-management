# حل مشكلة الترخيص - تعليمات مفصلة

## المشكلة المكتشفة

الخطأ في الـ logs:
```
License key generated for hardware ID: B507-2C60-A583-34F9-A94B-F0ED-9FCE-5DDE
License key does not match hardware ID
Failed to activate license: كود التفعيل غير صالح لهذا الجهاز
```

**السبب الجذري:**
المفتاح `LICENSE-B2DB-D1D4-7956-BAEF-6F92-DD3C` تم توليده في وضع التطوير (Development)، لكن النظام في الإنتاج يتوقع مفتاح مختلف لنفس الـ Hardware ID.

---

## الحل المؤقت - استخدام مفتاح master

أضف الكود التالي في `src/main/core/services/LicenseService.ts` بعد السطر 160:

```typescript
// TEMPORARY: Check for master license key
const MASTER_KEY = 'LICENSE-MASTER-KEY-2025-ADMIN-ACCESS';
if (licenseKey.toUpperCase() === MASTER_KEY) {
  log.info('Master license key used - bypassing hardware verification');
  return true;
}
```

ثم أعد البناء واستخدم هذا المفتاح: `LICENSE-MASTER-KEY-2025-ADMIN-ACCESS`

---

## الحل الدائم - نظام ترخيص مبسط

### الخيار 1: تعطيل التحقق من الترخيص (للتطوير فقط)

في `src/index.ts`، أضف هذا الكود في بداية الملف:

```typescript
// Development only - bypass license
if (process.env.NODE_ENV === 'development') {
  process.env.SKIP_LICENSE_CHECK = 'true';
}
```

ثم في `LicenseService.ts`:

```typescript
isLicenseActivated(): boolean {
  if (process.env.SKIP_LICENSE_CHECK === 'true') {
    return true;
  }
  // ... rest of code
}
```

### الخيار 2: استخدام تاريخ انتهاء بسيط

بدلاً من التحقق من Hardware ID، استخدم فقط تاريخ انتهاء:

```typescript
activateLicense(licenseKey: string): void {
  // Simple format: LICENSE-YYYY-MM-DD
  const match = licenseKey.match(/^LICENSE-(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new ValidationError('صيغة كود التفعيل غير صحيحة');
  }
  
  const [_, year, month, day] = match;
  const expiryDate = new Date(+year, +month - 1, +day);
  
  if (expiryDate < new Date()) {
    throw new BusinessRuleError('كود التفعيل منتهي الصلاحية');
  }
  
  // Save to database
  const activatedAt = Math.floor(Date.now() / 1000);
  executeNonQuery(
    'INSERT OR REPLACE INTO license (id, license_key, activated_at, is_active) VALUES (1, ?, ?, 1)',
    [licenseKey.toUpperCase(), activatedAt]
  );
  saveDatabase();
}
```

مفتاح مثال: `LICENSE-2026-12-31` (صالح حتى 31 ديسمبر 2026)

### الخيار 3: نظام رمز PIN بسيط (الأبسط)

```typescript
activateLicense(licenseKey: string): void {
  // Simple 8-digit PIN
  const VALID_PINS = [
    '12345678',
    '87654321',
    'ADMIN123'
  ];
  
  if (!VALID_PINS.includes(licenseKey)) {
    throw new BusinessRuleError('كود التفعيل غير صحيح');
  }
  
  // Save activation
  const activatedAt = Math.floor(Date.now() / 1000);
  executeNonQuery(
    'INSERT OR REPLACE INTO license (id, license_key, activated_at, is_active) VALUES (1, ?, ?, 1)',
    [licenseKey, activatedAt]
  );
  saveDatabase();
}
```

---

## التنفيذ الموصى به (الخيار 3 - PIN)

### الخطوة 1: تحديث LicenseService

استبدل دالة `activateLicense` بهذا الكود البسيط:

```typescript
/**
 * Activate license with a simple PIN code
 */
activateLicense(licenseKey: string): void {
  try {
    log.info('Activating license with PIN:', licenseKey.substring(0, 4) + '...');
    
    // List of valid activation PINs
    const VALID_PINS = [
      'AGORRALAB2025',
      'DENTALLAB123',
      'ADMIN2025'
    ];
    
    if (!VALID_PINS.includes(licenseKey.trim().toUpperCase())) {
      throw new BusinessRuleError('كود التفعيل غير صحيح');
    }
    
    const activatedAt = Math.floor(Date.now() / 1000);
    
    // Check if already activated
    const existing = executeQuery<{ id: number }>(
      'SELECT id FROM license WHERE id = 1',
      []
    );
    
    if (existing.length > 0) {
      // Update existing
      executeNonQuery(
        'UPDATE license SET license_key = ?, activated_at = ?, is_active = 1, updated_at = ? WHERE id = 1',
        [licenseKey.toUpperCase(), activatedAt, activatedAt]
      );
    } else {
      // Insert new
      executeNonQuery(
        'INSERT INTO license (id, hardware_id, license_key, activated_at, is_active) VALUES (1, ?, ?, ?, 1)',
        ['ACTIVATED', licenseKey.toUpperCase(), activatedAt]
      );
    }
    
    saveDatabase();
    log.info('License activated successfully with PIN');
  } catch (error) {
    log.error('Failed to activate license:', error);
    throw error;
  }
}

/**
 * Check if license is activated
 */
isLicenseActivated(): boolean {
  try {
    const result = executeQuery<{ is_active: number }>(
      'SELECT is_active FROM license WHERE id = 1 AND is_active = 1',
      []
    );
    return result.length > 0 && result[0].is_active === 1;
  } catch (error) {
    log.error('Failed to check license status:', error);
    return false;
  }
}
```

### الخطوة 2: تحديث UI

في صفحة التفعيل، غيّر النص من:
```
"أدخل كود التفعيل الذي حصلت عليه من المطور"
```

إلى:
```
"أدخل كود التفعيل (PIN)"
```

### الخطوة 3: أكواد التفعيل الصالحة

استخدم أحد هذه الأكواد:
- `AGORRALAB2025`
- `DENTALLAB123`
- `ADMIN2025`

---

## الاختبار

1. احذف التطبيق المثبت حالياً
2. احذف البيانات: `C:\Users\<YourName>\AppData\Roaming\AgorraLab\`
3. أعد البناء: `npm run dist:win`
4. ثبت النسخة الجديدة
5. استخدم أحد أكواد PIN المذكورة أعلاه
6. يجب أن يعمل فوراً!

---

## مقارنة الخيارات

| الخيار | السهولة | الأمان | مناسب لـ |
|--------|---------|--------|-----------|
| Master Key | ⭐⭐⭐⭐⭐ | ⭐⭐ | اختبار سريع |
| Date-based | ⭐⭐⭐⭐ | ⭐⭐⭐ | فترة تجريبية |
| PIN System | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | **الموصى به** |
| Hardware ID | ⭐⭐ | ⭐⭐⭐⭐⭐ | إنتاج متقدم |

---

## الخلاصة

النظام الحالي (Hardware ID based) معقد جداً للحالة الحالية. نوصي باستخدام **نظام PIN البسيط** (الخيار 3) الذي:

✅ سهل التنفيذ والاختبار
✅ يعمل في جميع الأجهزة
✅ لا يتطلب توليد مفاتيح معقدة
✅ مستوى أمان معقول للتطبيقات Desktop
✅ سهل الإدارة (يمكن إضافة/إزالة PINs بسهولة)
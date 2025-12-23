# 📚 دليل المطور - المرحلة 1

دليل شامل لاستخدام الميزات الجديدة المضافة في المرحلة 1

---

## 🗄️ Soft Delete

### الاستخدام الأساسي

```typescript
// حذف سجل (soft delete)
dentistRepository.delete(id);

// استعادة سجل محذوف
const restored = dentistRepository.restore(id);

// حذف نهائي (استخدم بحذر!)
dentistRepository.permanentDelete(id);
```

### ملاحظات مهمة
- ✅ جميع queries تتجاهل السجلات المحذوفة تلقائياً
- ✅ يمكن استعادة السجلات المحذوفة في أي وقت
- ⚠️ `permanentDelete()` يحذف السجل نهائياً ولا يمكن استعادته

---

## 🔄 Transaction Management

### مثال بسيط

```typescript
import { executeTransaction } from '../database/connection';

// تنفيذ عدة عمليات في transaction واحد
executeTransaction([
  {
    sql: 'INSERT INTO orders (...) VALUES (...)',
    params: [...]
  },
  {
    sql: 'INSERT INTO payments (...) VALUES (...)',
    params: [...]
  }
]);
```

### مثال مع RETURNING

```typescript
// الحصول على نتيجة آخر query
const results = executeTransaction<Order>([
  {
    sql: 'INSERT INTO orders (...) VALUES (...) RETURNING *',
    params: [...]
  }
]);

const newOrder = results[0];
```

### Error Handling

```typescript
try {
  executeTransaction([...]);
} catch (error) {
  // سيتم عمل ROLLBACK تلقائياً
  console.error('Transaction failed:', error);
}
```

---

## 🧹 Input Sanitization

### الدوال المتاحة

```typescript
import {
  sanitizeString,
  sanitizePhone,
  sanitizeEmail,
  sanitizeNationalId,
  sanitizePositiveNumber,
  sanitizeStringArray
} from '../utils/sanitization';

// تنظيف نص
const cleanName = sanitizeString('  محمد   أحمد  '); // "محمد أحمد"

// تنظيف رقم هاتف
const cleanPhone = sanitizePhone('0912-345-6789'); // "0912-345-6789"

// التحقق من بريد إلكتروني
const email = sanitizeEmail('USER@EXAMPLE.COM'); // "user@example.com"

// التحقق من رقم وطني
const nationalId = sanitizeNationalId('12345678901'); // "12345678901"

// التحقق من رقم موجب
const salary = sanitizePositiveNumber(-100); // 0
```

### الاستخدام في Schemas

```typescript
import { sanitizeString } from '../../utils/sanitization';

const schema = z.object({
  name: z.string()
    .min(1, 'الاسم مطلوب')
    .transform(sanitizeString)
});
```

---

## ✅ Enhanced Validation

### Phone Validation

```typescript
const phoneSchema = z.string()
  .min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل')
  .regex(/^[0-9+\-\s()]{10,}$/, 'رقم هاتف غير صحيح')
  .transform(sanitizePhone);
```

### National ID Validation

```typescript
const nationalIdSchema = z.string()
  .optional()
  .transform(sanitizeNationalId)
  .refine(
    (val) => val === null || val.length === 11,
    { message: 'الرقم الوطني يجب أن يكون 11 رقم' }
  );
```

### Date Range Validation

```typescript
const orderSchema = z.object({
  date_received: z.number(),
  date_due: z.number(),
}).refine(
  (data) => data.date_due > data.date_received,
  {
    message: 'تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام',
    path: ['date_due'],
  }
);
```

---

## 📝 Audit Trail

### تسجيل عملية

```typescript
import { AuditService } from '../services/AuditService';

const auditService = new AuditService();

// تسجيل إنشاء سجل
auditService.log({
  table_name: 'dentists',
  record_id: newDentist.id,
  action: 'CREATE',
  new_values: newDentist,
  notes: 'تم إنشاء طبيب جديد'
});

// تسجيل تحديث سجل
auditService.log({
  table_name: 'dentists',
  record_id: dentist.id,
  action: 'UPDATE',
  old_values: oldDentist,
  new_values: updatedDentist,
});

// تسجيل حذف سجل
auditService.log({
  table_name: 'dentists',
  record_id: dentist.id,
  action: 'DELETE',
  old_values: dentist,
});
```

### الحصول على السجلات

```typescript
// الحصول على تاريخ سجل معين
const history = auditService.getRecordHistory('dentists', dentistId);

// الحصول على آخر التغييرات
const recentLogs = auditService.getRecentLogs(50);

// الحصول على logs حسب نوع العملية
const deletions = auditService.getLogsByAction('DELETE', 100);

// الحصول على logs حسب التاريخ
const logs = auditService.getLogsByDateRange(startDate, endDate);
```

### تنظيف السجلات القديمة

```typescript
// حذف logs أقدم من 90 يوم
const deletedCount = auditService.clearOldLogs(90);
console.log(`تم حذف ${deletedCount} سجل قديم`);
```

---

## 🎨 Forms Best Practices

### Type Safety

```typescript
// ❌ خطأ - استخدام any
const handleSubmit = (data: any) => {
  onSubmit(data as any);
};

// ✅ صحيح - استخدام الأنواع الصحيحة
const handleSubmit = async (data: FormData) => {
  try {
    const submitData: CreateDentistDto = {
      name: data.name,
      gender: data.gender,
      // ... باقي الحقول
    };
    await onSubmit(submitData);
  } catch (error) {
    console.error('Form submission error:', error);
  }
};
```

### Error Handling

```typescript
// إضافة error handling في Form
const handleSubmit = async (data: FormData) => {
  try {
    await onSubmit(transformedData);
  } catch (error) {
    // سيتم التعامل مع الخطأ في المكون الأب
    console.error('Form submission error:', error);
  }
};
```

---

## 🔍 Database Queries

### مع Soft Delete

```typescript
// ✅ صحيح - يتجاهل المحذوفات تلقائياً
const dentists = dentistRepository.findAll();

// للحصول على جميع السجلات (بما فيها المحذوفة)
const allDentists = executeQuery<Dentist>(
  'SELECT * FROM dentists ORDER BY name ASC'
);

// للحصول على المحذوفات فقط
const deletedDentists = executeQuery<Dentist>(
  'SELECT * FROM dentists WHERE deleted_at IS NOT NULL ORDER BY name ASC'
);
```

### مع Indices

```typescript
// ✅ استخدام index للبحث
const results = executeQuery<Dentist>(
  'SELECT * FROM dentists WHERE name LIKE ? AND deleted_at IS NULL',
  [`%${searchTerm}%`]
);

// ✅ استخدام composite index
const orders = executeQuery<Order>(
  'SELECT * FROM orders WHERE dentist_id = ? AND status = ? AND deleted_at IS NULL',
  [dentistId, 'pending']
);
```

---

## ⚠️ Common Pitfalls

### 1. نسيان Soft Delete Filter

```typescript
// ❌ خطأ - لا يتجاهل المحذوفات
const dentist = executeQuery<Dentist>(
  'SELECT * FROM dentists WHERE id = ?',
  [id]
);

// ✅ صحيح
const dentist = executeQuery<Dentist>(
  'SELECT * FROM dentists WHERE id = ? AND deleted_at IS NULL',
  [id]
);
```

### 2. استخدام Hard Delete بدلاً من Soft Delete

```typescript
// ❌ خطأ - حذف نهائي
executeNonQuery('DELETE FROM dentists WHERE id = ?', [id]);

// ✅ صحيح - soft delete
dentistRepository.delete(id);
```

### 3. عدم استخدام Transactions

```typescript
// ❌ خطأ - عمليات منفصلة
orderRepository.create(orderDto);
paymentRepository.create(paymentDto); // قد يفشل

// ✅ صحيح - transaction
executeTransaction([
  { sql: 'INSERT INTO orders ...', params: [...] },
  { sql: 'INSERT INTO payments ...', params: [...] }
]);
```

---

## 🧪 Testing

### اختبار Soft Delete

```typescript
test('should soft delete dentist', () => {
  const dentist = dentistRepository.create(dentistDto);
  dentistRepository.delete(dentist.id);
  
  const found = dentistRepository.findById(dentist.id);
  expect(found).toBeNull();
  
  const restored = dentistRepository.restore(dentist.id);
  expect(restored).toBeDefined();
  expect(restored.id).toBe(dentist.id);
});
```

### اختبار Validation

```typescript
test('should validate phone number', () => {
  const invalidDto = { ...dentistDto, phone: '123' };
  
  expect(() => {
    createDentistSchema.parse(invalidDto);
  }).toThrow('رقم الهاتف يجب أن يكون 10 أرقام على الأقل');
});
```

---

## 📊 Performance Tips

### 1. استخدام Indices

```typescript
// ✅ يستخدم index
WHERE name LIKE ? AND deleted_at IS NULL

// ✅ يستخدم composite index
WHERE dentist_id = ? AND status = ? AND deleted_at IS NULL
```

### 2. تجنب N+1 Queries

```typescript
// ❌ خطأ - N+1 queries
orders.forEach(order => {
  const dentist = dentistRepository.findById(order.dentist_id);
});

// ✅ صحيح - join query
const ordersWithDentists = executeQuery(
  `SELECT o.*, d.name as dentist_name 
   FROM orders o 
   JOIN dentists d ON o.dentist_id = d.id 
   WHERE o.deleted_at IS NULL`
);
```

---

## 🔐 Security

### Input Sanitization

```typescript
// ✅ دائماً استخدم sanitization
const cleanInput = sanitizeString(userInput);
```

### SQL Injection Prevention

```typescript
// ✅ استخدم prepared statements
executeQuery('SELECT * FROM dentists WHERE name = ?', [name]);

// ❌ لا تستخدم string concatenation
executeQuery(`SELECT * FROM dentists WHERE name = '${name}'`);
```

---

## 📞 الدعم

للمزيد من المعلومات:
- راجع `.agent/notes.md`
- راجع `.agent/phase1-completion-summary.md`
- راجع الكود المصدري للأمثلة

---

**آخر تحديث:** 2025-01-11
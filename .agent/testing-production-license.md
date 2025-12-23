# تعليمات اختبار الترخيص في وضع الإنتاج

## الخطوة 1️⃣: تثبيت النسخة المبنية

بعد اكتمال البناء، ستجد المثبت في:
```
dist-electron\AgorraLab-v1.0.0-Setup.exe
```

1. قم بتشغيل المثبت
2. اتبع خطوات التثبيت
3. بعد التثبيت، سيكون التطبيق متاحاً على سطح المكتب وفي قائمة ابدأ

## الخطوة 2️⃣: اختبار تفعيل الترخيص

1. افتح التطبيق من سطح المكتب
2. سيظهر لك معالج التفعيل
3. انسخ **Hardware ID** المعروض
4. استخدم الأمر التالي لتوليد مفتاح الترخيص:
   ```powershell
   npm run generate-license
   ```
5. أدخل Hardware ID عندما يُطلب منك
6. انسخ مفتاح الترخيص المُولّد
7. أدخل المفتاح في التطبيق واضغط "تفعيل"

## الخطوة 3️⃣: التحقق من التفعيل

### اختبار فوري:
- يجب أن تظهر رسالة "تم التفعيل بنجاح"
- يجب أن ينقلك التطبيق إلى الصفحة الرئيسية

### اختبار الاستمرارية:
1. أغلق التطبيق **بالكامل**
2. أعد فتح التطبيق
3. يجب أن يفتح التطبيق مباشرة على الصفحة الرئيسية **دون** طلب التفعيل مرة أخرى

✅ **إذا فتح التطبيق مباشرة دون طلب التفعيل → المشكلة حُلّت!**
❌ **إذا طلب التفعيل مرة أخرى → المشكلة لا تزال موجودة**

## الخطوة 4️⃣: فحص ملفات Log (للتشخيص)

في حالة وجود مشكلة، افحص ملفات السجلات:

### موقع الملفات:
```
%APPDATA%\AgorraLab\logs\main.log
```

أو بالمسار الكامل:
```
C:\Users\<YourUsername>\AppData\Roaming\AgorraLab\logs\main.log
```

### الرسائل المطلوب البحث عنها:

#### ✅ في حالة النجاح، يجب أن ترى:
```
IPC: license:activate
[DB EXEC] Executing non-query: INSERT INTO license...
[DB EXEC] Non-query executed, now saving...
[DB SAVE] Starting save to: C:\Users\...\AppData\Roaming\AgorraLab\dental-lab.db
[DB SAVE] Exported data size: XXXXX bytes
[DB SAVE] Writing to temp file: ...
[DB SAVE] Temp file written. Size: XXXXX bytes
[DB SAVE] Creating backup: ...
[DB SAVE] Renaming temp file to: ...
[DB SAVE] ✅ Database saved successfully. Size: XXXXX bytes
[DB SAVE] ✅ Verification read successful. Size: XXXXX bytes
[DB EXEC] Save completed
New license inserted for hardware ID: B507-2C60-A583-34F9-...
License activated and verified successfully
License activation verification: { isActivated: true }
```

#### ❌ في حالة الفشل، ابحث عن:
```
[DB SAVE] ❌ Failed to save database
Failed to verify license activation
License activation verification: { isActivated: false }
```

## الخطوة 5️⃣: التحقق من قاعدة البيانات يدوياً

يمكنك فتح قاعدة البيانات مباشرة باستخدام SQLite viewer:

### موقع قاعدة البيانات:
```
%APPDATA%\AgorraLab\dental-lab.db
```

أو:
```
C:\Users\<YourUsername>\AppData\Roaming\AgorraLab\dental-lab.db
```

### استعلام للتحقق:
```sql
SELECT * FROM license WHERE hardware_id = 'B507-2C60-A583-34F9-A94B-F0ED-9FCE-5DDE';
```

يجب أن ترى:
- `is_active = 1`
- `license_key` موجود ومطابق لما أدخلته
- `activated_at` timestamp موجود

---

## ملاحظات إضافية:

### إذا كانت المشكلة لا تزال موجودة:

1. **فحص الأذونات (Permissions)**:
   - تأكد من أن المستخدم لديه أذونات الكتابة على مجلد AppData
   - جرّب تشغيل التطبيق كـ Administrator

2. **فحص برامج الحماية (Antivirus)**:
   - بعض برامج الحماية قد تمنع الكتابة على AppData
   - جرّب تعطيل الحماية مؤقتاً للاختبار

3. **فحص مساحة القرص**:
   - تأكد من وجود مساحة كافية على القرص C:\

4. **فحص ملفات النظام**:
   - تحقق من وجود:
     - `dental-lab.db`
     - `dental-lab.db.backup`
     - `dental-lab.db.tmp` (يجب ألا يكون موجوداً بعد الحفظ الناجح)

---

## أمثلة Log للمقارنة:

### Log ناجح (Development - يعمل):
```
[1] 13:40:10.122 > IPC: license:activate
[1] 13:40:10.130 > New license inserted for hardware ID: B507-2C60-A583-34F9-A94B-F0ED-9FCE-5DDE
[1] 13:40:10.132 > License activated and verified successfully
[1] 13:40:10.133 > License activation verification: { isActivated: true }
```

### Log فاشل (Production - المشكلة القديمة):
```
[1] 13:31:05.073 > IPC: license:activate
[1] 13:31:05.076 > License key generated for hardware ID: B507-2C60-A583-34F9-A94B-F0ED-9FCE-5DDE
[1] 13:31:05.081 > Database saved successfully
[1] 13:31:05.085 > License activated successfully for hardware ID: B507-2C60-A583-34F9-A94B-F0ED-9FCE-5DDE
[1] 13:31:06.611 > IPC: license:isActivated
[NO RESULT - Returns false]
```

---

## الخلاصة:

التحسينات المطبقة:
1. ✅ Atomic file operations (temp → rename)
2. ✅ Enhanced logging لكل خطوة
3. ✅ Verification read بعد الحفظ
4. ✅ Double save + wait strategy
5. ✅ Async support في handlers
6. ✅ Force write flag

إذا نجح الاختبار → المشكلة حُلّت! 🎉
إذا فشل → نحتاج فحص الـ logs وتحليل السبب الجذري.
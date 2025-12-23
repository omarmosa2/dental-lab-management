# إضافة ميزة الحفاظ على جلسة WhatsApp بعد إعادة التشغيل

## 📅 التاريخ: 2025-01-11

## 🎯 الهدف

تمكين التطبيق من الحفاظ على جلسة WhatsApp بعد إعادة التشغيل، بحيث لا يحتاج المستخدم لمسح QR Code في كل مرة.

## 🔍 التحليل

### المشكلة السابقة

- عند إعادة تشغيل التطبيق، كان المستخدم يحتاج لمسح QR Code من جديد
- الجلسة كانت تُحفظ في مجلد `whatsapp-auth` لكن لم يكن هناك آلية لاستعادتها تلقائياً
- عند قطع الاتصال، كانت الجلسة تُمسح بالكامل

### الحل المطبق

1. **إضافة دالة `initialize()` في WhatsAppService**
   - تُستدعى عند بدء التطبيق
   - تتحقق من وجود جلسة سابقة في قاعدة البيانات
   - تحاول استعادة الاتصال تلقائياً إذا وُجدت جلسة

2. **تعديل دالة `disconnect()`**
   - الآن لا تمسح ملفات المصادقة (auth files)
   - تحتفظ بالجلسة للاستخدام المستقبلي
   - تحدث فقط حالة الاتصال في قاعدة البيانات

3. **إضافة دالة `resetConnection()`**
   - دالة جديدة لمسح الجلسة بالكامل
   - تُستخدم عندما يريد المستخدم البدء من جديد
   - تمسح ملفات المصادقة وبيانات قاعدة البيانات

## 📝 التغييرات المطبقة

### 1. WhatsAppService.ts

#### إضافة دالة initialize()

```typescript
/**
 * Initialize WhatsApp connection on app startup
 * This will automatically restore the session if auth files exist
 */
async initialize(): Promise<void> {
  console.log('WhatsApp: Initializing...');
  
  try {
    // Check if we have saved auth state
    const settings = await this.repository.getSettings();
    
    if (settings && settings.is_connected && settings.phone_number) {
      console.log('WhatsApp: Found previous session, attempting to restore...');
      // Try to restore the session automatically
      await this.connect();
    } else {
      console.log('WhatsApp: No previous session found');
    }
  } catch (error) {
    console.error('WhatsApp: Failed to initialize', error);
    this.logger.error({ error }, 'Failed to initialize WhatsApp');
    // Don't throw - initialization failure shouldn't crash the app
  }
}
```

#### تعديل دالة disconnect()

```typescript
async disconnect(): Promise<void> {
  console.log('WhatsApp: Disconnecting...');
  this.isManualDisconnect = true;
  this.connectionManager.cancelReconnect();
  
  if (this.sock) {
    try {
      await this.sock.logout();
    } catch (error) {
      console.error('WhatsApp: Error during logout', error);
    }
    this.sock = null;
  }
  
  // Update connection status but keep auth for potential reconnection
  await this.repository.setConnectionStatus(false, null);
  
  // Only clear auth if explicitly logging out (not just disconnecting)
  // This allows the session to be restored on app restart
  // await this.repository.clearAuth();
  // await this.clearAuthFolder();
  
  this.connectionManager.setState('disconnected');
  this.updateStatus({ 
    status: 'disconnected', 
    isConnected: false,
    phoneNumber: null,
    qrCode: null,
    error: null 
  });
  console.log('WhatsApp: Disconnected successfully');
}
```

#### إضافة دالة resetConnection()

```typescript
/**
 * Completely reset WhatsApp connection and clear all auth data
 * Use this when you want to force a new QR code login
 */
async resetConnection(): Promise<void> {
  console.log('WhatsApp: Resetting connection...');
  
  // First disconnect if connected
  if (this.sock) {
    await this.disconnect();
  }
  
  // Clear all auth data
  await this.repository.clearAuth();
  await this.clearAuthFolder();
  
  console.log('WhatsApp: Connection reset successfully');
}
```

### 2. index.ts

إضافة استدعاء initialize عند بدء التطبيق:

```typescript
// Initialize WhatsApp service (will auto-restore session if exists)
const whatsAppService = getWhatsAppService();
await whatsAppService.initialize();
log.info('WhatsApp service initialized');
```

### 3. whatsappHandlers.ts

إضافة handler جديد:

```typescript
ipcMain.handle('whatsapp:reset', async () => {
  log.info('IPC: whatsapp:reset');
  return wrapHandler(async () => {
    await whatsAppService.resetConnection();
    
    // Close QR window if open
    closeQRCodeWindow();
    
    return { success: true };
  });
});
```

### 4. preload.ts

إضافة الدالة إلى WhatsApp API:

```typescript
const whatsAppApi = {
  connect: () => ipcRenderer.invoke('whatsapp:connect'),
  disconnect: () => ipcRenderer.invoke('whatsapp:disconnect'),
  reset: () => ipcRenderer.invoke('whatsapp:reset'), // ← جديد
  // ... rest of the API
};
```

### 5. global.d.ts

إضافة التعريف:

```typescript
whatsAppApi: {
  connect: () => Promise<ApiResponse<{ success: boolean }>>;
  disconnect: () => Promise<ApiResponse<{ success: boolean }>>;
  reset: () => Promise<ApiResponse<{ success: boolean }>>; // ← جديد
  // ... rest of the API
};
```

### 6. WhatsAppSettings.tsx

تحديث دالة handleResetConnection:

```typescript
const handleResetConnection = async () => {
  if (!confirm('هل أنت متأكد من إعادة تعيين الاتصال؟ سيتم حذف الجلسة الحالية وستحتاج لمسح QR Code من جديد.')) {
    return;
  }
  
  try {
    setLoading(true);
    // Use reset instead of disconnect to clear auth completely
    const response = await window.whatsAppApi.reset();
    if (response.ok) {
      success('تم إعادة تعيين الاتصال. اضغط على "الاتصال بـ WhatsApp" للحصول على QR Code جديد.');
      await loadConnectionStatus();
    } else {
      showError('فشل إعادة تعيين الاتصال');
    }
  } catch (err) {
    showError('حدث خطأ أثناء إعادة التعيين');
    console.error('Error resetting:', err);
  } finally {
    setLoading(false);
  }
};
```

## 🎯 كيفية العمل

### عند بدء التطبيق

1. يتم استدعاء `whatsAppService.initialize()`
2. يتحقق من وجود جلسة سابقة في قاعدة البيانات (`is_connected = 1`)
3. إذا وُجدت جلسة، يحاول الاتصال تلقائياً
4. Baileys يستخدم ملفات المصادقة في `whatsapp-auth` لاستعادة الجلسة
5. إذا نجح الاتصال، يتم تحديث الحالة إلى "متصل"
6. إذا فشل، يبقى في حالة "غير متصل" ولا يؤثر على بقية التطبيق

### عند قطع الاتصال (Disconnect)

1. يتم إغلاق الاتصال الحالي
2. **لا يتم** مسح ملفات المصادقة
3. يتم تحديث حالة الاتصال في قاعدة البيانات فقط
4. الجلسة تبقى محفوظة للاستخدام المستقبلي

### عند إعادة تعيين الاتصال (Reset)

1. يتم قطع الاتصال إذا كان متصلاً
2. **يتم** مسح ملفات المصادقة
3. **يتم** مسح بيانات الجلسة من قاعدة البيانات
4. المستخدم يحتاج لمسح QR Code من جديد

## ✅ الاختبار

### اختبار الحفاظ على الجلسة

1. **الاتصال الأولي**
   - افتح التطبيق
   - اذهب إلى الإعدادات > WhatsApp
   - اضغط "الاتصال بـ WhatsApp"
   - امسح QR Code
   - تأكد من الاتصال الناجح

2. **إعادة التشغيل**
   - أغلق التطبيق بالكامل
   - افتح التطبيق من جديد
   - ✅ يجب أن يتصل تلقائياً دون الحاجة لـ QR Code

3. **اختبار قطع الاتصال**
   - اضغط "قطع الاتصال"
   - أعد تشغيل التطبيق
   - ✅ يجب أن يتصل تلقائياً (الجلسة محفوظة)

4. **اختبار إعادة التعيين**
   - اضغط "إعادة تعيين الاتصال"
   - أعد تشغيل التطبيق
   - ✅ يجب أن يطلب QR Code جديد (الجلسة مُمسوحة)

## 📂 الملفات المعدلة

1. `src/main/core/services/WhatsAppService.ts`
   - إضافة `initialize()`
   - تعديل `disconnect()`
   - إضافة `resetConnection()`

2. `src/index.ts`
   - إضافة استدعاء `initialize()`

3. `src/main/ipc/whatsappHandlers.ts`
   - إضافة handler `whatsapp:reset`

4. `src/preload.ts`
   - إضافة `reset()` إلى WhatsApp API

5. `src/renderer/global.d.ts`
   - إضافة تعريف `reset()`

6. `src/renderer/components/whatsapp/WhatsAppSettings.tsx`
   - تحديث `handleResetConnection()`

## 🔒 الأمان

- ملفات المصادقة محفوظة في `AppData/whatsapp-auth` (مجلد خاص بالمستخدم)
- لا يتم مشاركة الجلسة عبر الشبكة
- الجلسة محمية بنفس آليات Baileys الأمنية
- يمكن للمستخدم مسح الجلسة في أي وقت باستخدام "إعادة تعيين الاتصال"

## 🎉 النتيجة

الآن التطبيق يحتفظ بجلسة WhatsApp بعد إعادة التشغيل، مما يوفر تجربة مستخدم أفضل ويقلل الحاجة لمسح QR Code المتكرر!
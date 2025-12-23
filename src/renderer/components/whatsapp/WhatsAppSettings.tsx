// WhatsAppSettings.tsx
// WhatsApp settings component for Settings page
// Created: 2025-01-11

import { useState, useEffect } from 'react';
import { MessageCircle, Power, QrCode, CheckCircle, XCircle, Loader, Phone, MessageSquare, Settings as SettingsIcon, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../hooks/useToast';
import type { WhatsAppSettings, WhatsAppConnectionStatus } from '../../../shared/types/whatsapp.types';

export function WhatsAppSettings() {
  const { success, error: showError } = useToast();
  
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<WhatsAppConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  // Form state
  const [sendOnComplete, setSendOnComplete] = useState(true);
  const [sendOnReady, setSendOnReady] = useState(true);
  const [sendOnDelivered, setSendOnDelivered] = useState(true);
  const [templateComplete, setTemplateComplete] = useState('');
  const [templateReady, setTemplateReady] = useState('');
  const [templateDelivered, setTemplateDelivered] = useState('');

  useEffect(() => {
    loadSettings();
    loadConnectionStatus();
    
    // Poll connection status every 5 seconds
    const interval = setInterval(loadConnectionStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      const response = await window.whatsAppApi.getSettings();
      if (response.ok && response.data) {
        setSettings(response.data);
        setSendOnComplete(!!response.data.send_on_order_complete);
        setSendOnReady(!!response.data.send_on_order_ready);
        setSendOnDelivered(!!response.data.send_on_order_delivered);
        setTemplateComplete(response.data.message_template_complete);
        setTemplateReady(response.data.message_template_ready);
        setTemplateDelivered(response.data.message_template_delivered);
      }
    } catch (err) {
      console.error('Error loading WhatsApp settings:', err);
    }
  };

  const loadConnectionStatus = async () => {
    try {
      const response = await window.whatsAppApi.getStatus();
      if (response.ok && response.data) {
        setConnectionStatus(response.data);
      }
    } catch (err) {
      console.error('Error loading connection status:', err);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const response = await window.whatsAppApi.connect();
      if (response.ok) {
        success('جاري الاتصال بـ WhatsApp... انتظر ظهور رمز QR');
        // Status will be updated by polling - QR will show in same page
      } else {
        showError(response.error?.message || 'فشل الاتصال بـ WhatsApp');
      }
    } catch (err) {
      showError('حدث خطأ أثناء الاتصال');
      console.error('Error connecting:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('هل تريد قطع الاتصال؟ سيتم الحفاظ على الجلسة ويمكنك إعادة الاتصال لاحقاً بدون مسح QR Code.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await window.whatsAppApi.disconnect();
      if (response.ok) {
        success('تم قطع الاتصال بنجاح. الجلسة محفوظة ويمكنك إعادة الاتصال لاحقاً.');
        await loadConnectionStatus();
      } else {
        showError(response.error?.message || 'فشل قطع الاتصال');
      }
    } catch (err) {
      showError('حدث خطأ أثناء قطع الاتصال');
      console.error('Error disconnecting:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetConnection = async () => {
    if (!confirm('هل أنت متأكد من إعادة تعيين الاتصال؟\n\nسيتم:\n• حذف الجلسة الحالية نهائياً\n• الحاجة لمسح QR Code من جديد\n• إيقاف جميع محاولات الاتصال الحالية\n\nهذا الإجراء مفيد إذا كنت تواجه مشاكل في الاتصال.')) {
      return;
    }
    
    try {
      setLoading(true);
      // Use reset to clear auth completely
      const response = await window.whatsAppApi.reset();
      if (response.ok) {
        success('تم إعادة تعيين الاتصال بنجاح! يمكنك الآن الضغط على "الاتصال بـ WhatsApp" للحصول على QR Code جديد.');
        await loadConnectionStatus();
      } else {
        showError(response.error?.message || 'فشل إعادة تعيين الاتصال');
      }
    } catch (err) {
      showError('حدث خطأ أثناء إعادة التعيين');
      console.error('Error resetting:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const response = await window.whatsAppApi.updateSettings({
        send_on_order_complete: sendOnComplete ? 1 : 0,
        send_on_order_ready: sendOnReady ? 1 : 0,
        send_on_order_delivered: sendOnDelivered ? 1 : 0,
        message_template_complete: templateComplete,
        message_template_ready: templateReady,
        message_template_delivered: templateDelivered,
      });

      if (response.ok) {
        success('تم حفظ الإعدادات بنجاح');
        await loadSettings();
      } else {
        showError('فشل حفظ الإعدادات');
      }
    } catch (err) {
      showError('حدث خطأ أثناء حفظ الإعدادات');
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!connectionStatus) return null;

    const statusConfig = {
      connected: { icon: CheckCircle, text: 'متصل', color: 'text-green-600 dark:text-green-400' },
      connecting: { icon: Loader, text: 'جاري الاتصال...', color: 'text-blue-600 dark:text-blue-400' },
      qr_ready: { icon: QrCode, text: 'في انتظار المسح', color: 'text-yellow-600 dark:text-yellow-400' },
      disconnected: { icon: XCircle, text: 'غير متصل', color: 'text-gray-600 dark:text-gray-400' },
      error: { icon: XCircle, text: 'خطأ', color: 'text-red-600 dark:text-red-400' },
    };

    const config = statusConfig[connectionStatus.status] || statusConfig.disconnected;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 ${config.color}`}>
        <Icon size={20} className={connectionStatus.status === 'connecting' ? 'animate-spin' : ''} />
        <span className="font-medium">{config.text}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <MessageCircle className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">حالة الاتصال</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">إدارة اتصال WhatsApp</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {connectionStatus?.phoneNumber && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <Phone size={16} />
            <span>الرقم المتصل: {connectionStatus.phoneNumber}</span>
          </div>
        )}

        {/* QR Code Display - Show in same page */}
        {connectionStatus?.status === 'qr_ready' && connectionStatus.qrCode && (
          <div className="mt-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                  <QrCode className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    رمز QR جاهز للمسح
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    امسح الرمز من تطبيق WhatsApp على هاتفك
                  </p>
                </div>
              </div>

              {/* QR Code Image */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-4 border-dashed border-green-300 dark:border-green-700 inline-block">
                <img 
                  src={connectionStatus.qrCode} 
                  alt="QR Code للاتصال بـ WhatsApp" 
                  className="w-64 h-64 mx-auto rounded-lg"
                />
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-right">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm flex items-center gap-2">
                  <MessageCircle size={16} />
                  خطوات الربط:
                </h4>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                  <li>افتح تطبيق WhatsApp على هاتفك</li>
                  <li>اذهب إلى <strong>الإعدادات {'>'} الأجهزة المرتبطة</strong></li>
                  <li>اضغط على <strong>"ربط جهاز"</strong></li>
                  <li>وجّه كاميرا هاتفك نحو هذا الرمز</li>
                </ol>
              </div>

              {/* Auto refresh notice */}
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                <Clock size={14} />
                سيتم تحديث الرمز تلقائياً كل 60 ثانية
              </p>
            </div>
          </div>
        )}

        {/* Connection Buttons */}
        <div className="flex gap-3 mt-4">
          {!connectionStatus?.isConnected ? (
            <>
              <Button
                onClick={handleConnect}
                disabled={connecting || connectionStatus?.status === 'connecting'}
                variant="primary"
                className="flex-1"
              >
                {connecting ? (
                  <>
                    <Loader size={18} className="animate-spin ml-2" />
                    جاري الاتصال...
                  </>
                ) : (
                  <>
                    <Power size={18} className="ml-2" />
                    الاتصال بـ WhatsApp
                  </>
                )}
              </Button>
              {(connectionStatus?.status === 'connecting' || connectionStatus?.status === 'error') && (
                <Button
                  onClick={handleResetConnection}
                  disabled={loading}
                  variant="outline"
                  title="إعادة تعيين الاتصال بالكامل"
                >
                  إعادة تعيين
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={handleDisconnect}
                disabled={loading}
                variant="danger"
                className="flex-1"
              >
                <Power size={18} className="ml-2" />
                قطع الاتصال
              </Button>
              <Button
                onClick={handleResetConnection}
                disabled={loading}
                variant="outline"
                title="حذف الجلسة والبدء من جديد"
              >
                إعادة تعيين
              </Button>
            </>
          )}
        </div>

        {connectionStatus?.error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">خطأ في الاتصال</p>
                <p className="text-sm text-red-700 dark:text-red-300">{connectionStatus.error}</p>
                {connectionStatus.status === 'error' && (
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
                    <p className="text-xs text-red-600 dark:text-red-400 mb-2">الحلول المقترحة:</p>
                    <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                      <li>اضغط على "إعادة تعيين" لحذف الجلسة القديمة</li>
                      <li>تأكد من اتصال الإنترنت</li>
                      <li>اضغط على "الاتصال بـ WhatsApp" لبدء جلسة جديدة</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <MessageSquare className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">إعدادات الإشعارات</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">تخصيص رسائل WhatsApp التلقائية</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Order Complete */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendOnComplete}
                onChange={(e) => setSendOnComplete(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="font-medium text-gray-900 dark:text-white">إرسال عند اكتمال الطلب</span>
            </label>
            {sendOnComplete && (
              <textarea
                value={templateComplete}
                onChange={(e) => setTemplateComplete(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="قالب الرسالة..."
              />
            )}
          </div>

          {/* Order Ready */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendOnReady}
                onChange={(e) => setSendOnReady(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="font-medium text-gray-900 dark:text-white">إرسال عند جاهزية الطلب</span>
            </label>
            {sendOnReady && (
              <textarea
                value={templateReady}
                onChange={(e) => setTemplateReady(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="قالب الرسالة..."
              />
            )}
          </div>

          {/* Order Delivered */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendOnDelivered}
                onChange={(e) => setSendOnDelivered(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="font-medium text-gray-900 dark:text-white">إرسال عند تسليم الطلب</span>
            </label>
            {sendOnDelivered && (
              <textarea
                value={templateDelivered}
                onChange={(e) => setTemplateDelivered(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="قالب الرسالة..."
              />
            )}
          </div>

          {/* Template Variables Help */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">المتغيرات المتاحة:</p>
            <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <p><code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{dentist_name}'}</code> - اسم الطبيب</p>
              <p><code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{order_number}'}</code> - رقم الطلب</p>
              <p><code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{case_type}'}</code> - نوع العمل</p>
              <p><code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{tooth_numbers}'}</code> - أرقام الأسنان</p>
              <p><code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">{'{material}'}</code> - المادة المستخدمة</p>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            disabled={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin ml-2" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <SettingsIcon size={18} className="ml-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
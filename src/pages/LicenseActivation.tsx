import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Key, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Mail,
  Smartphone
} from 'lucide-react';
import { useToast } from '../renderer/hooks/useToast';

export default function LicenseActivation() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [hardwareId, setHardwareId] = useState<string>('');
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    checkLicenseStatus();
    loadHardwareId();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      setChecking(true);
      const licenseApi = await import('../renderer/utils/waitForLicenseApi').then(m => m.waitForLicenseApi()).catch(() => null);
      if (!licenseApi) throw new Error('licenseApi not available');

      const result = await licenseApi.isActivated();
      
      if (result.ok && result.data) {
        setIsActivated(true);
        // Redirect to menu after a short delay
        setTimeout(() => {
          navigate('/menu');
        }, 2000);
      } else {
        setIsActivated(false);
      }
    } catch (err) {
      console.error('Failed to check license status:', err);
      setIsActivated(false);
    } finally {
      setChecking(false);
    }
  };

  const loadHardwareId = async () => {
    try {
      const licenseApi = await import('../renderer/utils/waitForLicenseApi').then(m => m.waitForLicenseApi()).catch(() => null);
      if (!licenseApi) throw new Error('licenseApi not available');

      const result = await licenseApi.getHardwareId();
      if (result.ok && result.data) {
        setHardwareId(result.data);
      }
    } catch (err) {
      console.error('Failed to load hardware ID:', err);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(hardwareId);
      setCopied(true);
      success('تم نسخ معرف الجهاز');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      showError('فشل نسخ المعرف');
    }
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      showError('يرجى إدخال كود التفعيل');
      return;
    }

    try {
      setLoading(true);
      const result = await window.licenseApi.activate(licenseKey.trim());
      
      if (result.ok) {
        success('تم تفعيل التطبيق بنجاح!');
        setIsActivated(true);
        setTimeout(() => {
          navigate('/menu');
        }, 1500);
      } else {
        showError(result.error?.message || 'فشل تفعيل التطبيق');
      }
    } catch (err) {
      console.error('Activation error:', err);
      showError('حدث خطأ أثناء التفعيل');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-theme-primary mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">جارٍ التحقق من حالة الترخيص...</p>
        </div>
      </div>
    );
  }

  if (isActivated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-success-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              تم تفعيل التطبيق بنجاح!
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              جارٍ التوجيه إلى القائمة الرئيسية...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-theme-primary/10 mb-4">
            <Shield className="w-10 h-10 text-theme-primary" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            تفعيل التطبيق
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            يرجى إدخال كود التفعيل لاستخدام التطبيق
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-2xl">
          {/* Hardware ID Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              <Smartphone className="w-4 h-4 inline-block ml-2" />
              معرف الجهاز (Hardware ID)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <code className="text-sm font-mono text-neutral-900 dark:text-neutral-100 break-all">
                  {hardwareId || 'جارٍ التحميل...'}
                </code>
              </div>
              <button
                onClick={copyToClipboard}
                className="btn-base btn-outline px-4 py-4 flex-shrink-0"
                title="نسخ المعرف"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5 text-success-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="mt-3 p-4 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-info-600 dark:text-info-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-info-800 dark:text-info-200">
                  <p className="font-medium mb-1">خطوات التفعيل:</p>
                  <ol className="list-decimal list-inside space-y-1 text-right">
                    <li>انسخ معرف الجهاز أعلاه</li>
                    <li>أرسل المعرف للمطور عبر البريد الإلكتروني أو WhatsApp</li>
                    <li>ستحصل على كود تفعيل خاص بجهازك</li>
                    <li>أدخل كود التفعيل في الحقل أدناه</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* License Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              <Key className="w-4 h-4 inline-block ml-2" />
              كود التفعيل
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              placeholder="LICENSE-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="input-base w-full text-center text-lg font-mono tracking-wider"
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleActivate();
                }
              }}
            />
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 text-center">
              أدخل كود التفعيل الذي حصلت عليه من المطور
            </p>
          </div>

          {/* Activate Button */}
          <button
            onClick={handleActivate}
            disabled={loading || !licenseKey.trim()}
            className="w-full btn-base btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                جارٍ التفعيل...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 ml-2" />
                تفعيل التطبيق
              </>
            )}
          </button>

          {/* Contact Info */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <Mail className="w-4 h-4" />
              <span>للحصول على كود التفعيل، تواصل مع المطور</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            نظام إدارة مختبر الأسنان © 2025
          </p>
        </div>
      </div>
    </div>
  );
}


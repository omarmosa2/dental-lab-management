import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Copy,
  Cpu
} from 'lucide-react';
import { useToast } from '../renderer/hooks/useToast';

export default function LicenseActivation() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  const [activationKey, setActivationKey] = useState('');
  const [machineId, setMachineId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isActivated, setIsActivated] = useState(false);
  const [loadingMachineId, setLoadingMachineId] = useState(true);

  useEffect(() => {
    checkLicenseStatus();
    fetchMachineId();
  }, []);

  const fetchMachineId = async () => {
    try {
      setLoadingMachineId(true);
      const result = await window.licenseApi.getMachineId();
      
      if (result.ok && result.data) {
        setMachineId(result.data);
      }
    } catch (err) {
      console.error('Failed to get machine ID:', err);
      showError('فشل الحصول على معرف الجهاز');
    } finally {
      setLoadingMachineId(false);
    }
  };

  const checkLicenseStatus = async () => {
    try {
      setChecking(true);
      const result = await window.licenseApi.isActivated();
      
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

  const handleCopyMachineId = () => {
    if (machineId) {
      navigator.clipboard.writeText(machineId);
      success('تم نسخ معرف الجهاز');
    }
  };

  const handleActivate = async () => {
    if (!activationKey.trim()) {
      showError('يرجى إدخال مفتاح التفعيل');
      return;
    }

    try {
      setLoading(true);
      const result = await window.licenseApi.activate(activationKey.trim());
      
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
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-theme-primary/10 mb-4">
            <Shield className="w-10 h-10 text-theme-primary" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            تفعيل التطبيق
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            يرجى إدخال مفتاح التفعيل الخاص بهذا الجهاز
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-2xl">
          {/* Machine ID Section */}
          <div className="mb-6">
            <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border-2 border-warning-300 dark:border-warning-700 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <Cpu className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-warning-900 dark:text-warning-100 mb-1">
                    معرف الجهاز (Machine ID)
                  </p>
                  <p className="text-sm text-warning-800 dark:text-warning-200 mb-2">
                    قم بنسخ معرف الجهاز وإرساله للحصول على مفتاح الترخيص
                  </p>
                </div>
              </div>
              
              {loadingMachineId ? (
                <div className="flex items-center justify-center p-3 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                  <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                  <span className="mr-2 text-sm text-neutral-500">جارٍ الحصول على معرف الجهاز...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-mono text-sm break-all">
                    {machineId || 'غير متاح'}
                  </div>
                  <button
                    onClick={handleCopyMachineId}
                    className="btn-base btn-secondary px-4 py-3 flex-shrink-0"
                    title="نسخ معرف الجهاز"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mb-6">
            <div className="p-4 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-info-600 dark:text-info-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-info-800 dark:text-info-200">
                  <p className="font-medium mb-1">معلومات هامة:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>كل مفتاح تفعيل مرتبط بجهاز واحد فقط</li>
                    <li>لا يمكن استخدام نفس المفتاح على جهاز آخر</li>
                    <li>احتفظ بمفتاح التفعيل في مكان آمن</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* License Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              <Key className="w-4 h-4 inline-block ml-2" />
              مفتاح الترخيص (License Key)
            </label>
            <input
              type="text"
              value={activationKey}
              onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="input-base w-full text-center text-sm font-mono tracking-wide"
              disabled={loading || loadingMachineId}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading && !loadingMachineId) {
                  handleActivate();
                }
              }}
            />
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 text-center">
              أدخل مفتاح الترخيص الخاص بهذا الجهاز فقط
            </p>
          </div>

          {/* Activate Button */}
          <button
            onClick={handleActivate}
            disabled={loading || !activationKey.trim() || loadingMachineId}
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
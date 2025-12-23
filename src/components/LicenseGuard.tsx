import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import LicenseActivation from '../pages/LicenseActivation';
import { Loader2 } from 'lucide-react';

interface LicenseGuardProps {
  children: ReactNode;
}

export default function LicenseGuard({ children }: LicenseGuardProps) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    try {
      // Wait for the preload API to be available (prevents "undefined" errors)
      const licenseApi = await import('../renderer/utils/waitForLicenseApi').then(m => m.waitForLicenseApi()).catch(() => null);

      if (!licenseApi) {
        throw new Error('licenseApi not available');
      }

      const result = await licenseApi.isActivated();

      if (result.ok && result.data) {
        setIsActivated(true);
      } else {
        setIsActivated(false);
        // Redirect to license activation if not activated
        navigate('/license', { replace: true });
      }
    } catch (err) {
      console.error('Failed to check license:', err);
      setIsActivated(false);
      navigate('/license', { replace: true });
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-theme-primary mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">جارٍ التحقق من الترخيص...</p>
        </div>
      </div>
    );
  }

  if (!isActivated) {
    return <LicenseActivation />;
  }

  return <>{children}</>;
}


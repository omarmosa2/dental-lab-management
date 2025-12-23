// QRCodePage.tsx
// Dedicated page for displaying WhatsApp QR Code in a separate window
// Created: 2025-01-11

import { useState, useEffect } from 'react';
import { QrCode, Loader, CheckCircle, XCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { WhatsAppConnectionStatus } from '../../shared/types/whatsapp.types';

export default function QRCodePage() {
  const [status, setStatus] = useState<WhatsAppConnectionStatus | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Load initial status
    loadStatus();

    // Poll status every 2 seconds
    const statusInterval = setInterval(loadStatus, 2000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  // Auto-close window when connected
  useEffect(() => {
    if (status?.isConnected) {
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  }, [status?.isConnected]);

  const loadStatus = async () => {
    try {
      if (!window.whatsAppApi) {
        console.warn('whatsAppApi is not available in this window yet');
        return;
      }

      const response = await window.whatsAppApi.getStatus();
      if (response.ok && response.data) {
        setStatus(response.data);
      }
    } catch (err) {
      console.error('Error loading status:', err);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setCountdown(60);
      
      // Reset connection completely to get fresh QR
      await window.whatsAppApi.reset();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await window.whatsAppApi.connect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadStatus();
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClose = () => {
    window.close();
  };

  const getStatusDisplay = () => {
    if (!status) {
      return {
        icon: Loader,
        text: 'جاري التحميل...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      };
    }

    switch (status.status) {
      case 'connected':
        return {
          icon: CheckCircle,
          text: 'تم الاتصال بنجاح!',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'connecting':
        return {
          icon: Loader,
          text: 'جاري الاتصال...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'qr_ready':
        return {
          icon: QrCode,
          text: 'امسح الكود من هاتفك',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        };
      case 'error':
        return {
          icon: XCircle,
          text: 'حدث خطأ في الاتصال',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          icon: XCircle,
          text: 'غير متصل',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white relative">
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <QrCode size={28} />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold">الاتصال بـ WhatsApp</h1>
                <p className="text-sm text-green-100">مسح رمز الاستجابة السريعة</p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`${statusDisplay.bgColor} p-4 border-b border-gray-200 dark:border-gray-700`}>
            <div className={`flex items-center justify-center gap-2 ${statusDisplay.color}`}>
              <StatusIcon 
                size={20} 
                className={status?.status === 'connecting' ? 'animate-spin' : ''} 
              />
              <span className="font-semibold">{statusDisplay.text}</span>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="p-8">
            {status?.status === 'qr_ready' && status.qrCode ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border-4 border-dashed border-gray-300 dark:border-gray-600 flex justify-center">
                  <img 
                    src={status.qrCode} 
                    alt="QR Code" 
                    className="w-72 h-72 rounded-lg"
                  />
                </div>
                
                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
                    كيفية المسح:
                  </h3>
                  <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>افتح WhatsApp على هاتفك</li>
                    <li>اذهب إلى الإعدادات {'>'} الأجهزة المرتبطة</li>
                    <li>اضغط على "ربط جهاز"</li>
                    <li>وجّه كاميرا هاتفك نحو هذا الرمز</li>
                  </ol>
                </div>

                {/* Countdown */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <RefreshCw size={16} />
                  <span>الكود صالح لمدة {countdown} ثانية</span>
                </div>
              </div>
            ) : status?.status === 'connecting' ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader size={48} className="text-blue-600 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">جاري الاتصال بخوادم WhatsApp...</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">قد يستغرق هذا بضع ثوانٍ</p>
              </div>
            ) : status?.status === 'connected' ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">تم الاتصال بنجاح!</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">سيتم إغلاق هذه النافذة تلقائياً...</p>
              </div>
            ) : status?.status === 'error' ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <XCircle size={48} className="text-red-600 dark:text-red-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">حدث خطأ في الاتصال</p>
                {status.error && (
                  <p className="text-sm text-red-600 dark:text-red-400 text-center px-4">
                    {status.error}
                  </p>
                )}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">الحلول المقترحة:</p>
                  <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>أغلق هذه النافذة</li>
                    <li>اضغط على "إعادة تعيين الاتصال" من الإعدادات</li>
                    <li>اضغط على "الاتصال بـ WhatsApp" من جديد</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <QrCode size={48} className="text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">في انتظار رمز QR...</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || status?.status === 'connecting'}
              variant="outline"
              className="flex-1"
            >
              {isRefreshing ? (
                <>
                  <Loader size={18} className="animate-spin ml-2" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <RefreshCw size={18} className="ml-2" />
                  تحديث الكود
                </>
              )}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              <X size={18} className="ml-2" />
              إغلاق
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
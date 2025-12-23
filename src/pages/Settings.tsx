import { useState, useEffect } from 'react';
import { 
  Lock, 
  Bell, 
  Database, 
  Palette,
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Info,
  Save,
  Moon,
  Sun,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Clock,
  HardDrive,
  MessageCircle,
  Sparkles,
  FileDown,
  FileUp,
  Plus,
  Edit,
  Check
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeConfig } from '../shared/types/theme.types';
import { ThemeCustomizer } from '../renderer/components/settings/ThemeCustomizer';
import { useToast } from '../renderer/hooks/useToast';
import { Button } from '../renderer/components/ui/Button';
import { Modal } from '../renderer/components/ui/Modal';
import { Tabs } from '../renderer/components/ui/Tabs';
import { ToastContainer } from '../renderer/components/ui/Toast';
import { WhatsAppSettings } from '../renderer/components/whatsapp/WhatsAppSettings';
import type { AppSettings, BackupInfo } from '../preload';

export default function Settings() {
  const { 
    theme, 
    toggleTheme, 
    currentTheme, 
    availableThemes, 
    customThemes,
    setTheme: setThemeById,
    exportTheme,
    deleteCustomTheme,
  } = useTheme();
  const { toasts, removeToast, success, error: showError } = useToast();
  
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeConfig | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [appName, setAppName] = useState('نظام إدارة مختبر الأسنان');
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupIntervalHours, setBackupIntervalHours] = useState(24);
  const [notifications, setNotifications] = useState(true);

  // Backups state
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [selectedBackupId, setSelectedBackupId] = useState<number | null>(null);
  const [backupDirectory, setBackupDirectory] = useState('');
  const [backupStats, setBackupStats] = useState<{
    totalBackups: number;
    totalSize: number;
    lastBackup?: number;
  } | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadBackups();
    loadBackupDirectory();
    loadBackupStats();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await window.api.settings.get();
      if (response.ok && response.data) {
        setSettings(response.data);
        setAppName(response.data.app_name);
        setAutoBackup(response.data.auto_backup);
        setBackupIntervalHours(response.data.backup_interval_hours || 24);
        setNotifications(response.data.notifications);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const loadBackups = async () => {
    try {
      setLoadingBackups(true);
      const response = await window.api.backup.list();
      if (response.ok && response.data) {
        setBackups(response.data);
      }
      // Also reload stats
      await loadBackupStats();
    } catch (err) {
      console.error('Error loading backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const loadBackupStats = async () => {
    try {
      const response = await window.api.backup.getStats();
      if (response.ok && response.data) {
        setBackupStats(response.data);
      }
    } catch (err) {
      console.error('Error loading backup stats:', err);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadBackupDirectory = async () => {
    try {
      const response = await window.api.backup.getDirectory();
      if (response.ok && response.data) {
        setBackupDirectory(response.data);
      }
    } catch (err) {
      console.error('Error loading backup directory:', err);
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      const response = await window.api.backup.create();
      
      if (response.ok) {
        success('تم إنشاء النسخة الاحتياطية بنجاح');
        setIsBackupModalOpen(false);
        await loadBackups();
        await loadSettings();
      } else {
        showError(response.error?.message || 'فشل إنشاء النسخة الاحتياطية');
      }
    } catch (err) {
      showError('فشل إنشاء النسخة الاحتياطية');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackupId) {
      showError('الرجاء اختيار نسخة احتياطية للاستعادة');
      return;
    }

    try {
      setLoading(true);
      const response = await window.api.backup.restore(selectedBackupId);
      
      if (response.ok) {
        success('تم استعادة البيانات بنجاح! يمكنك الآن رؤية البيانات المستعادة.');
        setIsRestoreModalOpen(false);
        
        // Reload the backups list and settings to show updated data
        await loadBackups();
        await loadSettings();
      } else {
        showError(response.error?.message || 'فشل استعادة البيانات');
      }
    } catch (err) {
      showError('فشل استعادة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
      return;
    }

    try {
      const response = await window.api.backup.delete(backupId);
      
      if (response.ok) {
        success('تم حذف النسخة الاحتياطية بنجاح');
        await loadBackups();
      } else {
        showError(response.error?.message || 'فشل حذف النسخة الاحتياطية');
      }
    } catch (err) {
      showError('فشل حذف النسخة الاحتياطية');
    }
  };

  const handleClearData = async () => {
    try {
      setLoading(true);
      const response = await window.api.backup.clearData();
      
      if (response.ok) {
        success('تم مسح البيانات بنجاح');
        setIsClearModalOpen(false);
        
        // Reload app after 1 second
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        showError(response.error?.message || 'فشل مسح البيانات');
      }
    } catch (err) {
      showError('فشل مسح البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeBackupDirectory = async () => {
    try {
      const response = await window.api.backup.setDirectory();
      if (response.ok && response.data) {
        setBackupDirectory(response.data);
        success('تم تغيير مجلد النسخ الاحتياطية بنجاح');
        
        // Update settings with new directory
        await window.api.settings.update({
          backup_directory: response.data,
        });
        
        await loadSettings();
      }
    } catch (err) {
      showError('فشل تغيير مجلد النسخ الاحتياطية');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await window.api.settings.update({
        app_name: appName,
        theme: theme,
        auto_backup: autoBackup,
        backup_interval_hours: backupIntervalHours,
        notifications: notifications,
      });

      if (response.ok) {
        success('تم حفظ الإعدادات بنجاح');
        await loadSettings();
        
        // Trigger auto backup check after settings update
        await window.api.backup.checkAutoBackup();
      } else {
        showError(response.error?.message || 'فشل حفظ الإعدادات');
      }
    } catch (err) {
      showError('فشل حفظ الإعدادات');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' بايت';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' كيلوبايت';
    return (bytes / (1024 * 1024)).toFixed(2) + ' ميجابايت';
  };

  const formatBackupDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div>
        <h1 className="heading-1 text-neutral-900 dark:text-white mb-2">
          الإعدادات
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          إدارة إعدادات التطبيق وقاعدة البيانات
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'general', label: 'الإعدادات العامة', icon: <SettingsIcon size={18} /> },
          { id: 'appearance', label: 'المظهر والثيمات', icon: <Palette size={18} /> },
          { id: 'database', label: 'قاعدة البيانات', icon: <Database size={18} /> },
          { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} /> },
          { id: 'about', label: 'حول التطبيق', icon: <Info size={18} /> },
        ]}
        defaultTab="general"
      >
        {(activeTab) => (
          <>
            {/* Appearance & Themes Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Theme Customizer Modal */}
                {isThemeCustomizerOpen && (
                  <Modal
                    isOpen={isThemeCustomizerOpen}
                    onClose={() => {
                      setIsThemeCustomizerOpen(false);
                      setEditingTheme(undefined);
                    }}
                    title={editingTheme ? "تعديل الثيم" : "إنشاء ثيم مخصص"}
                    size="xl"
                  >
                    <ThemeCustomizer
                      baseTheme={!editingTheme ? currentTheme : undefined}
                      editingTheme={editingTheme}
                      onSave={(theme) => {
                        success(`تم ${editingTheme ? 'تحديث' : 'حفظ'} الثيم "${theme.name}" بنجاح`);
                        setIsThemeCustomizerOpen(false);
                        setEditingTheme(undefined);
                      }}
                      onCancel={() => {
                        setIsThemeCustomizerOpen(false);
                        setEditingTheme(undefined);
                      }}
                    />
                  </Modal>
                )}

                {/* Current Theme */}
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                        <Palette className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="heading-4 text-neutral-900 dark:text-white">
                          الثيم الحالي
                        </h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {currentTheme.name}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => {
                      setEditingTheme(undefined);
                      setIsThemeCustomizerOpen(true);
                    }}>
                      <Plus className="w-4 h-4" />
                      <span>إنشاء ثيم مخصص</span>
                    </Button>
                  </div>

                  {/* Current Theme Preview */}
                  <div className="p-6 rounded-lg border-2 border-theme-primary">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                          {currentTheme.name}
                        </h3>
                        {currentTheme.description && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {currentTheme.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                          {currentTheme.mode === 'light' ? 'فاتح' : currentTheme.mode === 'dark' ? 'داكن' : 'تباين عالي'}
                        </span>
                        <Check className="w-5 h-5 text-success-600" />
                      </div>
                    </div>

                    {/* Color Palette Preview */}
                    <div className="grid grid-cols-6 gap-2">
                      <div className="space-y-1">
                        <div className="w-full h-12 rounded" style={{ backgroundColor: currentTheme.colors.primary }} />
                        <p className="text-xs text-neutral-600">أساسي</p>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-12 rounded" style={{ backgroundColor: currentTheme.colors.secondary }} />
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">ثانوي</p>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-12 rounded" style={{ backgroundColor: currentTheme.colors.success }} />
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">نجاح</p>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-12 rounded" style={{ backgroundColor: currentTheme.colors.warning }} />
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">تحذير</p>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-12 rounded" style={{ backgroundColor: currentTheme.colors.error }} />
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">خطأ</p>
                      </div>
                      <div className="space-y-1">
                        <div className="w-full h-12 rounded" style={{ backgroundColor: currentTheme.colors.accent }} />
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">مميز</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      {currentTheme.customizable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTheme(currentTheme);
                            setIsThemeCustomizerOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                          <span>تعديل</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          exportTheme(currentTheme.id);
                          success('تم تصدير الثيم بنجاح');
                        }}
                      >
                        <FileDown className="w-4 h-4" />
                        <span>تصدير</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pre-built Themes */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    الثيمات الجاهزة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableThemes.filter(t => t.id !== currentTheme.id).map((themeOption) => (
                      <button
                        key={themeOption.id}
                        onClick={() => {
                          setThemeById(themeOption.id);
                          success(`تم تطبيق ثيم "${themeOption.name}"`);
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-right hover:shadow-md ${
                          currentTheme.id === themeOption.id
                            ? 'border-theme-primary'
                            : 'border-neutral-200 hover:border-theme-primary'
                        }`}
                        style={currentTheme.id === themeOption.id ? { backgroundColor: 'var(--color-primary)', opacity: 0.05 } : undefined}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-neutral-900 dark:text-white">
                              {themeOption.name}
                            </h4>
                            {themeOption.description && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                {themeOption.description}
                              </p>
                            )}
                          </div>
                          {currentTheme.id === themeOption.id && (
                            <Check className="w-5 h-5 text-theme-primary flex-shrink-0" />
                          )}
                        </div>
                        
                        {/* Mini Color Palette */}
                        <div className="flex gap-1">
                          <div className="w-8 h-8 rounded" style={{ backgroundColor: themeOption.colors.primary }} />
                          <div className="w-8 h-8 rounded" style={{ backgroundColor: themeOption.colors.secondary }} />
                          <div className="w-8 h-8 rounded" style={{ backgroundColor: themeOption.colors.success }} />
                          <div className="w-8 h-8 rounded" style={{ backgroundColor: themeOption.colors.accent }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Themes */}
                {customThemes.length > 0 && (
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        الثيمات المخصصة
                      </h3>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {customThemes.length} ثيم
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customThemes.map((themeOption) => (
                        <div
                          key={themeOption.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            currentTheme.id === themeOption.id
                              ? 'border-theme-primary'
                              : 'border-neutral-200'
                          }`}
                          style={currentTheme.id === themeOption.id ? { backgroundColor: 'var(--color-primary)', opacity: 0.05 } : undefined}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-neutral-900 dark:text-white">
                                {themeOption.name}
                              </h4>
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                {new Date(themeOption.createdAt || 0).toLocaleDateString('ar-EG')}
                              </p>
                            </div>
                            {currentTheme.id === themeOption.id && (
                              <Check className="w-5 h-5 text-theme-primary flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Mini Color Palette */}
                          <div className="flex gap-1 mb-3">
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: themeOption.colors.primary }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: themeOption.colors.secondary }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: themeOption.colors.success }} />
                            <div className="w-8 h-8 rounded" style={{ backgroundColor: themeOption.colors.accent }} />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setThemeById(themeOption.id);
                                success(`تم تطبيق ثيم "${themeOption.name}"`);
                              }}
                              className="flex-1"
                            >
                              تطبيق
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTheme(themeOption);
                                setIsThemeCustomizerOpen(true);
                              }}
                              title="تعديل الثيم"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`هل تريد حذف ثيم "${themeOption.name}"؟`)) {
                                  deleteCustomTheme(themeOption.id);
                                  success('تم حذف الثيم');
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* General Settings Tab */}
            {activeTab === 'general' && (
     
                
        <div className="card">
         <div className="flex items-center gap-3 mb-6">
           <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
             <SettingsIcon className="w-6 h-6" />
           </div>
           <h2 className="heading-4 text-neutral-900 dark:text-white">
            الإعدادات العامة
          </h2>
        </div>

        <div className="space-y-6">
          {/* App Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              اسم التطبيق
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:ring-2 focus:ring-theme-primary focus:border-transparent"
              placeholder="اسم التطبيق"
            />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              ) : (
                <Sun className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              )}
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  الوضع الداكن
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  تفعيل الوضع الداكن للتطبيق
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-theme-primary' : 'bg-neutral-300'
              }`}
              role="switch"
              aria-checked={theme === 'dark'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                  theme === 'dark' ? '-translate-x-6' : '-translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Auto Backup */}
          <div className="space-y-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    النسخ الاحتياطي التلقائي
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    إنشاء نسخة احتياطية تلقائياً
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAutoBackup(!autoBackup)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 ${
                  autoBackup ? 'bg-theme-primary' : 'bg-neutral-300'
                }`}
                role="switch"
                aria-checked={autoBackup}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    autoBackup ? '-translate-x-6' : '-translate-x-1'
                  }`}
                />
              </button>
            </div>

            {autoBackup && (
              <div className="pt-3 border-t border-neutral-200">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Clock className="w-4 h-4 inline ml-1" />
                  الفترة الزمنية للنسخ الاحتياطي
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={backupIntervalHours}
                    onChange={(e) => setBackupIntervalHours(Number(e.target.value))}
                    className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 focus:ring-2 focus:ring-theme-primary focus:border-transparent"
                  >
                    <option value={0.0333}>كل 2 دقائق (للتجربة)</option>
                    <option value={1}>كل ساعة</option>
                    <option value={6}>كل 6 ساعات</option>
                    <option value={12}>كل 12 ساعة</option>
                    <option value={24}>كل 24 ساعة (يومياً)</option>
                    <option value={48}>كل 48 ساعة (يومين)</option>
                    <option value={72}>كل 72 ساعة (3 أيام)</option>
                    <option value={168}>كل أسبوع</option>
                  </select>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  {backupIntervalHours < 1 
                    ? `سيتم إنشاء نسخة احتياطية تلقائياً كل ${Math.round(backupIntervalHours * 60)} دقيقة`
                    : `سيتم إنشاء نسخة احتياطية تلقائياً كل ${backupIntervalHours} ساعة`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  الإشعارات
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  تفعيل إشعارات التطبيق
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 ${
                notifications ? 'bg-theme-primary' : 'bg-neutral-300'
              }`}
              role="switch"
              aria-checked={notifications}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                  notifications ? '-translate-x-6' : '-translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <Button variant="primary" onClick={handleSaveSettings}>
              <Save size={18} />
              حفظ الإعدادات
            </Button>
          </div>
        </div>
                </div>
           
            )}

            {/* Database Management Tab */}
            {activeTab === 'database' && (
              <>
                <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-secondary-100 dark:bg-secondary-900/30">
            <Database className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
          </div>
          <h2 className="heading-4 text-neutral-900 dark:text-white">
            إدارة قاعدة البيانات
          </h2>
        </div>

        <div className="space-y-4">
          {/* Info Alert */}
          <div className="border border-theme-border rounded-lg p-4 bg-theme-primary/5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-theme-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-theme-primary mb-1">
                  معلومات مهمة
                </h4>
                <p className="text-sm text-theme-secondary mb-3">
                  يُنصح بإنشاء نسخة احتياطية من قاعدة البيانات بشكل دوري لحماية بياناتك من الفقدان.
                </p>
                {backupDirectory && (
                  <div className="flex items-center justify-between gap-3 p-3 bg-white/50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FolderOpen size={16} className="text-theme-secondary flex-shrink-0" />
                      <p className="text-xs text-theme-secondary truncate">
                        {backupDirectory}
                      </p>
                    </div>
                    <button
                      onClick={handleChangeBackupDirectory}
                      className="btn-base btn-outline btn-sm flex-shrink-0"
                    >
                      <FolderOpen size={14} />
                      تغيير المجلد
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Backup Button */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-success-600 dark:text-success-400" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  نسخ احتياطي
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  إنشاء نسخة احتياطية من قاعدة البيانات
                </p>
              </div>
            </div>
            <Button variant="success" onClick={() => setIsBackupModalOpen(true)}>
              <Download size={18} />
              نسخ احتياطي
            </Button>
          </div>

          {/* Clear Data Button */}
          <div className="flex items-center justify-between p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-error-600 dark:text-error-400" />
              <div>
                <p className="font-medium text-error-900 dark:text-error-100">
                  مسح البيانات
                </p>
                <p className="text-sm text-error-700 dark:text-error-300">
                  حذف جميع البيانات من قاعدة البيانات (لا يمكن التراجع)
                </p>
              </div>
            </div>
            <Button variant="danger" onClick={() => setIsClearModalOpen(true)}>
              <Trash2 size={18} />
              مسح البيانات
            </Button>
          </div>
        </div>
                </div>

                {/* Backup Statistics */}
                {backupStats && (
                  <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                        <Info className="w-6 h-6" />
                      </div>
                      <h2 className="heading-4 text-neutral-900 dark:text-white">
                        إحصائيات النسخ الاحتياطي
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Total Backups */}
                      <div className="p-4 rounded-lg border border-theme-border" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.05 }}>
                        <div className="flex items-center gap-3 mb-2">
                          <HardDrive className="w-5 h-5 text-theme-primary" />
                          <p className="text-sm font-medium text-theme-primary">
                            عدد النسخ
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-theme-primary">
                          {backupStats.totalBackups}
                        </p>
                      </div>

                      {/* Total Size */}
                      <div className="p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg border border-secondary-200 dark:border-secondary-800">
                        <div className="flex items-center gap-3 mb-2">
                          <Database className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                          <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                            الحجم الكلي
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                          {formatBytes(backupStats.totalSize)}
                        </p>
                      </div>

                      {/* Newest Backup */}
                      <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
                          <p className="text-sm font-medium text-success-700 dark:text-success-300">
                            أحدث نسخة
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-success-900 dark:text-success-100">
                          {backupStats.lastBackup 
                            ? formatDate(backupStats.lastBackup)
                            : 'لا توجد نسخ'}
                        </p>
                      </div>

                      {/* Total Backups */}
                      <div className="p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800">
                        <div className="flex items-center gap-3 mb-2">
                          <Database className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                          <p className="text-sm font-medium text-accent-700 dark:text-accent-300">
                            عدد النسخ
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-accent-900 dark:text-accent-100">
                          {backupStats.totalBackups} نسخة
                        </p>
                      </div>
                    </div>

                    {/* Backup Info */}
                    <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        <Info className="w-4 h-4 inline ml-2" />
                        يتم الاحتفاظ بآخر 7 نسخ احتياطية تلقائياً. النسخ الأقدم يتم حذفها تلقائياً.
                      </p>
                    </div>
                  </div>
                )}

                {/* Backups List */}
                <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-accent-100 dark:bg-accent-900/30">
              <HardDrive className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            </div>
            <h2 className="heading-4 text-neutral-900 dark:text-white">
              النسخ الاحتياطية المحفوظة ({backups.length})
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={loadBackups} disabled={loadingBackups}>
            {loadingBackups ? 'جاري التحديث...' : 'تحديث'}
          </Button>
        </div>

        {loadingBackups ? (
          <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
            جاري تحميل النسخ الاحتياطية...
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
            لا توجد نسخ احتياطية محفوظة
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {backup.filename}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(backup.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive size={14} />
                      {formatFileSize(backup.size)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedBackupId(backup.id);
                      setIsRestoreModalOpen(true);
                    }}
                  >
                    <Upload size={16} />
                    استعادة
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteBackup(backup.id)}
                  >
                    <Trash2 size={16} />
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
                </div>
              </>
            )}

            {/* WhatsApp Tab */}
            {activeTab === 'whatsapp' && (
              <WhatsAppSettings />
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-accent-100 dark:bg-accent-900/30">
            <Info className="w-6 h-6 text-accent-600 dark:text-accent-400" />
          </div>
          <h2 className="heading-4 text-neutral-900 dark:text-white">
            حول التطبيق
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-400">اسم التطبيق</span>
            <span className="font-semibold text-neutral-900 dark:text-white">{appName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-400">الإصدار</span>
            <span className="font-semibold text-neutral-900 dark:text-white">1.0.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-400">تاريخ الإصدار</span>
            <span className="font-semibold text-neutral-900 dark:text-white">2025-01-09</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600 dark:text-neutral-400">التقنيات المستخدمة</span>
            <span className="font-semibold text-neutral-900 dark:text-white">Electron + React + TypeScript</span>
          </div>
        </div>
              </div>
            )}
          </>
        )}
      </Tabs>

      {/* Modals */}
      <Modal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        title="نسخ احتياطي لقاعدة البيانات"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-success-900 dark:text-success-100 mb-1">
                  نسخ احتياطي آمن
                </h4>
                <p className="text-sm text-success-700 dark:text-success-300">
                  سيتم إنشاء نسخة احتياطية كاملة من قاعدة البيانات وحفظها في مجلد المستندات.
                </p>
              </div>
            </div>
          </div>

          <p className="text-neutral-700 dark:text-neutral-300">
            هل تريد المتابعة في إنشاء نسخة احتياطية؟
          </p>

          <div className="flex gap-3">
            <Button 
              variant="success" 
              onClick={handleBackup} 
              disabled={loading}
              className="flex-1"
            >
              <Download size={18} />
              {loading ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsBackupModalOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="استعادة قاعدة البيانات"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-warning-900 dark:text-warning-100 mb-1">
                  تحذير
                </h4>
                <p className="text-sm text-warning-700 dark:text-warning-300">
                  سيتم استبدال جميع البيانات الحالية بالبيانات من النسخة الاحتياطية. سيتم إنشاء نسخة احتياطية طارئة من البيانات الحالية تلقائياً.
                </p>
              </div>
            </div>
          </div>

          <p className="text-neutral-700 dark:text-neutral-300 font-semibold">
            هل أنت متأكد من استعادة البيانات من النسخة الاحتياطية المحددة؟
          </p>

          <div className="flex gap-3">
            <Button 
              variant="primary" 
              onClick={handleRestore} 
              disabled={loading}
              className="flex-1"
            >
              <Upload size={18} />
              {loading ? 'جاري الاستعادة...' : 'استعادة'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsRestoreModalOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="تأكيد مسح البيانات"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-error-900 dark:text-error-100 mb-1">
                  تحذير: عملية خطيرة
                </h4>
                <p className="text-sm text-error-700 dark:text-error-300">
                  سيتم حذف جميع البيانات نهائياً ولا يمكن التراجع عن هذه العملية. تأكد من إنشاء نسخة احتياطية أولاً.
                </p>
              </div>
            </div>
          </div>

          <p className="text-neutral-700 dark:text-neutral-300 font-semibold">
            هل أنت متأكد تماماً من مسح جميع البيانات؟
          </p>

          <div className="flex gap-3">
            <Button 
              variant="danger" 
              onClick={handleClearData} 
              disabled={loading}
              className="flex-1"
            >
              <Trash2 size={18} />
              {loading ? 'جاري المسح...' : 'نعم، امسح البيانات'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsClearModalOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
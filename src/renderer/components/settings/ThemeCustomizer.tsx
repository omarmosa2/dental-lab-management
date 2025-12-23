import { useState, useEffect } from 'react';
import { Palette, Save, RotateCcw, Eye, EyeOff, AlertCircle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { ThemeConfig, ThemeColors } from '../../../shared/types/theme.types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ThemeCustomizerProps {
  baseTheme?: ThemeConfig;
  editingTheme?: ThemeConfig;
  onSave?: (theme: ThemeConfig) => void;
  onCancel?: () => void;
}

export function ThemeCustomizer({ baseTheme, editingTheme, onSave, onCancel }: ThemeCustomizerProps) {
  const { currentTheme, saveCustomTheme } = useTheme();
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [colors, setColors] = useState<ThemeColors>(
    editingTheme?.colors || baseTheme?.colors || currentTheme.colors
  );
  const [previewMode, setPreviewMode] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const isEditing = !!editingTheme;

  useEffect(() => {
    if (editingTheme) {
      setColors(editingTheme.colors);
      setThemeName(editingTheme.name);
      setThemeDescription(editingTheme.description || '');
    } else if (baseTheme) {
      setColors(baseTheme.colors);
      setThemeName(baseTheme.name + ' (نسخة معدلة)');
      setThemeDescription('نسخة معدلة من ' + baseTheme.name);
    }
  }, [baseTheme, editingTheme]);

  useEffect(() => {
    if (editingTheme) {
      const changed = JSON.stringify(colors) !== JSON.stringify(editingTheme.colors) ||
                     themeName !== editingTheme.name ||
                     themeDescription !== (editingTheme.description || '');
      setHasChanges(changed);
    } else {
      setHasChanges(true);
    }
  }, [colors, themeName, themeDescription, editingTheme]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (editingTheme) {
      setColors(editingTheme.colors);
      setThemeName(editingTheme.name);
      setThemeDescription(editingTheme.description || '');
    } else if (baseTheme) {
      setColors(baseTheme.colors);
      setThemeName(baseTheme.name + ' (نسخة معدلة)');
      setThemeDescription('نسخة معدلة من ' + baseTheme.name);
    } else {
      setColors(currentTheme.colors);
      setThemeName('');
      setThemeDescription('');
    }
    setHasChanges(false);
  };

  const getLuminance = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const getContrastRatio = (color1: string, color2: string): number => {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const validateTheme = (): boolean => {
    const errors: string[] = [];

    if (!themeName.trim()) {
      errors.push('يجب إدخال اسم للثيم');
    }

    const primaryContrast = getContrastRatio(colors.primary, colors.background);
    if (primaryContrast < 3) {
      errors.push('التباين بين اللون الأساسي والخلفية منخفض جداً');
    }

    const textContrast = getContrastRatio(colors.textPrimary, colors.background);
    if (textContrast < 4.5) {
      errors.push('التباين بين النص والخلفية منخفض جداً');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateTheme()) {
      return;
    }

    const newTheme: ThemeConfig = {
      id: editingTheme?.id || `custom-${Date.now()}`,
      name: themeName.trim(),
      nameEn: editingTheme?.nameEn || `Custom Theme ${Date.now()}`,
      description: themeDescription.trim() || 'ثيم مخصص من إنشاء المستخدم',
      mode: editingTheme?.mode || baseTheme?.mode || currentTheme.mode,
      colors,
      customizable: true,
      author: editingTheme?.author || 'User',
      createdAt: editingTheme?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await saveCustomTheme(newTheme);
    onSave?.(newTheme);
  };

  const autoGenerateColor = (baseColor: string, type: 'hover' | 'active'): string => {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const factor = type === 'hover' ? 0.9 : 0.8;
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const colorSections = [
    {
      title: 'الألوان الأساسية',
      icon: Palette,
      description: 'الألوان الرئيسية المستخدمة في الأزرار والعناصر التفاعلية',
      colors: [
        { key: 'primary' as const, label: 'اللون الأساسي', description: 'اللون الرئيسي للتطبيق', required: true },
        { key: 'primaryHover' as const, label: 'أساسي (تحويم)', description: 'عند تحريك الماوس', autoGenerate: true },
        { key: 'primaryActive' as const, label: 'أساسي (نشط)', description: 'عند النقر', autoGenerate: true },
      ],
    },
    {
      title: 'الألوان الثانوية',
      icon: Sparkles,
      description: 'الألوان المساعدة للعناصر الثانوية',
      colors: [
        { key: 'secondary' as const, label: 'اللون الثانوي', description: 'للعناصر الأقل أهمية', required: true },
        { key: 'secondaryHover' as const, label: 'ثانوي (تحويم)', description: 'عند التحويم', autoGenerate: true },
        { key: 'secondaryActive' as const, label: 'ثانوي (نشط)', description: 'عند النقر', autoGenerate: true },
      ],
    },
    {
      title: 'ألوان الحالة',
      icon: AlertCircle,
      description: 'الألوان المستخدمة للإشعارات والرسائل',
      colors: [
        { key: 'success' as const, label: 'نجاح ✓', description: 'للعمليات الناجحة', required: true },
        { key: 'warning' as const, label: 'تحذير ⚠', description: 'للتحذيرات', required: true },
        { key: 'error' as const, label: 'خطأ ✗', description: 'للأخطاء', required: true },
        { key: 'info' as const, label: 'معلومات ℹ', description: 'للمعلومات', required: true },
      ],
    },
    {
      title: 'الخلفيات والأسطح',
      icon: Eye,
      description: 'ألوان الخلفيات والبطاقات',
      colors: [
        { key: 'background' as const, label: 'الخلفية الرئيسية', description: 'خلفية التطبيق', required: true },
        { key: 'surface' as const, label: 'سطح البطاقات', description: 'البطاقات والنوافذ', required: true },
        { key: 'surfaceHover' as const, label: 'سطح (تحويم)', description: 'عند التحويم', autoGenerate: true },
        { key: 'border' as const, label: 'الحدود', description: 'حدود العناصر', required: true },
      ],
    },
    {
      title: 'ألوان النص',
      icon: Info,
      description: 'الألوان المستخدمة للنصوص',
      colors: [
        { key: 'textPrimary' as const, label: 'نص أساسي', description: 'النص الرئيسي', required: true },
        { key: 'textSecondary' as const, label: 'نص ثانوي', description: 'النص الأقل أهمية', required: false },
        { key: 'textMuted' as const, label: 'نص خافت', description: 'النص الخافت', required: false },
      ],
    },
    {
      title: 'ألوان خاصة',
      icon: Sparkles,
      description: 'ألوان إضافية للتمييز',
      colors: [
        { key: 'accent' as const, label: 'لون مميز', description: 'للتمييز', required: false },
        { key: 'highlight' as const, label: 'تسليط الضوء', description: 'للتسليط', required: false },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
      <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-900 z-10 pb-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg text-white bg-gradient-to-br from-purple-500 to-pink-500">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {isEditing ? 'تعديل الثيم' : 'إنشاء ثيم مخصص'}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {isEditing ? 'قم بتعديل الثيم الحالي' : 'قم بإنشاء ثيم جديد حسب تفضيلاتك'}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{previewMode ? 'إخفاء المعاينة' : 'إظهار المعاينة'}</span>
        </Button>
      </div>

      {validationErrors.length > 0 && (
        <div className="p-4 rounded-lg bg-error-50 border border-error-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-error-900 mb-2">
                يرجى تصحيح الأخطاء التالية:
              </h4>
              <ul className="text-sm text-error-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            اسم الثيم <span className="text-error-600">*</span>
          </label>
          <Input
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            placeholder="مثال: ثيم الأزرق الاحترافي"
            className="text-lg font-semibold"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            اختر اسماً واضحاً يعبر عن الثيم
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            الوصف (اختياري)
          </label>
          <Input
            value={themeDescription}
            onChange={(e) => setThemeDescription(e.target.value)}
            placeholder="وصف مختصر للثيم..."
          />
        </div>
      </div>

      <div className="space-y-6">
        {colorSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <div key={section.title} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <SectionIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {section.title}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {section.description}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-11">
                {section.colors.map((colorDef) => (
                  <div key={colorDef.key} className="space-y-2">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {colorDef.label}
                      {'required' in colorDef && colorDef.required && <span className="text-error-600 mr-1">*</span>}
                      {'autoGenerate' in colorDef && colorDef.autoGenerate && (
                        <span className="text-xs text-neutral-500 mr-2">(تلقائي)</span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colors[colorDef.key]}
                        onChange={(e) => handleColorChange(colorDef.key, e.target.value)}
                        className="w-12 h-10 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 cursor-pointer hover:border-theme-primary transition-colors"
                        title={colorDef.description}
                      />
                      <Input
                        value={colors[colorDef.key]}
                        onChange={(e) => handleColorChange(colorDef.key, e.target.value)}
                        placeholder="#000000"
                        className="flex-1 font-mono text-sm"
                      />
                      {'autoGenerate' in colorDef && colorDef.autoGenerate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const baseKey = colorDef.key.replace('Hover', '').replace('Active', '') as keyof ThemeColors;
                            const type = colorDef.key.includes('Hover') ? 'hover' : 'active';
                            const generated = autoGenerateColor(colors[baseKey], type);
                            handleColorChange(colorDef.key, generated);
                          }}
                          title="توليد تلقائي"
                        >
                          <Sparkles className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {colorDef.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {previewMode && (
        <div className="p-6 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 space-y-6 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-theme-primary" />
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
              معاينة حية للثيم
            </h4>
          </div>
          
          <div>
            <h5 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              لوحة الألوان الكاملة
            </h5>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div
                    className="w-full h-16 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    style={{ backgroundColor: value }}
                    title={`${key}: ${value}`}
                  />
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate text-center">
                    {key}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              عناصر الواجهة التجريبية
            </h5>
            
            <div className="flex flex-wrap gap-3">
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-all"
                style={{ backgroundColor: colors.primary }}
              >
                زر أساسي
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-all"
                style={{ backgroundColor: colors.secondary }}
              >
                زر ثانوي
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-all"
                style={{ backgroundColor: colors.success }}
              >
                نجاح
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-all"
                style={{ backgroundColor: colors.warning }}
              >
                تحذير
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-all"
                style={{ backgroundColor: colors.error }}
              >
                خطأ
              </button>
            </div>

            <div
              className="p-4 rounded-lg shadow-sm border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary
              }}
            >
              <h6 className="font-semibold mb-2" style={{ color: colors.textPrimary }}>
                عنوان البطاقة
              </h6>
              <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                هذا نص تجريبي لعرض كيف ستبدو البطاقات في الثيم الجديد.
              </p>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded text-sm font-medium text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  إجراء
                </button>
                <button
                  className="px-3 py-1.5 rounded text-sm font-medium"
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.textSecondary,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 space-y-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-700 dark:text-neutral-300 space-y-2">
                <p className="font-medium">فحص إمكانية الوصول (WCAG)</p>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>التباين: نص أساسي / خلفية</span>
                    <span className="font-mono font-semibold">
                      {getContrastRatio(colors.textPrimary, colors.background).toFixed(2)}:1
                      {getContrastRatio(colors.textPrimary, colors.background) >= 4.5 ? (
                        <CheckCircle2 className="w-4 h-4 text-success-600 inline mr-1" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-error-600 inline mr-1" />
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>التباين: لون أساسي / خلفية</span>
                    <span className="font-mono font-semibold">
                      {getContrastRatio(colors.primary, colors.background).toFixed(2)}:1
                      {getContrastRatio(colors.primary, colors.background) >= 3 ? (
                        <CheckCircle2 className="w-4 h-4 text-success-600 inline mr-1" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-error-600 inline mr-1" />
                      )}
                    </span>
                  </div>
                </div>
                
                <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-2">
                  الحد الأدنى الموصى به: 4.5:1 للنص العادي، 3:1 للعناصر الكبيرة
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700 sticky bottom-0 bg-white dark:bg-neutral-900">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges}
        >
          <RotateCcw className="w-4 h-4" />
          <span>إعادة تعيين</span>
        </Button>
        
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          )}
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || !themeName.trim()}
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'حفظ التعديلات' : 'حفظ الثيم'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
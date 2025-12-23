import { useState, useEffect } from 'react';
import { 
  Palette, 
  Save, 
  Eye, 
  Sparkles, 
  Sun, 
  Moon,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { ThemeConfig } from '../../../shared/types/theme.types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  generateThemeColors, 
  convertToDarkTheme, 
  convertToLightTheme,
  getContrastRatio,
  type GeneratedThemeColors 
} from '../../../utils/colorGenerator';

interface AdvancedThemeEditorProps {
  baseTheme?: ThemeConfig;
  editingTheme?: ThemeConfig;
  onSave?: (lightTheme: ThemeConfig, darkTheme: ThemeConfig) => void;
  onCancel?: () => void;
}

type ColorKey = keyof GeneratedThemeColors;

export function AdvancedThemeEditor({ 
  baseTheme, 
  editingTheme, 
  onSave, 
  onCancel 
}: AdvancedThemeEditorProps) {
  const { currentTheme, saveCustomTheme } = useTheme();
  
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [selectedMode, setSelectedMode] = useState<'light' | 'dark'>('light');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#7c3aed');
  const [backgroundColor, setBackgroundColor] = useState('#f9fafb');
  const [generatedColors, setGeneratedColors] = useState<GeneratedThemeColors | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const isEditing = !!editingTheme;
  
  useEffect(() => {
    if (editingTheme) {
      setThemeName(editingTheme.name);
      setThemeDescription(editingTheme.description || '');
      setSelectedMode(editingTheme.mode === 'dark' ? 'dark' : 'light');
      setPrimaryColor(editingTheme.colors.primary);
      setSecondaryColor(editingTheme.colors.secondary);
      setBackgroundColor(editingTheme.colors.background);
      setGeneratedColors(editingTheme.colors as GeneratedThemeColors);
    } else if (baseTheme) {
      setThemeName('ثيم مخصص');
      setThemeDescription('ثيم جديد من إنشائي');
      setSelectedMode(baseTheme.mode === 'dark' ? 'dark' : 'light');
      setPrimaryColor(baseTheme.colors.primary);
      setSecondaryColor(baseTheme.colors.secondary);
      setBackgroundColor(baseTheme.colors.background);
    }
  }, [baseTheme, editingTheme]);
  
  useEffect(() => {
    if (!primaryColor || !secondaryColor || !backgroundColor) return;
    
    const newColors = generateThemeColors({
      primary: primaryColor,
      secondary: secondaryColor,
      background: backgroundColor,
      mode: selectedMode,
    });
    
    setGeneratedColors(newColors);
    setHasChanges(true);
  }, [primaryColor, secondaryColor, backgroundColor, selectedMode]);
  
  const handleColorChange = (key: ColorKey, value: string) => {
    if (generatedColors) {
      setGeneratedColors({ ...generatedColors, [key]: value });
      setHasChanges(true);
    }
  };
  
  const handleRegenerateColors = () => {
    if (!primaryColor || !secondaryColor || !backgroundColor) return;
    
    const newColors = generateThemeColors({
      primary: primaryColor,
      secondary: secondaryColor,
      background: backgroundColor,
      mode: selectedMode,
    });
    
    setGeneratedColors(newColors);
    setHasChanges(true);
  };
  
  const handleModeChange = (mode: 'light' | 'dark') => {
    setSelectedMode(mode);
    
    // Update background color based on mode
    if (mode === 'light') {
      setBackgroundColor('#f9fafb');
    } else {
      setBackgroundColor('#0f172a');
    }
  };
  
  const validateTheme = (): boolean => {
    const errors: string[] = [];
    
    if (!themeName.trim()) {
      errors.push('يجب إدخال اسم للثيم');
    }
    
    if (!generatedColors) {
      errors.push('يجب توليد الألوان أولاً');
      setValidationErrors(errors);
      return false;
    }
    
    const primaryContrast = getContrastRatio(generatedColors.primary, generatedColors.background);
    if (primaryContrast < 3) {
      errors.push('التباين بين اللون الأساسي والخلفية منخفض جداً (يجب أن يكون 3:1 على الأقل)');
    }
    
    const textContrast = getContrastRatio(generatedColors.textPrimary, generatedColors.background);
    if (textContrast < 4.5) {
      errors.push('تباين النص منخفض جداً (يجب أن يكون 4.5:1 على الأقل)');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleSave = async () => {
    if (!validateTheme() || !generatedColors) {
      return;
    }
    
    const timestamp = Date.now();
    
    const newTheme: ThemeConfig = {
      id: editingTheme?.id || `custom-${timestamp}`,
      name: themeName.trim(),
      nameEn: themeName.trim(),
      description: themeDescription.trim() || 'ثيم مخصص',
      mode: selectedMode,
      colors: generatedColors,
      customizable: true,
      author: 'User',
      createdAt: editingTheme?.createdAt || timestamp,
      updatedAt: timestamp,
    };
    
    await saveCustomTheme(newTheme);
    
    // For backward compatibility with the old interface
    onSave?.(newTheme, newTheme);
  };
  
  const colorGroups = [
    {
      title: 'الألوان الأساسية',
      icon: Palette,
      colors: [
        { key: 'primary' as ColorKey, label: 'اللون الأساسي', editable: false },
        { key: 'primaryHover' as ColorKey, label: 'أساسي (تحويم)', editable: true },
        { key: 'primaryActive' as ColorKey, label: 'أساسي (نشط)', editable: true },
      ],
    },
    {
      title: 'الألوان الثانوية',
      icon: Sparkles,
      colors: [
        { key: 'secondary' as ColorKey, label: 'اللون الثانوي', editable: false },
        { key: 'secondaryHover' as ColorKey, label: 'ثانوي (تحويم)', editable: true },
        { key: 'secondaryActive' as ColorKey, label: 'ثانوي (نشط)', editable: true },
      ],
    },
    {
      title: 'ألوان الحالة',
      icon: AlertCircle,
      colors: [
        { key: 'success' as ColorKey, label: 'نجاح', editable: true },
        { key: 'warning' as ColorKey, label: 'تحذير', editable: true },
        { key: 'error' as ColorKey, label: 'خطأ', editable: true },
        { key: 'info' as ColorKey, label: 'معلومات', editable: true },
      ],
    },
    {
      title: 'الخلفيات',
      icon: Eye,
      colors: [
        { key: 'background' as ColorKey, label: 'الخلفية', editable: false },
        { key: 'surface' as ColorKey, label: 'السطح', editable: true },
        { key: 'surfaceHover' as ColorKey, label: 'سطح (تحويم)', editable: true },
        { key: 'border' as ColorKey, label: 'الحدود', editable: true },
      ],
    },
    {
      title: 'النصوص',
      icon: Info,
      colors: [
        { key: 'textPrimary' as ColorKey, label: 'نص أساسي', editable: true },
        { key: 'textSecondary' as ColorKey, label: 'نص ثانوي', editable: true },
        { key: 'textMuted' as ColorKey, label: 'نص خافت', editable: true },
      ],
    },
  ];
  
  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto px-1 custom-scrollbar">
      <div className="sticky top-0 bg-white dark:bg-neutral-900 z-10 pb-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg text-white bg-gradient-to-br from-purple-500 to-pink-500">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                محرر الثيمات الاحترافي
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                صمم ثيمك المثالي من 3 ألوان أساسية فقط
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            <button
              onClick={() => handleModeChange('light')}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                selectedMode === 'light'
                  ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span className="font-medium">فاتح</span>
            </button>
            <button
              onClick={() => handleModeChange('dark')}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                selectedMode === 'dark'
                  ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span className="font-medium">داكن</span>
            </button>
          </div>
        </div>
        
        {validationErrors.length > 0 && (
          <div className="p-3 rounded-lg bg-error-50 border border-error-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-error-900 mb-1">
                  يرجى تصحيح الأخطاء:
                </h4>
                <ul className="text-xs text-error-700 space-y-0.5">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            اسم الثيم <span className="text-error-600">*</span>
          </label>
          <Input
            value={themeName}
            onChange={(e) => {
              setThemeName(e.target.value);
              setHasChanges(true);
            }}
            placeholder="مثال: ثيمي الاحترافي"
            className="text-lg font-semibold"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            الوصف (اختياري)
          </label>
          <Input
            value={themeDescription}
            onChange={(e) => {
              setThemeDescription(e.target.value);
              setHasChanges(true);
            }}
            placeholder="وصف مختصر..."
          />
        </div>
      </div>
      
      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
            مولد الألوان الذكي
          </h4>
        </div>
        
        <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
          اختر 3 ألوان أساسية وسيتم توليد باقي الألوان تلقائياً بذكاء
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100">
              اللون الأساسي
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-12 rounded-lg border-2 border-purple-300 dark:border-purple-600 cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 font-mono"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100">
              اللون الثانوي
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-16 h-12 rounded-lg border-2 border-purple-300 dark:border-purple-600 cursor-pointer"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 font-mono"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-purple-900 dark:text-purple-100">
              لون الخلفية
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-16 h-12 rounded-lg border-2 border-purple-300 dark:border-purple-600 cursor-pointer"
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 font-mono"
              />
            </div>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerateColors}
          className="w-full mt-4"
        >
          <Sparkles className="w-4 h-4" />
          <span>إعادة توليد جميع الألوان</span>
        </Button>
      </div>
      
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
        >
          <Eye className="w-4 h-4" />
          <span>{showAdvanced ? 'إخفاء' : 'إظهار'} التعديل المتقدم</span>
        </Button>
        
        {showAdvanced && generatedColors && (
          <div className="space-y-6 p-6 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                تعديل الألوان المتقدم
              </h4>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                الوضع: {selectedMode === 'light' ? 'فاتح' : 'داكن'}
              </span>
            </div>
            
            {colorGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.title} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GroupIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    <h5 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {group.title}
                    </h5>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.colors.map((colorDef) => (
                      <div key={colorDef.key} className="space-y-2">
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          {colorDef.label}
                          {!colorDef.editable && (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 mr-2">(تلقائي)</span>
                          )}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={generatedColors[colorDef.key]}
                            onChange={(e) => handleColorChange(colorDef.key, e.target.value)}
                            disabled={!colorDef.editable}
                            className="w-10 h-10 rounded-lg border-2 border-neutral-300 dark:border-neutral-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <Input
                            value={generatedColors[colorDef.key]}
                            onChange={(e) => handleColorChange(colorDef.key, e.target.value)}
                            disabled={!colorDef.editable}
                            className="flex-1 font-mono text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {generatedColors && (
        <div className="p-6 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-theme-primary" />
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
              معاينة حية للثيم
            </h4>
          </div>
          
          <div 
            className="p-6 rounded-lg space-y-4 shadow-lg"
            style={{ 
              backgroundColor: generatedColors.background,
              color: generatedColors.textPrimary 
            }}
          >
            <div className="flex flex-wrap gap-2">
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-shadow"
                style={{ backgroundColor: generatedColors.primary }}
              >
                زر أساسي
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-shadow"
                style={{ backgroundColor: generatedColors.secondary }}
              >
                زر ثانوي
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-shadow"
                style={{ backgroundColor: generatedColors.success }}
              >
                نجاح
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-shadow"
                style={{ backgroundColor: generatedColors.warning }}
              >
                تحذير
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-shadow"
                style={{ backgroundColor: generatedColors.error }}
              >
                خطأ
              </button>
            </div>
            
            <div
              className="p-4 rounded-lg shadow-sm"
              style={{
                backgroundColor: generatedColors.surface,
                borderColor: generatedColors.border,
                borderWidth: '2px',
              }}
            >
              <h6 className="font-semibold mb-2" style={{ color: generatedColors.textPrimary }}>
                عنوان البطاقة
              </h6>
              <p className="text-sm mb-2" style={{ color: generatedColors.textSecondary }}>
                نص تجريبي لعرض كيف ستبدو الألوان في التطبيق
              </p>
              <p className="text-xs" style={{ color: generatedColors.textMuted }}>
                نص خافت للتفاصيل الثانوية
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: generatedColors.accent, opacity: 0.2 }}>
                <p className="text-xs font-medium" style={{ color: generatedColors.textPrimary }}>
                  لون مميز
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: generatedColors.highlight }}>
                <p className="text-xs font-medium" style={{ color: generatedColors.textPrimary }}>
                  تسليط الضوء
                </p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-white/5 dark:bg-black/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>التباين: نص / خلفية</span>
                <span className="font-mono font-semibold">
                  {getContrastRatio(generatedColors.textPrimary, generatedColors.background).toFixed(2)}:1
                  {getContrastRatio(generatedColors.textPrimary, generatedColors.background) >= 4.5 ? (
                    <CheckCircle2 className="w-4 h-4 text-success-600 inline mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-error-600 inline mr-1" />
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>التباين: أساسي / خلفية</span>
                <span className="font-mono font-semibold">
                  {getContrastRatio(generatedColors.primary, generatedColors.background).toFixed(2)}:1
                  {getContrastRatio(generatedColors.primary, generatedColors.background) >= 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-success-600 inline mr-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-error-600 inline mr-1" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700 sticky bottom-0 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSave}
            disabled={!hasChanges || !themeName.trim() || !generatedColors}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'حفظ التعديلات' : 'حفظ الثيم'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
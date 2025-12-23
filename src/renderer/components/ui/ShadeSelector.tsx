import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { VitaShades, VitaShadeGroups } from '../../../shared/constants/enums';

interface ShadeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function ShadeSelector({ value, onChange, error, disabled = false }: ShadeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredShades = VitaShades.filter(shade => {
    const matchesSearch = searchQuery === '' || 
      shade.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shade.description.includes(searchQuery);
    
    const matchesGroup = selectedGroup === 'all' || shade.group === selectedGroup;
    
    return matchesSearch && matchesGroup;
  });

  const selectedShade = VitaShades.find(s => s.code === value);

  const handleSelect = (shadeCode: string) => {
    onChange(shadeCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
        اللون (Shade) *
      </label>
      
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-2.5 rounded-lg border text-right
          flex items-center justify-between gap-2
          transition-all duration-200
          ${error 
            ? 'border-error focus:ring-error' 
            : 'border-neutral-300 focus:ring-theme-primary'
          }
          ${disabled 
            ? 'bg-neutral-100 cursor-not-allowed opacity-60' 
            : 'bg-white hover:border-theme-primary cursor-pointer'
          }
          focus:outline-none focus:ring-2
        `}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedShade ? (
            <>
              <div
                className="w-6 h-6 rounded border border-neutral-300 dark:border-neutral-600 flex-shrink-0"
                style={{ backgroundColor: selectedShade.color }}
                title={selectedShade.description}
              />
              <span className="font-medium text-neutral-900">
                {selectedShade.code}
              </span>
              <span className="text-sm text-neutral-500 truncate">
                {selectedShade.description}
              </span>
            </>
          ) : (
            <span className="text-neutral-400">اختر اللون من الدليل</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleClear(e);
              }}
              className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 cursor-pointer"
              title="مسح"
            >
              <X size={16} />
            </div>
          )}
          <ChevronDown 
            size={20} 
            className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 max-h-96 overflow-hidden">
          {/* Search and Filter */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث عن اللون..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Group Filter */}
            <div className="flex gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedGroup('all')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedGroup === 'all'
                    ? 'bg-theme-primary text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                الكل
              </button>
              {Object.entries(VitaShadeGroups).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedGroup(key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedGroup === key
                      ? 'bg-theme-primary text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Shade List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredShades.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-sm">
                لا توجد نتائج مطابقة
              </div>
            ) : (
              <div className="p-2">
                {filteredShades.map((shade) => (
                  <button
                    key={shade.code}
                    type="button"
                    onClick={() => handleSelect(shade.code)}
                    className={`
                      w-full px-3 py-2.5 rounded-lg text-right
                      flex items-center gap-3
                      transition-colors
                      ${value === shade.code
                        ? 'text-theme-primary'
                        : 'hover:bg-neutral-100 text-neutral-900'
                      }
                    `}
                  >
                    {/* Color Preview */}
                    <div
                      className="w-8 h-8 rounded border border-neutral-300 dark:border-neutral-600 flex-shrink-0"
                      style={{ backgroundColor: shade.color }}
                    />
                    
                    {/* Shade Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{shade.code}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          ({VitaShadeGroups[shade.group as keyof typeof VitaShadeGroups]})
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {shade.description}
                      </p>
                    </div>

                    {/* Check Icon */}
                    {value === shade.code && (
                      <Check size={18} className="flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Input Option */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              أو أدخل لون مخصص:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="مثال: A2.5"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSelect(searchQuery.trim());
                  }
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary"
              />
              <button
                type="button"
                onClick={() => searchQuery.trim() && handleSelect(searchQuery.trim())}
                disabled={!searchQuery.trim()}
                className="px-4 py-2 rounded-lg bg-theme-primary text-white text-sm font-medium hover:bg-theme-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
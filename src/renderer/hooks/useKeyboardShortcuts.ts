import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if user is typing in an input field (except for search shortcut)
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Check if we're in a modal or form context
      const isInModal = target.closest('[role="dialog"]') !== null || 
                        target.closest('.modal') !== null ||
                        target.closest('form') !== null;
      
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        
        // Match by key code for better cross-keyboard support
        // Also match by key for special characters like '/' and ','
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() || 
                        event.code.toLowerCase() === `key${shortcut.key.toLowerCase()}`;

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          // Allow search shortcut even in input fields
          if (isInputField && shortcut.key !== 'k') {
            continue;
          }
          
          // Skip if in modal/form and not a special shortcut
          if (isInModal && shortcut.key !== 'escape') {
            continue;
          }
          
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

export const GLOBAL_SHORTCUTS = {
  // Navigation
  SEARCH: { key: 'k', ctrl: true, description: 'فتح البحث', category: 'التنقل' },
  DASHBOARD: { key: 'h', ctrl: true, description: 'لوحة التحكم', category: 'التنقل' },
  NEW_ORDER: { key: 'o', ctrl: true, description: 'طلب جديد', category: 'التنقل' },
  SETTINGS: { key: ',', ctrl: true, description: 'الإعدادات', category: 'التنقل' },
  BACK_TO_MENU: { key: 'enter', description: 'العودة للقائمة الرئيسية', category: 'التنقل' },
  ESCAPE: { key: 'escape', description: 'إغلاق/رجوع', category: 'التنقل' },
  
  // Actions
  NEW: { key: 'n', ctrl: true, description: 'إضافة جديد', category: 'الإجراءات' },
  SAVE: { key: 's', ctrl: true, description: 'حفظ', category: 'الإجراءات' },
  REFRESH: { key: 'F5', description: 'تحديث البيانات', category: 'الإجراءات' },
  
  // Export & Print
  EXPORT: { key: 'e', ctrl: true, description: 'تصدير Excel', category: 'التصدير والطباعة' },
  PRINT: { key: 'p', ctrl: true, description: 'طباعة', category: 'التصدير والطباعة' },
  
  // Help
  HELP: { key: '?', ctrl: true, description: 'عرض المساعدة', category: 'المساعدة' },
} as const;

// Helper to get all shortcuts as array
export const getAllShortcuts = () => {
  return Object.values(GLOBAL_SHORTCUTS);
};

// Helper to get shortcuts by category
export const getShortcutsByCategory = () => {
  const shortcuts = getAllShortcuts();
  const categories: Record<string, typeof shortcuts> = {};
  
  shortcuts.forEach(shortcut => {
    const category = shortcut.category || 'عام';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(shortcut);
  });
  
  return categories;
};

// Helper to format shortcut key display
export const formatShortcutKey = (shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }) => {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  
  // Format special keys
  let key = shortcut.key;
  if (key === 'escape') key = 'Esc';
  else if (key === 'enter') key = 'Enter';
  else if (key.startsWith('F') && key.length <= 3) {
    // F1-F12 - keep as is
  } else {
    key = key.toUpperCase();
  }
  
  parts.push(key);
  
  return parts.join(' + ');
};
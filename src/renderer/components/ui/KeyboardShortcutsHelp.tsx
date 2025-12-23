import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { Modal } from './Modal';
import { getShortcutsByCategory, formatShortcutKey } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  const shortcutsByCategory = getShortcutsByCategory();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Keyboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                اختصارات لوحة المفاتيح
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                استخدم هذه الاختصارات لتسريع عملك
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Shortcuts by Category */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
                {category}
              </h3>
              <div className="grid gap-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {formatShortcutKey(shortcut).split(' + ').map((key, i, arr) => (
                        <React.Fragment key={i}>
                          <kbd className="px-3 py-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm min-w-[2.5rem] text-center">
                            {key}
                          </kbd>
                          {i < arr.length - 1 && (
                            <span className="text-neutral-400 dark:text-neutral-600 mx-1">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              💡 نصيحة: اضغط <kbd className="px-2 py-1 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded">Ctrl + ?</kbd> في أي وقت لعرض هذه القائمة
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              فهمت
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
import { User, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownDivider } from '../ui/Dropdown';
import { useTheme } from '../../../contexts/ThemeContext';
import { useState, useEffect } from 'react';

export function UserMenu() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [userName, setUserName] = useState('المدير');

  useEffect(() => {
    // Load user name from settings
    const loadSettings = async () => {
      try {
        const response = await window.api.settings.get();
        if (response.ok && response.data) {
          setUserName(response.data.app_name || 'المدير');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleLogout = () => {
    // In a real app, this would clear session/auth
    console.log('Logout clicked');
  };

  return (
    <Dropdown
      align="left"
      className="w-[240px]"
      trigger={
        <button 
          className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-neutral-100 transition-all hover:shadow-sm group"
          aria-label="الملف الشخصي"
        >
          <span className="hidden md:block text-sm font-semibold text-neutral-900 group-hover:text-theme-primary transition-colors">
            {userName}
          </span>
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all"
            style={{
              background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)`,
            }}
          >
            <User className="w-5 h-5 text-white" />
          </div>
        </button>
      }
    >
      <div className="py-1">
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/30">
          <p className="text-sm font-bold text-neutral-900 dark:text-white">
            {userName}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            مدير النظام
          </p>
        </div>

        <DropdownItem
          icon={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
        </DropdownItem>

        <DropdownItem
          icon={<Settings className="w-4 h-4" />}
          onClick={() => navigate('/settings')}
        >
          الإعدادات
        </DropdownItem>

        <DropdownDivider />

        <DropdownItem
          icon={<LogOut className="w-4 h-4" />}
          onClick={handleLogout}
          danger
        >
          تسجيل الخروج
        </DropdownItem>
      </div>
    </Dropdown>
  );
}
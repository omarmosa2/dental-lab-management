import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Wallet, 
  Receipt, 
  HardHat, 
  Package, 
  Settings,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { path: '/doctors', label: 'إدارة الأطباء', icon: Users },
  { path: '/orders', label: 'إدارة الطلبات', icon: ClipboardList },
  { path: '/finance', label: 'المالية', icon: Wallet },
  { path: '/expenses', label: 'مصروفات المختبر', icon: Receipt },
  { path: '/workers', label: 'عمال المختبر', icon: HardHat },
  { path: '/materials', label: 'المواد', icon: Package },
  { path: '/settings', label: 'الإعدادات', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`
        fixed right-0 top-0 h-screen
        bg-white dark:bg-neutral-800
        border-l border-neutral-200 dark:border-neutral-700
        transition-all duration-300 ease-in-out
        z-40 custom-scrollbar overflow-y-auto
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Logo & Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-700">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
                مختبر الأسنان
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                نظام الإدارة
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          aria-label={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
        >
          {isCollapsed ? (
            <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${isActive 
                  ? 'bg-theme-primary text-white shadow-md' 
                  : 'text-neutral-700 hover:bg-neutral-100'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <button
          onClick={toggleTheme}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg
            bg-neutral-100 dark:bg-neutral-700
            hover:bg-neutral-200 dark:hover:bg-neutral-600
            transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
          aria-label={theme === 'light' ? 'تفعيل الوضع الداكن' : 'تفعيل الوضع الفاتح'}
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              {!isCollapsed && (
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  الوضع الداكن
                </span>
              )}
            </>
          ) : (
            <>
              <Sun className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              {!isCollapsed && (
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  الوضع الفاتح
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Wallet, 
  Receipt, 
  HardHat, 
  Package, 
  Settings,
  Search,
  X,
  Clock,
  Star
} from 'lucide-react';
import { useState, useEffect } from 'react';
import MenuCard from '../components/MenuCard';
import { useNavigate } from 'react-router-dom';

interface MenuItem {
  path: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  color: string;
  gradient: string;
}

const menuItems: MenuItem[] = [
  { 
    path: '/', 
    label: 'لوحة التحكم', 
    description: 'نظرة عامة على النشاط والإحصائيات',
    icon: LayoutDashboard,
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  { 
    path: '/doctors', 
    label: 'إدارة الأطباء', 
    description: 'إدارة معلومات الأطباء والتواصل',
    icon: Users,
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  },
  { 
    path: '/orders', 
    label: 'إدارة الطلبات', 
    description: 'متابعة وإدارة طلبات العمل',
    icon: ClipboardList,
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  { 
    path: '/finance', 
    label: 'المالية', 
    description: 'الإيرادات والمصروفات والأرباح',
    icon: Wallet,
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
  { 
    path: '/expenses', 
    label: 'مصروفات المختبر', 
    description: 'تتبع وإدارة المصروفات اليومية',
    icon: Receipt,
    color: '#EF4444',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  },
  { 
    path: '/workers', 
    label: 'عمال المختبر', 
    description: 'إدارة الموظفين والحضور',
    icon: HardHat,
    color: '#06B6D4',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
  { 
    path: '/materials', 
    label: 'المواد', 
    description: 'إدارة المخزون والمواد الخام',
    icon: Package,
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  },
  { 
    path: '/settings', 
    label: 'الإعدادات', 
    description: 'إعدادات النظام والتخصيص',
    icon: Settings,
    color: '#6B7280',
    gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  },
];

export default function AppMenu() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(menuItems);
  const [recentPages, setRecentPages] = useState<string[]>([]);

  useEffect(() => {
    // Load recent pages from localStorage
    const recent = localStorage.getItem('recentPages');
    if (recent) {
      setRecentPages(JSON.parse(recent));
    }
  }, []);

  useEffect(() => {
    // Filter menu items based on search
    if (searchQuery.trim() === '') {
      setFilteredItems(menuItems);
    } else {
      const filtered = menuItems.filter(item =>
        item.label.includes(searchQuery) || 
        item.description.includes(searchQuery)
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  const handleCardClick = (path: string) => {
    // Save to recent pages
    const updated = [path, ...recentPages.filter(p => p !== path)].slice(0, 5);
    setRecentPages(updated);
    localStorage.setItem('recentPages', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-slideDown">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            نظام إدارة مختبر الأسنان
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400">
            اختر القسم الذي تريد الوصول إليه
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12 animate-slideDown" style={{ animationDelay: '0.1s' }}>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن صفحة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-12 py-4 rounded-2xl border-2 border-neutral-300 bg-white/80 backdrop-blur-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:border-theme-primary focus:ring-4 transition-all duration-300"
              style={{ '--tw-ring-color': 'var(--color-primary)', '--tw-ring-opacity': '0.2' } as React.CSSProperties}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Recent Pages */}
        {recentPages.length > 0 && searchQuery === '' && (
          <div className="max-w-6xl mx-auto mb-8 animate-slideDown" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-neutral-600 dark:text-neutral-400" />
              <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                الصفحات الأخيرة
              </h2>
            </div>
            <div className="flex gap-3 flex-wrap">
              {recentPages.map((path) => {
                const item = menuItems.find(i => i.path === path);
                if (!item) return null;
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-neutral-200 hover:border-theme-primary hover:shadow-lg transition-all duration-300 group"
                  >
                    <item.icon size={16} style={{ color: item.color }} />
                    <span className="text-sm text-neutral-700 group-hover:text-theme-primary">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className="max-w-7xl mx-auto">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredItems.map((item, index) => (
                <div key={item.path} onClick={() => handleCardClick(item.path)}>
                  <MenuCard
                    {...item}
                    index={index}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                لا توجد نتائج
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                جرب البحث بكلمات مختلفة
              </p>
            </div>
          )}
        </div>

        {/* Keyboard Hint */}
        <div className="text-center mt-12 animate-slideUp">
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            اضغط <kbd className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs">ESC</kbd> للرجوع
          </p>
        </div>
      </div>
    </div>
  );
}
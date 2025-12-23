import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Wallet, 
  TrendingDown, 
  Briefcase, 
  Package,
  Settings,
  type LucideIcon
} from 'lucide-react';

interface PageInfo {
  title: string;
  icon: LucideIcon;
}

const pageMap: Record<string, PageInfo> = {
  '/': { title: 'لوحة التحكم', icon: LayoutDashboard },
  '/doctors': { title: 'الأطباء', icon: Users },
  '/orders': { title: 'الطلبات', icon: ClipboardList },
  '/finance': { title: 'المالية', icon: Wallet },
  '/expenses': { title: 'المصروفات', icon: TrendingDown },
  '/workers': { title: 'العمال', icon: Briefcase },
  '/materials': { title: 'المواد', icon: Package },
  '/settings': { title: 'الإعدادات', icon: Settings },
};

export function PageTitle() {
  const location = useLocation();
  const pageInfo = pageMap[location.pathname] || { title: 'مختبر الأسنان', icon: LayoutDashboard };
  const Icon = pageInfo.icon;

  return (
    <div className="flex items-center gap-3 group">
      <div 
        className="p-2.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow text-theme-primary"
        style={{
          background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 100%)`,
          opacity: 0.1,
        }}
      >
        <Icon className="w-5 h-5" style={{ opacity: 10 }} />
      </div>
      <div>
        <h1 className="text-lg font-bold text-neutral-900 tracking-tight">
          {pageInfo.title}
        </h1>
        <p className="text-[10px] text-neutral-500 font-medium">
          نظام الإدارة
        </p>
      </div>
    </div>
  );
}
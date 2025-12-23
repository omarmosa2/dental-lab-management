import { useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  ClipboardList, 
  Wallet, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardViewModel } from '../renderer/viewmodels/DashboardViewModel';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '../renderer/hooks/useKeyboardShortcuts';
import { useToast } from '../renderer/hooks/useToast';
import formatCurrency from '../utils/currency';
import { OrderStatus } from '../shared/constants/enums';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: typeof TrendingUp;
  color: 'primary' | 'secondary' | 'success' | 'warning';
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  const isPositive = change >= 0;
  
  const colorClasses = {
    primary: 'text-theme-primary',
    secondary: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
    success: 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400',
    warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
  };

  return (
    <div className="card group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium transition-all duration-300 ${
          isPositive ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
        }`}>
          {isPositive ? (
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          ) : (
            <ArrowDownRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
          )}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      
      <h3 className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
        {title}
      </h3>
      <p className="heading-2 text-neutral-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

interface RecentOrderProps {
  id: string;
  doctor: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'ready' | 'delivered' | 'cancelled';
  date: string;
}

function RecentOrder({ id, doctor, type, status, date }: RecentOrderProps) {
  const statusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: 'قيد الانتظار', class: 'badge-warning' },
    in_progress: { label: 'قيد التنفيذ', class: 'badge-info' },
    completed: { label: 'مكتمل', class: 'badge-success' },
    ready: { label: 'جاهز', class: 'badge-success' },
    delivered: { label: 'تم التسليم', class: 'badge-success' },
    cancelled: { label: 'ملغي', class: 'badge-error' },
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 hover:translate-x-1 cursor-pointer group">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-neutral-900 dark:text-white">
            #{id}
          </span>
          <span className={`badge ${statusConfig[status].class}`}>
            {statusConfig[status].label}
          </span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {doctor} • {type}
        </p>
      </div>
      <div className="text-left">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {date}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { stats, recentOrders, loading, error, loadAll } = useDashboardViewModel();
  const { success } = useToast();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...GLOBAL_SHORTCUTS.NEW,
      action: () => navigate('/orders'),
    },
    {
      ...GLOBAL_SHORTCUTS.REFRESH,
      action: () => {
        loadAll();
        success('تم تحديث البيانات');
      },
    },
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);


  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `اليوم، ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `أمس، ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US');
    }
  };

  const statsData = stats ? [
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders.toString(),
      change: 12.5,
      icon: ClipboardList,
      color: 'primary' as const,
    },
    {
      title: 'الأطباء النشطون',
      value: stats.totalDentists.toString(),
      change: 8.2,
      icon: Users,
      color: 'secondary' as const,
    },
    {
      title: 'الإيرادات الشهرية',
      value: formatCurrency(stats.monthlyRevenue),
      change: 15.3,
      icon: Wallet,
      color: 'success' as const,
    },
    {
      title: 'المواد منخفضة المخزون',
      value: stats.lowStockMaterials.toString(),
      change: -3.1,
      icon: Package,
      color: 'warning' as const,
    },
  ] : [];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-theme-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-error-900 dark:text-error-100 mb-1">
              خطأ في تحميل البيانات
            </h4>
            <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
            <button 
              onClick={loadAll}
              className="mt-2 text-sm text-error-600 dark:text-error-400 hover:underline font-medium"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-1 text-neutral-900 dark:text-white mb-2">
            لوحة التحكم
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            مرحباً بك في نظام إدارة مختبر الأسنان
          </p>
        </div>
        <button className="btn-base btn-primary" onClick={() => navigate('/orders')}>
          <Calendar className="w-4 h-4" />
          <span>طلب جديد</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="heading-3 text-neutral-900 dark:text-white">
              الطلبات الأخيرة
            </h2>
          </div>
          <div className="space-y-2">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <RecentOrder 
                  key={order.id} 
                  id={order.order_number}
                  doctor={(order as any).dentist_name || 'غير محدد'}
                  type={order.case_type}
                  status={order.status as any}
                  date={formatDate(order.date_received)}
                />
              ))
            ) : (
              <p className="text-center text-neutral-500 dark:text-neutral-400 py-8">
                لا توجد طلبات حديثة
              </p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button 
              onClick={() => navigate('/orders')}
              className="text-sm text-theme-primary hover:underline font-medium"
            >
              عرض جميع الطلبات ←
            </button>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="heading-4 text-neutral-900 dark:text-white mb-4">
              إجراءات سريعة
            </h3>
            <div className="space-y-3">
              <button 
                className="w-full btn-base btn-primary"
                onClick={() => navigate('/orders')}
              >
                <ClipboardList className="w-4 h-4" />
                <span>طلب جديد</span>
              </button>
              <button 
                className="w-full btn-base btn-outline"
                onClick={() => navigate('/doctors')}
              >
                <Users className="w-4 h-4" />
                <span>إضافة طبيب</span>
              </button>
              <button 
                className="w-full btn-base btn-outline"
                onClick={() => navigate('/materials')}
              >
                <Package className="w-4 h-4" />
                <span>إدارة المواد</span>
              </button>
            </div>
          </div>

          {/* Alerts */}
          {stats && stats.lowStockMaterials > 0 && (
            <div className="card bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-warning-900 dark:text-warning-100 mb-1">
                    تنبيه المخزون
                  </h4>
                  <p className="text-sm text-warning-700 dark:text-warning-300">
                    {stats.lowStockMaterials} مواد تحتاج إلى إعادة طلب
                  </p>
                  <button 
                    onClick={() => navigate('/materials')}
                    className="mt-2 text-sm text-warning-600 dark:text-warning-400 hover:underline font-medium"
                  >
                    عرض التفاصيل ←
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
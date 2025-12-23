import { Maximize2, Minimize2, Keyboard, Menu, X, Search as SearchIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationDropdown } from '../renderer/components/header/NotificationDropdown';
import { SearchBar } from '../renderer/components/header/SearchBar';
import { UserMenu } from '../renderer/components/header/UserMenu';
import { PageTitle } from '../renderer/components/header/PageTitle';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '../renderer/hooks/useKeyboardShortcuts';
import { useEnterKeyNavigation } from '../renderer/hooks/useEnterKeyNavigation';
import { KeyboardShortcutsHelp } from '../renderer/components/ui/KeyboardShortcutsHelp';
import { useIsMobile, useIsTablet } from '../renderer/hooks/useMediaQuery';
import { useScrollLock } from '../renderer/hooks/useScrollLock';
import AppLauncher from './AppLauncher';

export default function Header() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchBarRef = useRef<{ focusSearch: () => void }>(null);
  
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  // Lock scroll when mobile menu is open
  useScrollLock(showMobileMenu);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Enable smart Enter key navigation
  useEnterKeyNavigation();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...GLOBAL_SHORTCUTS.SEARCH,
      action: () => {
        searchBarRef.current?.focusSearch();
      },
    },
    {
      ...GLOBAL_SHORTCUTS.NEW_ORDER,
      action: () => navigate('/orders'),
    },
    {
      ...GLOBAL_SHORTCUTS.DASHBOARD,
      action: () => navigate('/'),
    },
    {
      ...GLOBAL_SHORTCUTS.SETTINGS,
      action: () => navigate('/settings'),
    },
    {
      ...GLOBAL_SHORTCUTS.HELP,
      action: () => setShowShortcuts(true),
    },
  ]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      // weekday: 'numeric',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-30 shadow-sm transition-all duration-300">
        <div className="h-full px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4">
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all hover:scale-105 lg:hidden"
              aria-label="القائمة"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              ) : (
                <Menu className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              )}
            </button>
          )}

          {/* Left Section - Page Title */}
          <div className="flex-shrink-0">
            <PageTitle />
          </div>

          {/* Center Section - Search (Desktop/Tablet) */}
          {!isMobile && <SearchBar ref={searchBarRef} />}

          {/* Right Section - Actions & User */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Mobile Search Button */}
            {isMobile && (
              <button
                onClick={() => setShowMobileSearch(true)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all hover:scale-105"
                aria-label="بحث"
              >
                <SearchIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            )}

            {/* App Launcher (Hidden on mobile) */}
            {!isMobile && <AppLauncher />}
            
            {/* Divider (Hidden on mobile) */}
            {!isMobile && (
              <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1"></div>
            )}
            
            {/* Date & Time (Desktop only) */}
            <div className="hidden xl:flex flex-col items-end px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-700/50 transition-all hover:shadow-sm">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                {formatDate(currentTime)}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {formatTime(currentTime)}
              </span>
            </div>
         
            {/* Divider (Desktop only) */}
            <div className="hidden lg:block w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1"></div>

            {/* Fullscreen Toggle (Desktop only) */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all hover:scale-105 hidden lg:block"
              aria-label="ملء الشاشة"
              title="ملء الشاشة"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4.5 h-4.5 text-neutral-600 dark:text-neutral-400" />
              ) : (
                <Maximize2 className="w-4.5 h-4.5 text-neutral-600 dark:text-neutral-400" />
              )}
            </button>

            {/* Keyboard Shortcuts (Desktop only) */}
            <button
              onClick={() => setShowShortcuts(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all hover:scale-105 hidden lg:block"
              aria-label="اختصارات لوحة المفاتيح"
              title="اختصارات لوحة المفاتيح (Ctrl+Shift+/)"
            >
              <Keyboard className="w-4.5 h-4.5 text-neutral-600 dark:text-neutral-400" />
            </button>

            {/* Notifications (Hidden on small mobile) */}
            {!isMobile && <NotificationDropdown />}

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {isMobile && showMobileSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn" onClick={() => setShowMobileSearch(false)}>
          <div className="bg-white dark:bg-neutral-800 p-4 animate-slideDown" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
              <SearchBar ref={searchBarRef} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {isMobile && showMobileMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu Content */}
          <div className="fixed top-16 right-0 bottom-0 w-64 bg-white dark:bg-neutral-800 border-l border-neutral-200 dark:border-neutral-700 z-40 shadow-2xl animate-slide-in-left overflow-y-auto">
            <div className="p-4 space-y-2">
              <AppLauncher />
              <div className="border-t border-neutral-200 dark:border-neutral-700 my-4" />
              <NotificationDropdown />
            </div>
          </div>
        </>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsHelp 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
      />
    </>
  );
}
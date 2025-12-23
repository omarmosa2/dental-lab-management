import { Grid3x3, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function AppLauncher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(location.pathname === '/menu');
  }, [location.pathname]);

  const handleClick = () => {
    if (isMenuOpen) {
      navigate(-1);
    } else {
      navigate('/menu');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative group"
      aria-label="قائمة التطبيق"
    >
      {/* Button Container */}
      <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 dark:from-primary-600 dark:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 transition-all duration-300 hover:scale-110 hover:rotate-3 shadow-lg hover:shadow-xl">
        
        {/* Glow Effect */}
        <div 
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
        
        {/* Icon */}
        <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
          {isMenuOpen ? (
            <X size={24} className="text-white" />
          ) : (
            <Grid3x3 size={24} className="text-white" />
          )}
        </div>
        
        {/* Pulse Animation */}
        {!isMenuOpen && (
          <div 
            className="absolute inset-0 rounded-xl animate-ping opacity-20"
            style={{ backgroundColor: 'var(--color-primary-hover)' }}
          />
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-700 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        {isMenuOpen ? 'إغلاق القائمة' : 'قائمة التطبيق'}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-neutral-900 dark:border-b-neutral-700" />
      </div>
    </button>
  );
}
import { Search, X, User, ClipboardList, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSearchViewModel, type SearchResult } from '../../viewmodels/SearchViewModel';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const resultIcons = {
  dentist: User,
  order: ClipboardList,
  material: Package,
};

const resultColors = {
  dentist: 'text-theme-primary',
  order: 'bg-secondary-100 text-secondary-600',
  material: 'bg-warning-100 text-warning-600',
};

function SearchResultItem({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const Icon = resultIcons[result.type];

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 text-right flex items-center gap-3 hover:bg-neutral-50 transition-colors"
    >
      <div 
        className={`p-2 rounded-lg flex-shrink-0 ${resultColors[result.type]}`}
        style={result.type === 'dentist' ? { backgroundColor: 'var(--color-primary)', opacity: 0.1 } : undefined}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">
          {result.title}
        </p>
        <p className="text-xs text-neutral-600 truncate">
          {result.subtitle}
        </p>
      </div>
    </button>
  );
}

interface SearchBarProps {
  onOpenChange?: (open: boolean) => void;
}

export interface SearchBarRef {
  focusSearch: () => void;
}

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({ onOpenChange }, ref) => {
  const navigate = useNavigate();
  const { query, results, loading, isOpen, setQuery, clear, open, close } = useSearchViewModel();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Expose focusSearch method to parent
  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      inputRef.current?.focus();
      open();
    },
  }));

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        inputRef.current?.blur();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, close]);

  const handleResultClick = (result: SearchResult) => {
    // Store the selected item data in sessionStorage for the target page to use
    sessionStorage.setItem('selectedItemId', result.data.id.toString());
    sessionStorage.setItem('selectedItemType', result.type);
    
    navigate(result.url);
    clear();
    inputRef.current?.blur();
  };

  const handleClear = () => {
    clear();
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 max-w-md" ref={containerRef}>
      <div className="relative group">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-theme-primary transition-colors" />
        <input
          ref={inputRef}
          type="text"
          placeholder="بحث... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={open}
          className="input-base pr-10 pl-10 focus:ring-2 focus:ring-theme-primary transition-all"
          style={{ '--tw-ring-opacity': '0.2' } as React.CSSProperties}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded transition-colors"
            aria-label="مسح"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        )}
        {loading && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length === 0 && !loading ? (
            <div className="py-8 text-center">
              <Search className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                لا توجد نتائج
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {results.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  onClick={() => handleResultClick(result)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';
import { type ReactNode } from 'react';
import Header from './Header';
import { SkipLink } from '../renderer/components/ui/SkipLink';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      <SkipLink />
      <Header />
      
      <main 
        id="main-content" 
        className="p-6 fade-in"
        role="main"
        aria-label="المحتوى الرئيسي"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
import { useState, useCallback, useRef } from 'react';

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const elementRef = useRef<HTMLElement | null>(null);

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const element = elementRef.current || event.currentTarget;
    const rect = element.getBoundingClientRect();
    
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  }, []);

  const clearRipples = useCallback(() => {
    setRipples([]);
  }, []);

  return {
    ripples,
    createRipple,
    clearRipples,
    elementRef,
  };
}
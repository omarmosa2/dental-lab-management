import { type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface MenuCardProps {
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  index: number;
}

export default function MenuCard({ 
  path, 
  label, 
  description, 
  icon: Icon, 
  color,
  gradient,
  index 
}: MenuCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate(path);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative cursor-pointer"
      style={{
        animation: `menuCardFadeIn 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Card Container */}
      <div className="relative h-full overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 transition-all duration-300 hover:border-transparent hover:shadow-2xl hover:-translate-y-2">
        
        {/* Gradient Background (visible on hover) */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: gradient,
          }}
        />
        
        {/* Glow Effect */}
        <div 
          className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"
          style={{
            background: gradient,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 p-8 flex flex-col items-center text-center h-full">
          {/* Icon Container */}
          <div 
            className="mb-6 p-6 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{
              backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.2)' : `${color}15`,
            }}
          >
            <Icon 
              size={56} 
              className="transition-all duration-300"
              style={{
                color: color,
                filter: isHovered ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none',
              }}
            />
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-bold mb-3 text-neutral-900 dark:text-white group-hover:text-white transition-colors duration-300">
            {label}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-white/90 transition-colors duration-300">
            {description}
          </p>
          
          {/* Hover Indicator */}
          <div className="mt-auto pt-6">
            <div className="w-12 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600 group-hover:bg-white transition-all duration-300 group-hover:w-20" />
          </div>
        </div>
        
        {/* Ripple Effect Container */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {isHovered && (
            <div 
              className="absolute inset-0 animate-ripple"
              style={{
                background: `radial-gradient(circle at center, ${color}40 0%, transparent 70%)`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
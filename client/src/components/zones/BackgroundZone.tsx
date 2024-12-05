import { ReactNode } from 'react';
import { useBackgroundManager } from '../../hooks/useBackgroundManager';

interface BackgroundZoneProps {
  children: ReactNode;
}

export default function BackgroundZone({ children }: BackgroundZoneProps) {
  const { images, currentImageIndex } = useBackgroundManager();
  const currentBackground = images[currentImageIndex]?.url || null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div 
        key={currentImageIndex}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
        style={{ 
          backgroundImage: currentBackground ? `url(${currentBackground})` : 'none',
          opacity: currentBackground ? 1 : 0,
        }} 
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
      <div className="relative pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

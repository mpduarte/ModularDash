import { ReactNode } from 'react';
import { useBackgroundManager } from '../../hooks/useBackgroundManager';

interface BackgroundZoneProps {
  children: ReactNode;
}

export default function BackgroundZone({ children }: BackgroundZoneProps) {
  const { images, currentImageIndex, transition } = useBackgroundManager();
  const currentBackground = images[currentImageIndex]?.url || null;
  const prevBackground = images[(currentImageIndex - 1 + images.length) % images.length]?.url || null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {prevBackground && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${prevBackground})`,
            opacity: 0,
            transition: 'opacity 1000ms ease-in-out'
          }} 
        />
      )}
      {currentBackground && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${currentBackground})`,
            opacity: 1,
            transition: 'opacity 1000ms ease-in-out'
          }} 
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
      <div className="relative pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

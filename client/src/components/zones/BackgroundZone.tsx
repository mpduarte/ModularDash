import { ReactNode } from 'react';
import { useBackgroundManager } from '../../hooks/useBackgroundManager';

interface BackgroundZoneProps {
  children: ReactNode;
}

export default function BackgroundZone({ children }: BackgroundZoneProps) {
  const { images, currentImageIndex } = useBackgroundManager();

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="relative w-full h-full overflow-hidden">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${image.url})`,
              opacity: index === currentImageIndex ? 1 : 0,
              zIndex: 0,
            }}
          />
        ))}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 z-[1]"
        />
        <div className="relative z-[2] pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useBackgroundManager } from '../../hooks/useBackgroundManager';

interface BackgroundZoneProps {
  children: ReactNode;
}

export default function BackgroundZone({ children }: BackgroundZoneProps) {
  const { images, currentImageIndex } = useBackgroundManager();
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload images and track loaded status
  useEffect(() => {
    const imagePromises = images.map(image => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(image.url));
          resolve(null);
        };
        img.onerror = reject;
        img.src = image.url;
      });
    });

    Promise.all(imagePromises).catch(error => {
      console.error('Failed to load some background images:', error);
    });
  }, [images]);

  const isLoaded = images[currentImageIndex] && loadedImages.has(images[currentImageIndex].url);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0">
      <div className="relative w-full h-full overflow-hidden">
        {images.map((image, index) => {
          const isCurrentImage = index === currentImageIndex;
          return (
            <div
              key={image.id}
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out ${
                loadedImages.has(image.url) ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${image.url})`,
                opacity: isCurrentImage ? 1 : 0,
                visibility: loadedImages.has(image.url) ? 'visible' : 'hidden',
                zIndex: isCurrentImage ? 1 : 0,
              }}
            />
          );
        })}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 z-10"
        />
        <div className="relative z-20 pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

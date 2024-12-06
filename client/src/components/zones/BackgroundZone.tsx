import { ReactNode, useEffect, useRef, useState } from 'react';
import { useBackgroundManager } from '../../hooks/useBackgroundManager';

interface BackgroundZoneProps {
  children: ReactNode;
}

export default function BackgroundZone({ children }: BackgroundZoneProps) {
  const { images, currentImageIndex } = useBackgroundManager();
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug logging
  // Handle background rotation
  useEffect(() => {
    const { isAutoRotate, interval } = useBackgroundManager.getState();
    let rotationTimer: number | undefined;

    if (isAutoRotate && images.length > 1) {
      rotationTimer = window.setInterval(() => {
        const nextIndex = (currentImageIndex + 1) % images.length;
        console.log('Rotating background:', {
          from: currentImageIndex,
          to: nextIndex,
          totalImages: images.length,
          interval
        });
        useBackgroundManager.getState().setCurrentImage(nextIndex);
      }, interval);

      console.log('Background rotation started', {
        interval,
        totalImages: images.length,
        currentIndex: currentImageIndex
      });
    }

    return () => {
      if (rotationTimer) {
        window.clearInterval(rotationTimer);
        console.log('Background rotation stopped');
      }
    };
  }, [images.length, currentImageIndex]);

  // Debug logging
  useEffect(() => {
    console.log('BackgroundZone state:', {
      totalImages: images.length,
      currentIndex: currentImageIndex,
      loadedImagesCount: loadedImages.size,
      currentImageUrl: images[currentImageIndex]?.url
    });
  }, [images, currentImageIndex, loadedImages]);

  // Preload images and track loaded status
  useEffect(() => {
    console.log('Starting to load images...');
    const imagePromises = images.map(image => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log(`Image loaded successfully: ${image.url}`);
          setLoadedImages(prev => {
            const newSet = new Set(prev);
            newSet.add(image.url);
            return newSet;
          });
          resolve(null);
        };
        img.onerror = (error) => {
          console.error(`Failed to load image: ${image.url}`, error);
          reject(error);
        };
        img.src = image.url;
      });
    });

    Promise.all(imagePromises)
      .then(() => console.log('All images loaded successfully'))
      .catch(error => console.error('Failed to load some background images:', error));

    return () => {
      // Cleanup function
      images.forEach(image => {
        if (loadedImages.has(image.url)) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [images]);

  if (images.length === 0) {
    console.warn('No background images available');
    return <div className="fixed inset-0 bg-background">{children}</div>;
  }

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0">
      <div className="relative w-full h-full overflow-hidden">
        {images.map((image, index) => {
          const isCurrentImage = index === currentImageIndex;
          const isLoaded = loadedImages.has(image.url);
          
          return (
            <div
              key={image.id}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
              style={{
                backgroundImage: `url(${image.url})`,
                opacity: isCurrentImage && isLoaded ? 1 : 0,
                visibility: isLoaded ? 'visible' : 'hidden',
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

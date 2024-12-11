import { ReactNode, useEffect, useRef, useState } from 'react';
import { useBackgroundManager, BackgroundImage } from '../../hooks/useBackgroundManager';

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
    const rotationController = new AbortController();
    let rotationTimeout: number | undefined;

    const rotateBackground = () => {
      const { isAutoRotate, interval } = useBackgroundManager.getState();
      
      if (isAutoRotate && images.length > 1 && !rotationController.signal.aborted) {
        const nextIndex = (currentImageIndex + 1) % images.length;
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Rotating background:', {
            from: currentImageIndex,
            to: nextIndex,
            totalImages: images.length,
            interval
          });
        }
        
        useBackgroundManager.getState().setCurrentImage(nextIndex);
        rotationTimeout = window.setTimeout(rotateBackground, interval);
      }
    };

    const startRotation = () => {
      const { isAutoRotate, interval } = useBackgroundManager.getState();
      if (isAutoRotate && images.length > 1) {
        rotationTimeout = window.setTimeout(rotateBackground, interval);
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Background rotation started', {
            interval,
            totalImages: images.length,
            currentIndex: currentImageIndex
          });
        }
      }
    };

    startRotation();

    return () => {
      rotationController.abort();
      if (rotationTimeout) {
        window.clearTimeout(rotationTimeout);
        if (process.env.NODE_ENV === 'development') {
          console.log('Background rotation stopped');
        }
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
    const imageCache = new Map<string, HTMLImageElement>();
    const abortController = new AbortController();
    
    const loadImage = async (image: BackgroundImage) => {
      try {
        if (imageCache.has(image.url)) return;
        
        const img = new Image();
        const loadPromise = new Promise<void>((resolve, reject) => {
          img.onload = () => {
            if (!abortController.signal.aborted) {
              imageCache.set(image.url, img);
              setLoadedImages(prev => {
                const newSet = new Set(prev);
                newSet.add(image.url);
                return newSet;
              });
            }
            resolve();
          };
          img.onerror = (error) => {
            console.error(`Failed to load image: ${image.url}`, error);
            reject(error);
          };
        });
        
        img.src = image.url;
        await loadPromise;
      } catch (error) {
        console.error(`Error loading image: ${image.url}`, error);
      }
    };

    const loadImages = async () => {
      try {
        await Promise.all(images.map(loadImage));
        if (!abortController.signal.aborted) {
          console.log('All images loaded successfully');
        }
      } catch (error) {
        console.error('Failed to load some background images:', error);
      }
    };

    loadImages();

    return () => {
      abortController.abort();
      // Cleanup function
      images.forEach(image => {
        if (image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
        imageCache.delete(image.url);
      });
      imageCache.clear();
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

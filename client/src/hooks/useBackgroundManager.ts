import { create } from 'zustand';

export interface BackgroundImage {
  url: string;
  id: string;
}

interface BackgroundState {
  images: BackgroundImage[];
  currentImageIndex: number;
  interval: number;
  isAutoRotate: boolean;
  transition: string;
  setImages: (images: BackgroundImage[] | ((prev: BackgroundImage[]) => BackgroundImage[])) => void;
  setCurrentImage: (indexOrUpdater: number | ((prev: number) => number)) => void;
  setInterval: (interval: number) => void;
  setAutoRotate: (isAutoRotate: boolean) => void;
  setTransition: (transition: string) => void;
}

// Validate image URL
const isValidImageUrl = (url: string): boolean => {
  return url.startsWith('http') || url.startsWith('https') || url.startsWith('blob:') || url.startsWith('data:image/');
};

export const useBackgroundManager = create<BackgroundState>((set, get) => ({
  images: [
    {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80&blur=0',
      id: 'default-1'
    },
    {
      url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1920&q=80&blur=0',
      id: 'default-2'
    },
    {
      url: 'https://images.unsplash.com/photo-1505144808419-1957a94ca61e?auto=format&fit=crop&w=1920&q=80&blur=0',
      id: 'default-3'
    }
  ] as BackgroundImage[],
  currentImageIndex: 0,
  interval: 3000,
  isAutoRotate: true,
  transition: 'fade',
  setImages: (newImages: BackgroundImage[] | ((prev: BackgroundImage[]) => BackgroundImage[])) => {
    const images = typeof newImages === 'function' ? newImages(get().images) : newImages;
    // Validate images
    const validImages = images.filter(img => {
      const isValid = isValidImageUrl(img.url);
      if (!isValid) {
        console.warn(`Invalid image URL: ${img.url}`);
      }
      return isValid;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Setting new images:', validImages);
    }
    
    set({ 
      images: validImages,
      // Reset current index if necessary
      currentImageIndex: (get().currentImageIndex >= validImages.length) ? 0 : get().currentImageIndex
    });
  },
  setCurrentImage: (indexOrUpdater: number | ((prev: number) => number)) => {
    const state = get();
    const newIndex = typeof indexOrUpdater === 'function' 
      ? indexOrUpdater(state.currentImageIndex)
      : indexOrUpdater;
    
    // Validate index
    if (newIndex < 0 || newIndex >= state.images.length) {
      console.warn('Invalid image index:', newIndex);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Changing image:', {
        from: state.currentImageIndex,
        to: newIndex,
        totalImages: state.images.length
      });
    }
    
    set({ currentImageIndex: newIndex });
  },
  setInterval: (newInterval: number) => {
    // Validate interval (minimum 1 second, maximum 1 hour)
    const validInterval = Math.max(1000, Math.min(newInterval, 3600000));
    if (validInterval !== newInterval) {
      console.warn(`Invalid interval ${newInterval}ms, using ${validInterval}ms instead`);
    }
    set({ interval: validInterval });
  },
  setAutoRotate: (isAutoRotate: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auto-rotate changed:', { isAutoRotate });
    }
    set({ isAutoRotate });
  },
  setTransition: (transition: string) => {
    const validTransitions = ['fade', 'slide', 'none'];
    if (!validTransitions.includes(transition)) {
      console.warn(`Invalid transition "${transition}", using "fade" instead`);
      transition = 'fade';
    }
    set({ transition });
  },
}));

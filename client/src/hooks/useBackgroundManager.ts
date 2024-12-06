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
  setImages: (images: BackgroundImage[]) => void;
  setCurrentImage: (indexOrUpdater: number | ((prev: number) => number)) => void;
  setInterval: (interval: number) => void;
  setAutoRotate: (isAutoRotate: boolean) => void;
  setTransition: (transition: string) => void;
}

export const useBackgroundManager = create<BackgroundState>((set) => ({
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
  interval: 5000,
  isAutoRotate: true,
  transition: 'fade',
  setImages: (images: BackgroundImage[]) => set({ images }),
  setCurrentImage: (indexOrUpdater: number | ((prev: number) => number)) => {
    if (typeof indexOrUpdater === 'function') {
      set((state: BackgroundState) => ({ currentImageIndex: indexOrUpdater(state.currentImageIndex) }));
    } else {
      set({ currentImageIndex: indexOrUpdater });
    }
  },
  setInterval: (interval: number) => set({ interval }),
  setAutoRotate: (isAutoRotate: boolean) => set({ isAutoRotate }),
  setTransition: (transition: string) => set({ transition }),
}));

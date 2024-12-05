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
  setCurrentImage: (index: number) => void;
  setInterval: (interval: number) => void;
  setAutoRotate: (isAutoRotate: boolean) => void;
  setTransition: (transition: string) => void;
}

export const useBackgroundManager = create<BackgroundState>((set: any) => ({
  images: [] as BackgroundImage[],
  currentImageIndex: 0,
  interval: 5000,
  isAutoRotate: false,
  transition: 'fade',
  setImages: (images: BackgroundImage[]) => set({ images }),
  setCurrentImage: (currentImageIndex: number) => set({ currentImageIndex }),
  setInterval: (interval: number) => set({ interval }),
  setAutoRotate: (isAutoRotate: boolean) => set({ isAutoRotate }),
  setTransition: (transition: string) => set({ transition }),
}));

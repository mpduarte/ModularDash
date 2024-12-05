import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useBackgroundManager } from '../../hooks/useBackgroundManager';
import type { BackgroundImage } from '../../hooks/useBackgroundManager';

export const BackgroundManagerPlugin: React.FC = () => {
  const {
    images,
    currentImageIndex,
    interval,
    isAutoRotate,
    setImages,
    setCurrentImage,
    setInterval,
    setAutoRotate,
  } = useBackgroundManager();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    
    if (isAutoRotate && images.length > 1) {
      // Force initial image load
      setCurrentImage(currentImageIndex);
      
      // Set up the interval
      timer = setInterval(() => {
        setCurrentImage((prev: number) => (prev + 1) % images.length);
      }, interval);
      
      console.log('Background rotation started:', { interval, currentIndex: currentImageIndex });
    }

    return () => {
      if (timer !== undefined) {
        clearInterval(timer);
        console.log('Background rotation stopped');
      }
    };
  }, [isAutoRotate, interval, images.length, currentImageIndex, setCurrentImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      const newImages: BackgroundImage[] = Array.from(fileList).map(file => ({
        url: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9)
      }));
      
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (id: string) => {
    setImages(images.filter((img: BackgroundImage) => img.id !== id));
    setCurrentImage(0);
  };

  const currentImage = images[currentImageIndex];

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Background Manager</h3>
      
      <div className="space-y-4">
        <div>
          <Label>Upload Images</Label>
          <Input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleFileChange}
            className="mt-1"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={isAutoRotate}
            onCheckedChange={setAutoRotate}
          />
          <Label>Auto Rotate</Label>
        </div>

        {isAutoRotate && (
          <div>
            <Label>Rotation Interval (seconds)</Label>
            <Slider
              value={[interval / 1000]}
              onValueChange={(value) => setInterval(value[0] * 1000)}
              min={1}
              max={60}
              step={1}
              className="mt-2"
            />
            <span className="text-sm text-gray-500">
              {interval / 1000} seconds
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <img
                src={image.url}
                alt={`Background ${index + 1}`}
                className="w-full h-24 object-cover rounded"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                onClick={() => removeImage(image.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const defaultConfig = {
  images: [
    {
      url: 'https://source.unsplash.com/random/1920x1080?nature',
      id: 'default-1'
    },
    {
      url: 'https://source.unsplash.com/random/1920x1080?landscape',
      id: 'default-2'
    },
    {
      url: 'https://source.unsplash.com/random/1920x1080?city',
      id: 'default-3'
    }
  ] as BackgroundImage[],
  currentImageIndex: 0,
  interval: 5000,
  isAutoRotate: true,
  transition: 'fade',
} as const;

export const backgroundManagerPluginConfig = {
  id: 'background-manager',
  name: 'Background Manager',
  description: 'Manage dashboard background images with auto-rotation',
  version: '1.0.0',
  component: BackgroundManagerPlugin,
  category: 'appearance',
  defaultConfig: defaultConfig,
};

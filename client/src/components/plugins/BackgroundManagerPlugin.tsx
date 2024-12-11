import React, { useState, useEffect, useCallback } from 'react';
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

  // Removed rotation logic as it's now handled by BackgroundZone

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!fileList) return;

    // Convert FileList to array and filter valid images
    const validFiles = Array.from(fileList).filter(file => {
      if (!validImageTypes.includes(file.type)) {
        console.warn(`Invalid file type: ${file.type}. Skipping.`);
        return false;
      }
      if (file.size > maxFileSize) {
        console.warn(`File too large: ${file.name}. Max size is 5MB.`);
        return false;
      }
      return true;
    });

    try {
      // Create object URLs and cleanup old ones if needed
      const newImages: BackgroundImage[] = validFiles.map(file => ({
        url: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));

      // Cleanup old object URLs before setting new ones
      images.forEach(image => {
        if (image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });

      setImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('Error processing uploaded files:', error);
    }

    // Clear input to allow uploading the same file again
    event.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
    // Reset to first image if we remove the current one
    if (images[currentImageIndex].id === id) {
      setCurrentImage(0);
    }
  };

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
            <div 
              key={image.id} 
              className={`relative group rounded overflow-hidden border-2 ${
                index === currentImageIndex ? 'border-primary' : 'border-transparent'
              }`}
            >
              <img
                src={image.url}
                alt={`Background ${index + 1}`}
                className="w-full h-24 object-cover"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
  interval: 8000,
  isAutoRotate: false,
  transition: 'fade',
} as const;

export const backgroundManagerPluginConfig = {
  id: 'background-manager',
  name: 'Background Manager',
  description: 'Manage dashboard background images and rotation settings',
  version: '1.0.0',
  component: BackgroundManagerPlugin,
  category: 'appearance',
  defaultConfig,
  enabled: true,
};

export default BackgroundManagerPlugin;

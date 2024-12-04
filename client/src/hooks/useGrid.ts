import { useState, useCallback } from 'react';
import { Layout } from 'react-grid-layout';

export function useGrid() {
  const [layout, setLayout] = useState<Layout[]>([]);

  const onLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
  }, []);

  const mergeZones = useCallback((zone1: string, zone2: string) => {
    setLayout(current => {
      const item1 = current.find(item => item.i === zone1);
      const item2 = current.find(item => item.i === zone2);
      
      if (!item1 || !item2) return current;

      const minX = Math.min(item1.x, item2.x);
      const minY = Math.min(item1.y, item2.y);
      const maxX = Math.max(item1.x + item1.w, item2.x + item2.w);
      const maxY = Math.max(item1.y + item1.h, item2.y + item2.h);

      return current.filter(item => item.i !== zone2).map(item => {
        if (item.i === zone1) {
          return {
            ...item,
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY
          };
        }
        return item;
      });
    });
  }, []);

  return {
    layout,
    onLayoutChange,
    mergeZones
  };
}

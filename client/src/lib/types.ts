import { Layout } from 'react-grid-layout';

export interface Widget {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

export interface GridLayout extends Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

export interface GridZone {
  id: string;
  name: string;
  widgets: string[];
}

export interface WidgetConfig {
  id: string;
  settings: Record<string, any>;
}

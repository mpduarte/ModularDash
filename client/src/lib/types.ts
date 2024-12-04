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

export interface GridZone {
  id: string;
  name: string;
  widgets: string[];
}

export interface WidgetConfig {
  id: string;
  settings: Record<string, any>;
}

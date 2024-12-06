import { Layout } from 'react-grid-layout';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  config: Record<string, any>;
  component: string;
  category: string;
}

export interface Widget {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
  pluginId: string;
  config: Record<string, any>;
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

export interface PluginProps {
  config: Record<string, any>;
  onConfigChange: (newConfig: Record<string, any>) => void;
}

export type PluginComponent = React.FC<PluginProps>;

export interface PluginRegistry {
  [key: string]: {
    component: PluginComponent;
    defaultConfig: Record<string, any>;
  };
}

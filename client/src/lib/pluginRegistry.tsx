import React from 'react';
import { PluginRegistry, PluginComponent } from './types';
import { backgroundManagerPluginConfig } from '../components/plugins/BackgroundManagerPlugin';
import { WeatherWidget, weatherWidgetConfig } from '../components/plugins/WeatherWidget';
import { TimeWidget, timeWidgetConfig } from '../components/plugins/TimeWidget';
import { CalendarWidget } from '../components/plugins/CalendarWidget';

const registry: PluginRegistry = {};

export function registerPlugin(
  id: string,
  component: PluginComponent,
  defaultConfig: Record<string, any> = {},
  name: string = id,
  version: string = '1.0.0',
  description: string = '',
  category: string = 'widgets'
) {
  console.log(`Registering plugin: ${id}`, { component, defaultConfig, name, version, category });
  registry[id] = {
    component,
    defaultConfig,
    name,
    version,
    description: description || `${name} plugin`,
    category
  };
}

export function getPlugin(id: string) {
  console.log(`Getting plugin: ${id}`, { exists: !!registry[id] });
  const plugin = registry[id];
  if (!plugin) {
    console.warn(`Plugin ${id} not found in registry`);
  }
  return plugin;
}

// Register text widget plugin
const TextWidget: PluginComponent = ({ config }) => (
  <div className="p-4">
    <div className="text-lg">{config.content || 'Empty text widget'}</div>
  </div>
);

registerPlugin(
  'text-widget',
  TextWidget,
  { content: '' },
  'Text Widget',
  '1.0.0',
  'Simple text display widget',
  'content'
);

// Register HTML widget plugin
const HtmlWidget: PluginComponent = ({ config }) => (
  <div 
    className="p-4"
    dangerouslySetInnerHTML={{ __html: config.content || 'Empty HTML widget' }}
  />
);

registerPlugin(
  'html-widget',
  HtmlWidget,
  { content: '' },
  'HTML Widget',
  '1.0.0',
  'Rich HTML content widget',
  'content'
);

// Register background manager plugin
registerPlugin(
  'background-manager',
  backgroundManagerPluginConfig.component,
  backgroundManagerPluginConfig.defaultConfig,
  'Background Manager',
  '1.0.0',
  'Controls dashboard background appearance',
  'appearance'
);

// Register weather widget plugin
registerPlugin(
  'weather-widget',
  WeatherWidget,
  weatherWidgetConfig.defaultConfig,
  weatherWidgetConfig.name,
  weatherWidgetConfig.version,
  'Displays weather information for a specified location',
  'widgets'
);

// Register time widget plugin
registerPlugin(
  'time-widget',
  TimeWidget,
  timeWidgetConfig.defaultConfig,
  timeWidgetConfig.name,
  timeWidgetConfig.version,
  'Displays current time with configurable format',
  'widgets'
);

// Register calendar widget plugin
export const calendarWidgetConfig = {
  id: 'calendar-widget',
  name: 'Calendar Widget',
  description: 'Display calendar events from iCal/WebCal/CalDAV feeds',
  version: '1.0.0',
  component: CalendarWidget,
  category: 'widgets',
  defaultConfig: {
    calendarUrl: '',
    autoRefresh: false,
    refreshInterval: 300,
    title: 'Calendar'
  }
};

registerPlugin(
  calendarWidgetConfig.id,
  calendarWidgetConfig.component,
  calendarWidgetConfig.defaultConfig,
  calendarWidgetConfig.name,
  calendarWidgetConfig.version,
  calendarWidgetConfig.description,
  calendarWidgetConfig.category
);

export default registry;

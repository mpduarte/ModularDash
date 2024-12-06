import React from 'react';
import { PluginRegistry, PluginComponent } from './types';
import { backgroundManagerPluginConfig } from '../components/plugins/BackgroundManagerPlugin';
import { WeatherWidget, weatherWidgetConfig } from '../components/plugins/WeatherWidget';

const registry: PluginRegistry = {};

export function registerPlugin(
  id: string,
  component: PluginComponent,
  defaultConfig: Record<string, any> = {}
) {
  console.log(`Registering plugin: ${id}`, { component, defaultConfig });
  registry[id] = {
    component,
    defaultConfig,
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

registerPlugin('text-widget', TextWidget, {
  content: ''
});

// Register HTML widget plugin
const HtmlWidget: PluginComponent = ({ config }) => (
  <div 
    className="p-4"
    dangerouslySetInnerHTML={{ __html: config.content || 'Empty HTML widget' }}
  />
);

registerPlugin('html-widget', HtmlWidget, {
  content: ''
});

// Register background manager plugin
registerPlugin(
  backgroundManagerPluginConfig.id,
  backgroundManagerPluginConfig.component,
  backgroundManagerPluginConfig.defaultConfig
);

// Register weather widget plugin
registerPlugin(
  'weather-widget',
  WeatherWidget,
  {
    city: 'San Francisco',
    units: 'imperial',
    refreshInterval: 300000
  }
);

export default registry;

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
  registry[id] = {
    component,
    defaultConfig,
  };
}

export function getPlugin(id: string) {
  return registry[id];
}

// Register text widget plugin
registerPlugin('text-widget', ({ config }) => (
  <div className="p-4">
    <div className="text-lg">{config.content || 'Empty text widget'}</div>
  </div>
) as PluginComponent, {
  content: ''
});

// Register HTML widget plugin
registerPlugin('html-widget', ({ config }) => (
  <div 
    className="p-4"
    dangerouslySetInnerHTML={{ __html: config.content || 'Empty HTML widget' }}
  />
), {
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
  weatherWidgetConfig.id,
  weatherWidgetConfig.component,
  weatherWidgetConfig.defaultConfig
);

export default registry;

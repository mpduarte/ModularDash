import { PluginRegistry, PluginComponent } from './types';

const registry: PluginRegistry = {};

export function registerPlugin(
  id: string,
  component: PluginComponent,
  defaultConfig: Record<string, any> = {}
) {
  console.log(`Registering plugin: ${id}`);
  try {
    if (!component) {
      throw new Error(`Invalid component for plugin: ${id}`);
    }
    registry[id] = { component, defaultConfig };
    console.log(`Successfully registered plugin: ${id}`, { defaultConfig });
  } catch (error) {
    console.error(`Failed to register plugin ${id}:`, error);
    throw error;
  }
}

export function getPlugin(id: string) {
  return registry[id];
}

export function getAllPlugins() {
  return Object.entries(registry).map(([id, plugin]) => ({
    id,
    ...plugin,
  }));
}

// Register built-in plugins here
import { backgroundManagerPluginConfig } from '../components/plugins/BackgroundManagerPlugin';

registerPlugin('text-widget', ({ config }) => (
  <div className="p-4">
    <p>{config.text || 'Empty text widget'}</p>
  </div>
), { text: '' });

registerPlugin('html-widget', ({ config }) => (
  <div className="p-4" dangerouslySetInnerHTML={{ __html: config.html || '' }} />
), { html: '' });

// Register background manager plugin
console.log('Registering background manager plugin with config:', backgroundManagerPluginConfig);
registerPlugin(
  backgroundManagerPluginConfig.id,
  backgroundManagerPluginConfig.component,
  backgroundManagerPluginConfig.defaultConfig
);

export default registry;

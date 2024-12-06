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
import { weatherWidgetConfig } from '../components/plugins/WeatherWidget';

// Register text widget plugin
registerPlugin('text-widget', ({ config }) => (
  <div className="p-4">
    <p>{config.text || 'Empty text widget'}</p>
  </div>
), { text: '' });

// Register HTML widget plugin
registerPlugin('html-widget', ({ config }) => (
  <div className="p-4" dangerouslySetInnerHTML={{ __html: config.html || '' }} />
), { html: '' });

// Register background manager plugin
console.log('Registering background manager plugin:', backgroundManagerPluginConfig);

// Initialize the plugin in the registry
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

// Ensure the plugin is registered in the database
async function initializeBackgroundManager() {
  try {
    const response = await fetch('/api/plugins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: backgroundManagerPluginConfig.id,
        name: backgroundManagerPluginConfig.name,
        description: backgroundManagerPluginConfig.description,
        version: backgroundManagerPluginConfig.version,
        enabled: true,
        config: backgroundManagerPluginConfig.defaultConfig,
        component: 'BackgroundManagerPlugin',
        category: backgroundManagerPluginConfig.category,
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to register background manager plugin:', await response.text());
    }
  } catch (error) {
    console.error('Error registering background manager plugin:', error);
  }
}

// Initialize the background manager plugin
initializeBackgroundManager();

export default registry;

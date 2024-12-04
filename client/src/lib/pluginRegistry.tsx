import { PluginRegistry, PluginComponent } from './types';

const registry: PluginRegistry = {};

export function registerPlugin(
  id: string,
  component: PluginComponent,
  defaultConfig: Record<string, any> = {}
) {
  registry[id] = { component, defaultConfig };
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
registerPlugin('text-widget', ({ config }) => (
  <div className="p-4">
    <p>{config.text || 'Empty text widget'}</p>
  </div>
), { text: '' });

registerPlugin('html-widget', ({ config }) => (
  <div className="p-4" dangerouslySetInnerHTML={{ __html: config.html || '' }} />
), { html: '' });

export default registry;

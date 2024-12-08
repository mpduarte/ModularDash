import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plugin } from '../lib/types';
import registry from '../lib/pluginRegistry';

export function usePlugins() {
  const queryClient = useQueryClient();

  const { 
    data: plugins = [], 
    isLoading,
    isError,
    error
  } = useQuery<Plugin[], Error>({
    queryKey: ['plugins'],
    queryFn: async () => {
      console.log('Starting plugin fetch...');
      try {
        // First, get registered plugins from the registry
        const registeredPlugins = Object.entries(registry).map(([id, plugin]) => {
          console.log(`Processing plugin registration for: ${id}`, plugin);
          return {
            id,
            name: plugin.name,
            description: plugin.description || `${plugin.name} plugin`,
            version: plugin.version,
            enabled: true,
            config: plugin.defaultConfig || {},
            component: plugin.component,
            category: plugin.category || (id.toLowerCase().includes('widget') ? 'widgets' : 'appearance')
          };
        });
        
        console.log('Registered plugins:', registeredPlugins);

        // Return the registered plugins directly
        return registeredPlugins;
      } catch (error) {
        console.error('Plugin fetch error:', error);
        throw error;
      }
    },
    staleTime: 30000,
    retry: 2,
    refetchOnWindowFocus: false
  });

  const updatePlugin = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Plugin> }) => {
      // Update plugin in local registry
      if (registry[id]) {
        registry[id] = {
          ...registry[id],
          ...updates,
        };
      }
      return { id, ...updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    }
  });

  return {
    plugins,
    updatePlugin: (id: string, updates: Partial<Plugin>) => 
      updatePlugin.mutate({ id, updates }),
    isLoading,
    isError,
    error
  };
}
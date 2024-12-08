import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plugin } from '../lib/types';

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
        const response = await fetch('/api/plugins');
        console.log('Plugin API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Plugin API error response:', errorText);
          throw new Error(`Failed to fetch plugins: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Raw API response:', data);

        if (!Array.isArray(data)) {
          console.error('Invalid data structure received:', data);
          throw new Error('Invalid plugins data received - expected array');
        }

        // Map and validate each plugin
        const processedPlugins = data.map((plugin: any) => {
          console.log('Processing plugin:', plugin);
          if (!plugin.id || !plugin.name) {
            console.warn('Invalid plugin structure:', plugin);
          }
          return {
            ...plugin,
            enabled: plugin.enabled ?? true,
            category: plugin.category || 'other',
            config: plugin.config || {}
          };
        });

        const enabledPlugins = processedPlugins.filter((plugin: Plugin) => plugin.enabled);
        console.log('Final processed plugins:', enabledPlugins);
        
        return enabledPlugins;
      } catch (error) {
        console.error('Plugin fetch error:', error);
        throw error;
      }
    },
    staleTime: 30000,
    retry: 2,
    refetchOnWindowFocus: false
  });

  const installPlugin = useMutation({
    mutationFn: async (plugin: Omit<Plugin, 'id'>) => {
      const response = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plugin)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    }
  });

  const updatePlugin = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Plugin> }) => {
      const response = await fetch(`/api/plugins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    }
  });

  const uninstallPlugin = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/plugins/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    }
  });

  return {
    plugins,
    installPlugin: (plugin: Omit<Plugin, 'id'>) => installPlugin.mutate(plugin),
    updatePlugin: (id: string, updates: Partial<Plugin>) => 
      updatePlugin.mutate({ id, updates }),
    uninstallPlugin: (id: string) => uninstallPlugin.mutate(id),
    isLoading: isLoading || installPlugin.isPending || updatePlugin.isPending || uninstallPlugin.isPending,
    isError,
    error
  };
}

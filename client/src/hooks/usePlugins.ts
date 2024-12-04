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
      try {
        console.log('Fetching plugins...');
        const response = await fetch('/api/plugins');
        if (!response.ok) {
          throw new Error(`Failed to fetch plugins: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Plugins fetched successfully:', data);
        return data;
      } catch (error) {
        console.error('Error fetching plugins:', error);
        throw error;
      }
    }
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
    isLoading: installPlugin.isPending || updatePlugin.isPending || uninstallPlugin.isPending
  };
}

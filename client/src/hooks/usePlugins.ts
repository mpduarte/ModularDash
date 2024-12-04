import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plugin } from '../lib/types';

export function usePlugins() {
  const queryClient = useQueryClient();

  const { data: plugins = [] } = useQuery<Plugin[]>({
    queryKey: ['plugins'],
    queryFn: async () => {
      const response = await fetch('/api/plugins');
      return response.json();
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

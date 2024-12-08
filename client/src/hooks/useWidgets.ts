import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Widget } from '../lib/types';
import { getPlugin } from '../lib/pluginRegistry';

export function useWidgets() {
  const queryClient = useQueryClient();

  const { data: widgets = [] } = useQuery<Widget[]>({
    queryKey: ['widgets'],
    queryFn: async () => {
      const response = await fetch('/api/widgets');
      return response.json();
    }
  });

  const updateWidget = useMutation({
    mutationFn: async (updates: { id: string, updates?: Partial<Widget>, delete?: boolean }) => {
      if (updates.delete) {
        const response = await fetch(`/api/widgets/${updates.id}`, {
          method: 'DELETE'
        });
        return { id: updates.id };
      } else {
        const response = await fetch(`/api/widgets/${updates.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates.updates)
        });
        return response.json();
      }
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['widgets'] });
      const previousWidgets = queryClient.getQueryData<Widget[]>(['widgets']);
      if (previousWidgets) {
        queryClient.setQueryData(['widgets'], previousWidgets.filter(widget => 
          updates.delete ? widget.id !== updates.id : true
        ).map(widget => 
          widget.id === updates.id && updates.updates
            ? { ...widget, ...updates.updates }
            : widget
        ));
      }
      return { previousWidgets };
    },
    onError: (_err, _updates, context) => {
      if (context?.previousWidgets) {
        queryClient.setQueryData(['widgets'], context.previousWidgets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
    }
  });

  const addWidget = useMutation({
    mutationFn: async (pluginId: string) => {
      // Get the plugin's default configuration
      const plugin = getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }
      
      // Get default configuration and name based on plugin type
      const defaultConfig = plugin.defaultConfig || {};
      let defaultTitle;
      
      // Check specific plugin configurations
      if (pluginId === 'time-widget') {
        defaultTitle = 'Clock';
      } else if (pluginId === 'weather-widget') {
        defaultTitle = defaultConfig.city ? `Weather - ${defaultConfig.city}` : 'Weather';
      } else {
        defaultTitle = plugin.name || 'New Widget';
      }

      const response = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: defaultTitle,
          content: '',
          x: 0,
          y: 0,
          w: 1,
          h: 1,
          pluginId,
          config: defaultConfig
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
    }
  });

  const removeWidget = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/widgets/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
    }
  });

  return {
    widgets,
    updateWidget: (id: string, updates: Partial<Widget>) => {
      if (updates.visible === false) {
        removeWidget.mutate(id);
      } else {
        updateWidget.mutate({ id, updates });
      }
    },
    addWidget: (pluginId: string) => addWidget.mutate(pluginId),
    removeWidget: (id: string) => removeWidget.mutate(id)
  };
}

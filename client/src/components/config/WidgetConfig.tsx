import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Widget, Plugin } from "../../lib/types";
import { getPlugin } from "../../lib/pluginRegistry";
import { Plus, Trash2, Power, ChevronDown } from "lucide-react";
import { usePlugins } from "../../hooks/usePlugins";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface WidgetConfigProps {
  widgets: Widget[];
  onClose: () => void;
  onAdd: (pluginId: string) => void;
  onRemove: (id: string) => void;
  open: boolean;
}

export default function WidgetConfig({ widgets, onClose, onAdd, onRemove, open }: WidgetConfigProps) {
  const { plugins, updatePlugin, isLoading, isError, error } = usePlugins();
  const [activeTab, setActiveTab] = useState("widgets");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Dashboard Configuration</DialogTitle>
          <DialogDescription>
            Manage your widgets and plugins
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
          </TabsList>

          <TabsContent value="widgets" className="py-4">
            <div className="space-y-4">
              {plugins
                .filter(plugin => plugin.enabled && plugin.config?.category && 
                  (plugin.config.category === 'widgets' || plugin.config.category === 'content'))
                .map(plugin => {
                  console.log('Rendering plugin button:', plugin);
                  const registeredPlugin = getPlugin(plugin.id);
                  if (!registeredPlugin) {
                    console.warn(`Plugin ${plugin.id} not found in registry`);
                    return null;
                  }
                  return (
                    <Button
                      key={plugin.id}
                      onClick={() => {
                        console.log('Adding widget for plugin:', plugin);
                        onAdd(plugin.id);
                      }}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add {plugin.name}
                    </Button>
                  );
                }).filter(Boolean)}
            </div>
            
            <ScrollArea className="h-[300px]">
              {widgets.map(widget => (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg"
                >
                  <span>{widget.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(widget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="plugins" className="py-4">
            <ScrollArea className="h-[400px]">
              {isLoading && (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              {isError && (
                <div className="p-4 text-destructive text-center">
                  <p>Error loading plugins: {error?.message}</p>
                </div>
              )}
              {!isLoading && !isError && (() => {
                // Group plugins by category
                const pluginsByCategory = plugins.reduce((acc, plugin) => {
                  const category = plugin.category || 'other';
                  if (!acc[category]) {
                    acc[category] = [];
                  }
                  acc[category].push(plugin);
                  return acc;
                }, {} as Record<string, Plugin[]>);

                // Render plugins by category
                return Object.entries(pluginsByCategory).map(([category, categoryPlugins]) => (
                  <Collapsible key={category} className="mb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold capitalize">{category}</h3>
                        <Badge variant="secondary">
                          {categoryPlugins.length} {categoryPlugins.length === 1 ? 'plugin' : 'plugins'}
                        </Badge>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      {categoryPlugins.map(plugin => {
                        const PluginComponent = getPlugin(plugin.id)?.component;
                        return (
                          <Card key={plugin.id} className="mb-2">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{plugin.name}</h4>
                                    <Badge variant="secondary" className="text-xs">
                                      v{plugin.version}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-4">{plugin.description}</p>
                                  {plugin.enabled && PluginComponent && (
                                    <div className="mt-4 border-t pt-4">
                                      <PluginComponent
                                        config={plugin.config || {}}
                                        onConfigChange={(newConfig) => updatePlugin(plugin.id, { config: newConfig })}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Power className={`h-4 w-4 ${plugin.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <Switch
                                      checked={plugin.enabled}
                                      onCheckedChange={(checked) => updatePlugin(plugin.id, { enabled: checked })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                ));
              })()}
            </ScrollArea>
          </TabsContent>
        
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Widget, Plugin } from "../../lib/types";
import { getPlugin } from "../../lib/pluginRegistry";
import { Plus, Trash2, Power, ChevronDown, ChevronRight } from "lucide-react";
import { usePlugins } from "../../hooks/usePlugins";
import { useState } from "react";
import { useWidgets } from "../../hooks/useWidgets";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { updateWidget } = useWidgets();
  const [activeTab, setActiveTab] = useState("widgets");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Dashboard Configuration</DialogTitle>
          <DialogDescription>
            Manage your widgets and plugins
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
          </TabsList>

          <TabsContent value="widgets" className="py-4">
            <div className="space-y-4">
              {plugins
                .filter(plugin => plugin.enabled && 
                  (plugin.category === 'widgets' || plugin.category === 'content'))
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
                      Add {plugin.name || (plugin.id === 'time-widget' ? 'Time Widget' : plugin.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))}
                    </Button>
                  );
                }).filter(Boolean)}
            </div>
            
            <ScrollArea className="h-[300px] mt-4">
              {widgets.map(widget => {
                const isTimeWidget = widget.pluginId === 'time-widget';
                const isWeatherWidget = widget.pluginId === 'weather-widget';
                const config = widget.config || {};
                
                return (
                  <Collapsible key={widget.id}>
                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
                      <CollapsibleTrigger className="flex-1 text-left flex items-center gap-2 group">
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                        <span>{widget.title || (isWeatherWidget ? 'Weather Widget' : 'Widget')}</span>
                      </CollapsibleTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(widget.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <CollapsibleContent>
                      <div className="space-y-4 p-4 border rounded-lg mx-3 mb-3">
                        {isTimeWidget && (
                          <>
                            <div className="space-y-2">
                              <Label>Display Mode</Label>
                              <Select
                                value={config.displayMode || 'digital'}
                                onValueChange={(value) => {
                                  updateWidget(widget.id, {
                                    config: { ...config, displayMode: value }
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select display mode" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="digital">Digital</SelectItem>
                                  <SelectItem value="analog">Analog</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center justify-between">
                              <Label>Show Seconds</Label>
                              <Switch
                                checked={config.showSeconds || false}
                                onCheckedChange={(checked) => {
                                  updateWidget(widget.id, {
                                    config: { ...config, showSeconds: checked }
                                  });
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label>24-Hour Format</Label>
                              <Switch
                                checked={config.use24Hour || false}
                                onCheckedChange={(checked) => {
                                  updateWidget(widget.id, {
                                    config: { ...config, use24Hour: checked }
                                  });
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label>Show Date</Label>
                              <Switch
                                checked={config.showDate || true}
                                onCheckedChange={(checked) => {
                                  updateWidget(widget.id, {
                                    config: { ...config, showDate: checked }
                                  });
                                }}
                              />
                            </div>

                            {config.showDate && (
                              <div className="space-y-2">
                                <Label>Date Format</Label>
                                <Select
                                  value={config.dateFormat || 'PPP'}
                                  onValueChange={(value) => {
                                    updateWidget(widget.id, {
                                      config: { ...config, dateFormat: value }
                                    });
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select date format" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PPP">Long (December 8th, 2024)</SelectItem>
                                    <SelectItem value="PP">Medium (Dec 8, 2024)</SelectItem>
                                    <SelectItem value="P">Short (12/08/2024)</SelectItem>
                                    <SelectItem value="PPPP">Full (Sunday, December 8th, 2024)</SelectItem>
                                    <SelectItem value="MMMM d, yyyy">Custom (December 8, 2024)</SelectItem>
                                    <SelectItem value="MMM d">Month Day (Dec 8)</SelectItem>
                                    <SelectItem value="EEEE">Weekday Only (Sunday)</SelectItem>
                                    <SelectItem value="do">Day with Ordinal (8th)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {config.displayMode === 'analog' && (
                              <>
                                <div className="space-y-2">
                                  <Label>Clock Size</Label>
                                  <Input
                                    type="number"
                                    min="100"
                                    max="400"
                                    value={config.clockSize || 200}
                                    onChange={(e) => {
                                      updateWidget(widget.id, {
                                        config: { ...config, clockSize: Number(e.target.value) }
                                      });
                                    }}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label>Show Hour Marks</Label>
                                  <Switch
                                    checked={config.showHourMarks || true}
                                    onCheckedChange={(checked) => {
                                      updateWidget(widget.id, {
                                        config: { ...config, showHourMarks: checked }
                                      });
                                    }}
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label>Show Minute Marks</Label>
                                  <Switch
                                    checked={config.showMinuteMarks || true}
                                    onCheckedChange={(checked) => {
                                      updateWidget(widget.id, {
                                        config: { ...config, showMinuteMarks: checked }
                                      });
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {widget.pluginId === 'weather-widget' && (
                          <>
                            <div className="space-y-2">
                              <Label>City</Label>
                              <Input
                                placeholder="Enter city (e.g., San Francisco, CA, USA)"
                                value={config.city || ''}
                                onChange={(e) => {
                                  updateWidget(widget.id, {
                                    config: { ...config, city: e.target.value }
                                  });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Units</Label>
                              <Select
                                value={config.units || 'imperial'}
                                onValueChange={(value) => {
                                  updateWidget(widget.id, {
                                    config: { ...config, units: value }
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select units" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="imperial">Fahrenheit (°F)</SelectItem>
                                  <SelectItem value="metric">Celsius (°C)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                        {widget.pluginId === 'calendar-widget' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Calendar URL</Label>
                              <Input
                                placeholder="Enter iCal/WebCal/CalDAV feed URL"
                                value={config.calendarUrl || ''}
                                onChange={(e) => {
                                  updateWidget(widget.id, {
                                    config: { ...config, calendarUrl: e.target.value }
                                  });
                                }}
                              />
                              <p className="text-sm text-muted-foreground">
                                Enter a webcal:// or https:// URL for your calendar feed
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Label>Auto Refresh</Label>
                          <Switch
                            checked={config.autoRefresh || false}
                            onCheckedChange={(checked) => {
                              updateWidget(widget.id, {
                                config: { ...config, autoRefresh: checked }
                              });
                            }}
                          />
                        </div>
                        {config.autoRefresh && (
                          <div className="space-y-2">
                            <Label>Refresh Interval (seconds)</Label>
                            <Input
                              type="number"
                              min="5"
                              value={config.refreshInterval || 30}
                              onChange={(e) => {
                                updateWidget(widget.id, {
                                  config: { ...config, refreshInterval: Number(e.target.value) }
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="plugins" className="py-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="ml-2">Loading plugins...</span>
                  </div>
                ) : isError ? (
                  <div className="p-4 text-destructive text-center">
                    <p>Error loading plugins: {error?.message}</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <>
                    {Object.entries(
                      plugins.reduce((acc, plugin) => {
                        if (!plugin) {
                          console.warn('Found null or undefined plugin in the list');
                          return acc;
                        }
                        
                        // Skip widget plugins in the plugins tab
                        if (plugin.category === 'widgets' || plugin.category === 'content' || plugin.id.includes('widget')) {
                          return acc;
                        }
                        
                        let category = plugin.category || 'other';
                        if (category === 'appearance') {
                          category = 'appearance';
                        }
                        
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push(plugin);
                        return acc;
                      }, {} as Record<string, Plugin[]>)
                    ).map(([category, categoryPlugins]) => (
                      <Collapsible key={category} defaultOpen className="mb-4">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted"
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold capitalize">{category}</h3>
                              <Badge variant="secondary">
                                {categoryPlugins.length} {categoryPlugins.length === 1 ? 'plugin' : 'plugins'}
                              </Badge>
                            </div>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-2">
                          {categoryPlugins.map(plugin => {
                            const registeredPlugin = getPlugin(plugin.id);
                            const PluginComponent = registeredPlugin?.component;
                            return (
                              <Card key={plugin.id} className="mb-2 overflow-hidden">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium">{plugin.name}</h4>
                                        <Badge variant="secondary" className="text-xs">
                                          v{plugin.version}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-4">
                                        {plugin.description}
                                      </p>
                                      {plugin.id === 'weather-widget' && (
                                        <div className="space-y-4">
                                          <div className="space-y-2">
                                            <Label>API Key</Label>
                                            <Input
                                              type="password"
                                              placeholder="Enter OpenWeather API key"
                                              value={plugin.config?.apiKey || ''}
                                              onChange={(e) => {
                                                updatePlugin(plugin.id, {
                                                  config: {
                                                    ...(plugin.config || {}),
                                                    apiKey: e.target.value
                                                  },
                                                  enabled: plugin.enabled,
                                                  id: plugin.id,
                                                  version: plugin.version
                                                });
                                              }}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                              Required for weather data fetching
                                            </p>
                                          </div>
                                          <div className="space-y-2">
                                            <Label>City</Label>
                                            <Input
                                              placeholder="Enter city (e.g., San Francisco, CA, USA)"
                                              value={plugin.config?.city || ''}
                                              onChange={(e) => {
                                                updatePlugin(plugin.id, {
                                                  config: {
                                                    ...(plugin.config || {}),
                                                    city: e.target.value
                                                  },
                                                  enabled: plugin.enabled,
                                                  id: plugin.id,
                                                  version: plugin.version
                                                });
                                              }}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>Units</Label>
                                            <Select
                                              value={plugin.config?.units || 'imperial'}
                                              onValueChange={(value) => {
                                                updatePlugin(plugin.id, {
                                                  config: { ...plugin.config, units: value },
                                                  enabled: plugin.enabled
                                                });
                                              }}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select units" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="imperial">Fahrenheit (°F)</SelectItem>
                                                <SelectItem value="metric">Celsius (°C)</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                      )}
                                      {Boolean(plugin.component) && (
                            <div className="mt-4 border-t pt-4">
                              <PluginComponent
                                config={plugin.config || {}}
                                onConfigChange={(newConfig) => {
                                  updatePlugin(plugin.id, { 
                                    config: { ...plugin.config, ...newConfig },
                                    enabled: plugin.enabled 
                                  });
                                }}
                              />
                            </div>
                          )}
                          <div className="mt-4 pt-4">
                            {plugin?.id === 'calendar-widget' && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Calendar URL</Label>
                                  <Input
                                    placeholder="Enter iCal/WebCal/CalDAV feed URL"
                                    value={plugin.config?.calendarUrl || ''}
                                    onChange={(e) => {
                                      updatePlugin(plugin.id, { 
                                        config: { ...plugin.config, calendarUrl: e.target.value },
                                        enabled: plugin.enabled 
                                      });
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label>Auto Refresh</Label>
                                  <Switch
                                    checked={plugin.config?.autoRefresh || false}
                                    onCheckedChange={(checked) => {
                                      updatePlugin(plugin.id, { 
                                        config: { ...plugin.config, autoRefresh: checked },
                                        enabled: plugin.enabled 
                                      });
                                    }}
                                  />
                                </div>
                                {plugin.config?.autoRefresh && (
                                  <div className="space-y-2">
                                    <Label>Refresh Interval (seconds)</Label>
                                    <Input
                                      type="number"
                                      min="5"
                                      value={plugin.config?.refreshInterval || 30}
                                      onChange={(e) => {
                                        updatePlugin(plugin.id, { 
                                          config: { ...plugin.config, refreshInterval: Number(e.target.value) },
                                          enabled: plugin.enabled 
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <Power className={`h-4 w-4 ${plugin.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <Switch
                                          checked={plugin.enabled}
                                          onCheckedChange={(checked) => {
                                            updatePlugin(plugin.id, { enabled: checked });
                                          }}
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
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
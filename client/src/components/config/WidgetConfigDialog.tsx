import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Widget as WidgetType } from "../../lib/types";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPlugin } from "../../lib/pluginRegistry";
import { useState } from "react";

interface WidgetConfigDialogProps {
  widget: WidgetType;
  onClose: () => void;
  onUpdate: (updates: Partial<WidgetType>) => void;
}

export default function WidgetConfigDialog({ widget, onClose, onUpdate }: WidgetConfigDialogProps) {
  console.log('WidgetConfigDialog mounted with props:', { widget, pluginId: widget.pluginId });
  const plugin = getPlugin(widget.pluginId);
  console.log('Plugin found:', plugin);
  const [activeTab, setActiveTab] = useState("basic");
  
  type WeatherWidgetConfig = {
    title: string;
    city?: string;
    units?: 'imperial' | 'metric';
    autoRefresh: boolean;
    refreshInterval: number;
    theme: string;
    layout: string;
    visualMode: string;
    background: string;
    animations: boolean;
    dataSource: string;
    customStyles: string;
    borderRadius: string;
    padding: string;
    enableAlerts: boolean;
    alertThreshold: number;
    alertType: string;
    weatherCondition: string;
    [key: string]: any; // Allow for dynamic properties
  };

const form = useForm<WeatherWidgetConfig>({
    defaultValues: {
      title: widget.title,
      ...(widget.pluginId === 'weather-widget' ? {
        city: widget.config.city || "San Francisco, CA, USA",
        units: (widget.config.units as 'imperial' | 'metric') || "imperial",
      } : {}),
      autoRefresh: widget.config.autoRefresh || false,
      refreshInterval: widget.config.refreshInterval || 30,
      theme: widget.config.theme || "default",
      layout: widget.config.layout || "standard",
      visualMode: widget.config.visualMode || "auto",
      background: widget.config.background || "solid",
      animations: widget.config.animations ?? true,
      dataSource: widget.config.dataSource || "api",
      customStyles: widget.config.customStyles || "",
      borderRadius: widget.config.borderRadius || "default",
      padding: widget.config.padding || "normal",
      enableAlerts: widget.config.enableAlerts || false,
      alertThreshold: widget.config.alertThreshold || 80,
      alertType: widget.config.alertType || "visual",
      weatherCondition: widget.config.weatherCondition || "rain",
    } as WeatherWidgetConfig,
  });

  const onSubmit = (data: WeatherWidgetConfig) => {
    if (widget.pluginId === 'weather-widget') {
      const { city, units, titleFormat, autoRefresh, refreshInterval, theme, ...pluginConfig } = data;
      onUpdate({
        config: {
          city,
          units,
          titleFormat,
          autoRefresh,
          refreshInterval,
          theme,
          ...pluginConfig,
        },
      });
    } else {
      const { title, autoRefresh, refreshInterval, theme, ...pluginConfig } = data;
      onUpdate({
        title,
        config: {
          autoRefresh,
          refreshInterval,
          theme,
          ...pluginConfig,
        },
      });
    }
    onClose();
  };

  const presetConfigs = {
    default: {
      autoRefresh: false,
      refreshInterval: 30,
      theme: "default",
      layout: "standard",
      visualMode: "auto",
      background: "solid",
      animations: true
    },
    realtime: {
      autoRefresh: true,
      refreshInterval: 5,
      theme: "minimal",
      layout: "compact",
      visualMode: "dark",
      background: "blur",
      animations: true
    },
    compact: {
      autoRefresh: false,
      refreshInterval: 60,
      theme: "compact",
      layout: "minimal",
      visualMode: "light",
      background: "transparent",
      animations: false
    },
    performance: {
      autoRefresh: true,
      refreshInterval: 15,
      theme: "performance",
      layout: "dense",
      visualMode: "high-contrast",
      background: "solid",
      animations: false
    }
  };

  const applyPreset = (preset: keyof typeof presetConfigs) => {
    const config = presetConfigs[preset];
    Object.entries(config).forEach(([key, value]) => {
      form.setValue(key as any, value, { shouldValidate: true });
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Configure Widget</DialogTitle>
          <DialogDescription>
            Customize widget settings and appearance
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="presets">Presets</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                {widget.pluginId !== 'weather-widget' && (
                  <div className="space-y-2">
                    <Label htmlFor="title">Widget Title</Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                    />
                  </div>
                )}

                {plugin?.component && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Plugin Settings</h4>
                    {widget.pluginId === 'weather-widget' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            {...form.register("city")}
                            placeholder="Enter city name (e.g., San Francisco, CA, USA)"
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="titleFormat">Location Display Format</Label>
                            <Select
                              value={form.watch("titleFormat") || "city-state-country"}
                              onValueChange={(value) => form.setValue("titleFormat", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select title format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="city-only">City Only</SelectItem>
                                <SelectItem value="city-country">City, Country</SelectItem>
                                <SelectItem value="city-state">City, State</SelectItem>
                                <SelectItem value="city-state-country">City, State, Country</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="units">Temperature Units</Label>
                            <Select
                              value={form.watch("units") || "imperial"}
                              onValueChange={(value: 'imperial' | 'metric') => form.setValue("units", value)}
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
                      </div>
                    ) : (
                      <plugin.component
                        config={widget.config}
                        onConfigChange={(newConfig) => {
                          Object.entries(newConfig).forEach(([key, value]) => {
                            form.setValue(key as any, value, {
                              shouldValidate: true,
                            });
                          });
                        }}
                      />
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4">
                <Card>
                  <CardContent className="pt-6">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="autoRefresh">Auto Refresh</Label>
                          <Switch
                            id="autoRefresh"
                            checked={form.watch("autoRefresh")}
                            onCheckedChange={(checked) => form.setValue("autoRefresh", checked)}
                          />
                        </div>

                        {form.watch("autoRefresh") && (
                          <div className="space-y-2">
                            <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                            <Input
                              id="refreshInterval"
                              type="number"
                              min="5"
                              {...form.register("refreshInterval")}
                            />
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="theme">Widget Theme</Label>
                            <Select
                              value={form.watch("theme")}
                              onValueChange={(value) => form.setValue("theme", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select theme" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="minimal">Minimal</SelectItem>
                                <SelectItem value="compact">Compact</SelectItem>
                                <SelectItem value="performance">Performance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="layout">Layout Style</Label>
                            <Select
                              value={form.watch("layout")}
                              onValueChange={(value) => form.setValue("layout", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select layout" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="compact">Compact</SelectItem>
                                <SelectItem value="minimal">Minimal</SelectItem>
                                <SelectItem value="dense">Dense</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="visualMode">Visual Mode</Label>
                            <Select
                              value={form.watch("visualMode")}
                              onValueChange={(value) => form.setValue("visualMode", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select visual mode" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Auto (System)</SelectItem>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="high-contrast">High Contrast</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="background">Background Style</Label>
                            <Select
                              value={form.watch("background")}
                              onValueChange={(value) => form.setValue("background", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select background" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="solid">Solid</SelectItem>
                                <SelectItem value="transparent">Transparent</SelectItem>
                                <SelectItem value="blur">Blur</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="animations">Enable Animations</Label>
                            <Switch
                              id="animations"
                              checked={form.watch("animations")}
                              onCheckedChange={(checked) => form.setValue("animations", checked)}
                            />
                          </div>

                          <div className="space-y-2 pt-4 border-t">
                            <h4 className="font-medium">Data Source Settings</h4>
                            <Select
                              value={form.watch("dataSource")}
                              onValueChange={(value) => form.setValue("dataSource", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select data source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="api">API</SelectItem>
                                <SelectItem value="database">Database</SelectItem>
                                <SelectItem value="static">Static</SelectItem>
                                <SelectItem value="realtime">Real-time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 pt-4 border-t">
                            <h4 className="font-medium">Custom Styling</h4>
                            <div className="space-y-2">
                              <Label htmlFor="borderRadius">Border Radius</Label>
                              <Select
                                value={form.watch("borderRadius")}
                                onValueChange={(value) => form.setValue("borderRadius", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select border radius" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Default</SelectItem>
                                  <SelectItem value="rounded">Rounded</SelectItem>
                                  <SelectItem value="square">Square</SelectItem>
                                  <SelectItem value="pill">Pill</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="padding">Padding</Label>
                              <Select
                                value={form.watch("padding")}
                                onValueChange={(value) => form.setValue("padding", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select padding" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="compact">Compact</SelectItem>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="relaxed">Relaxed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="customStyles">Custom CSS</Label>
                              <Input
                                id="customStyles"
                                placeholder="Enter custom CSS"
                                {...form.register("customStyles")}
                              />
                            </div>
                          </div>

                          <div className="space-y-4 pt-4 border-t">
                            <h4 className="font-medium">Weather Alert Settings</h4>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="enableAlerts">Enable Weather Alerts</Label>
                              <Switch
                                id="enableAlerts"
                                checked={form.watch("enableAlerts")}
                                onCheckedChange={(checked) => form.setValue("enableAlerts", checked)}
                              />
                            </div>

                            {form.watch("enableAlerts") && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="alertThreshold">Temperature Threshold (°F)</Label>
                                  <Input
                                    id="alertThreshold"
                                    type="number"
                                    min="0"
                                    max="120"
                                    {...form.register("alertThreshold")}
                                  />
                                  <p className="text-sm text-muted-foreground">
                                    Alert when temperature exceeds this value
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="weatherCondition">Weather Condition Alert</Label>
                                  <Select
                                    value={form.watch("weatherCondition")}
                                    onValueChange={(value) => form.setValue("weatherCondition", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select weather condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="rain">Rain</SelectItem>
                                      <SelectItem value="snow">Snow</SelectItem>
                                      <SelectItem value="storm">Storm</SelectItem>
                                      <SelectItem value="clear">Clear Sky</SelectItem>
                                      <SelectItem value="clouds">Cloudy</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="alertType">Alert Type</Label>
                                  <Select
                                    value={form.watch("alertType")}
                                    onValueChange={(value) => form.setValue("alertType", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select alert type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="visual">Visual Only</SelectItem>
                                      <SelectItem value="sound">Sound Only</SelectItem>
                                      <SelectItem value="both">Visual & Sound</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="presets" className="space-y-4 pt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => applyPreset("default")}
                      >
                        Default Configuration
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => applyPreset("realtime")}
                      >
                        Real-time Updates
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => applyPreset("compact")}
                      >
                        Compact View
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => applyPreset("performance")}
                      >
                        Performance Mode
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={form.handleSubmit(onSubmit)} 
            variant="default"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

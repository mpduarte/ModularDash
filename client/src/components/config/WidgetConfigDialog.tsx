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
  const plugin = getPlugin(widget.pluginId);
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
    [key: string]: any;
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Configure Widget</DialogTitle>
          <DialogDescription>
            Customize widget settings and appearance
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 pt-4">
                  {/* Basic Settings Content */}
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
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="default">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
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
  
  type WidgetConfig = {
    title: string;
    city?: string;
    units?: 'imperial' | 'metric';
    displayMode?: 'digital' | 'analog';
    showSeconds?: boolean;
    use24Hour?: boolean;
    showDate?: boolean;
    dateFormat?: string;
    showMinuteMarks?: boolean;
    showHourMarks?: boolean;
    clockSize?: number;
    autoRefresh: boolean;
    refreshInterval: number;
    theme: string;
    [key: string]: any;
  };

  const form = useForm<WidgetConfig>({
    defaultValues: {
      title: widget.title,
      ...(widget.pluginId === 'weather-widget' ? {
        city: widget.config.city || "San Francisco, CA, USA",
        units: (widget.config.units as 'imperial' | 'metric') || "imperial",
      } : widget.pluginId === 'time-widget' ? {
        displayMode: widget.config.displayMode || "digital",
        showSeconds: widget.config.showSeconds || false,
        use24Hour: widget.config.use24Hour || false,
        showDate: widget.config.showDate || true,
        dateFormat: widget.config.dateFormat || "PPP",
        showMinuteMarks: widget.config.showMinuteMarks || true,
        showHourMarks: widget.config.showHourMarks || true,
        clockSize: widget.config.clockSize || 200,
      } : {}),
      autoRefresh: widget.config.autoRefresh || false,
      refreshInterval: widget.config.refreshInterval || 30,
      theme: widget.config.theme || "default",
    },
  });

  const onSubmit = (data: WidgetConfig) => {
    if (widget.pluginId === 'weather-widget') {
      const { city, units, ...rest } = data;
      onUpdate({
        config: {
          city,
          units,
          ...rest,
        },
      });
    } else if (widget.pluginId === 'time-widget') {
      const {
        displayMode,
        showSeconds,
        use24Hour,
        showDate,
        dateFormat,
        showMinuteMarks,
        showHourMarks,
        clockSize,
        ...rest
      } = data;
      onUpdate({
        config: {
          displayMode,
          showSeconds,
          use24Hour,
          showDate,
          dateFormat,
          showMinuteMarks,
          showHourMarks,
          clockSize,
          ...rest,
        },
      });
    } else {
      const { title, ...rest } = data;
      onUpdate({
        title,
        config: rest,
      });
    }
    onClose();
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="flex-grow pr-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
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
                      {widget.pluginId === 'time-widget' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="displayMode">Display Mode</Label>
                            <Select
                              value={form.watch("displayMode") || "digital"}
                              onValueChange={(value) => form.setValue("displayMode", value)}
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

                          {form.watch("displayMode") === "analog" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="clockSize">Clock Size</Label>
                                <Input
                                  id="clockSize"
                                  type="number"
                                  min="100"
                                  max="400"
                                  {...form.register("clockSize", { valueAsNumber: true })}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label htmlFor="showHourMarks">Show Hour Marks</Label>
                                <Switch
                                  id="showHourMarks"
                                  checked={form.watch("showHourMarks")}
                                  onCheckedChange={(checked) => form.setValue("showHourMarks", checked)}
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label htmlFor="showMinuteMarks">Show Minute Marks</Label>
                                <Switch
                                  id="showMinuteMarks"
                                  checked={form.watch("showMinuteMarks")}
                                  onCheckedChange={(checked) => form.setValue("showMinuteMarks", checked)}
                                />
                              </div>
                            </>
                          )}

                          <div className="flex items-center justify-between">
                            <Label htmlFor="showSeconds">Show Seconds</Label>
                            <Switch
                              id="showSeconds"
                              checked={form.watch("showSeconds")}
                              onCheckedChange={(checked) => form.setValue("showSeconds", checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="use24Hour">Use 24-Hour Format</Label>
                            <Switch
                              id="use24Hour"
                              checked={form.watch("use24Hour")}
                              onCheckedChange={(checked) => form.setValue("use24Hour", checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="showDate">Show Date</Label>
                            <Switch
                              id="showDate"
                              checked={form.watch("showDate")}
                              onCheckedChange={(checked) => form.setValue("showDate", checked)}
                            />
                          </div>

                          {form.watch("showDate") && (
                            <div className="space-y-2">
                              <Label htmlFor="dateFormat">Date Format</Label>
                              <Select
                                value={form.watch("dateFormat") || "PPP"}
                                onValueChange={(value) => form.setValue("dateFormat", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select date format" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PPP">Long (December 8th, 2024)</SelectItem>
                                  <SelectItem value="PP">Medium (Dec 8, 2024)</SelectItem>
                                  <SelectItem value="P">Short (12/08/2024)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}

                      {widget.pluginId === 'weather-widget' && (
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
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 pt-4">
                  <Card>
                    <CardContent className="pt-6">
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
                              {...form.register("refreshInterval", { valueAsNumber: true })}
                            />
                          </div>
                        )}

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
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </ScrollArea>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
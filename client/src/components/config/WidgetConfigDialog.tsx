import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  
  const form = useForm({
    defaultValues: {
      title: widget.title,
      autoRefresh: widget.config.autoRefresh || false,
      refreshInterval: widget.config.refreshInterval || 30,
      theme: widget.config.theme || "default",
      layout: widget.config.layout || "standard",
      visualMode: widget.config.visualMode || "auto",
      background: widget.config.background || "solid",
      animations: widget.config.animations ?? true,
    },
  });

  const onSubmit = (data: any) => {
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configure Widget</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="presets">Presets</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Widget Title</Label>
                  <Input
                    id="title"
                    {...form.register("title")}
                  />
                </div>

                {plugin?.component && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Plugin Settings</h4>
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
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4">
                <Card>
                  <CardContent className="space-y-4 pt-6">
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
                    </div>
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
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

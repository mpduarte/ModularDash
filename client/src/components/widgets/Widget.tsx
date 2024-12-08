import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Widget as WidgetType } from "../../lib/types";
import { X, Settings } from "lucide-react";
import { getPlugin } from "../../lib/pluginRegistry";
import { useState } from "react";
import WidgetConfigDialog from "../config/WidgetConfigDialog";
import { cn } from "@/lib/utils";

interface WidgetProps {
  widget: WidgetType;
  onUpdate: (updates: Partial<WidgetType>) => void;
}

export default function Widget({ widget, onUpdate }: WidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const plugin = getPlugin(widget.pluginId);
  console.group('Widget Load');
  console.log('Widget Details:', {
    id: widget.id,
    pluginId: widget.pluginId,
    title: widget.title
  });
  if (plugin) {
    console.log('Plugin Details:', {
      name: plugin.name,
      version: plugin.version
    });
  }
  console.groupEnd();
  const PluginComponent = plugin?.component;

  const handleConfigChange = (newConfig: Record<string, any>) => {
    const updates: Partial<WidgetType> = {
      config: { ...widget.config, ...newConfig }
    };
    // Update title if provided in config
    if (newConfig.title) {
      updates.title = newConfig.title;
    }
    onUpdate(updates);
  };

  const handleConfigClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Opening config dialog for widget:', widget);
    setShowConfig(true);
  };

  return (
    <>
      <Card 
        className={cn(
          "w-full h-full shadow-lg",
          widget.config.background === "blur" && "bg-background/60 backdrop-blur-lg",
          widget.config.background === "transparent" && "bg-background/30",
          widget.config.background === "solid" && "bg-background",
          widget.config.layout === "compact" && "p-2",
          widget.config.layout === "minimal" && "border-0 shadow-none",
          widget.config.layout === "dense" && "p-1 gap-1",
          widget.config.visualMode === "high-contrast" && "border-2",
          !widget.config.animations && "[&_*]:!transition-none",
          widget.config.theme === "minimal" && "bg-transparent border-0",
          widget.config.theme === "compact" && "shadow-sm",
          widget.config.theme === "performance" && "shadow-none [&_*]:!transition-none",
          widget.config.borderRadius === "rounded" && "rounded-xl",
          widget.config.borderRadius === "square" && "rounded-none",
          widget.config.borderRadius === "pill" && "rounded-full",
          widget.config.padding === "compact" && "p-2",
          widget.config.padding === "normal" && "p-4",
          widget.config.padding === "relaxed" && "p-6",
          widget.config.enableAlerts && "relative",
          "border border-border/50",
          widget.config.customStyles
        )}>
        <CardHeader className="flex flex-row justify-between items-center p-4 drag-handle">
          <h3 className="font-medium">{widget.title}</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleConfigClick}
              className="no-drag flex items-center justify-center p-0 h-8 w-8"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ visible: false });
              }}
              className="no-drag"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {PluginComponent ? (
            <div className="w-full h-full">
              <PluginComponent 
                config={widget.config || {}}
                onConfigChange={handleConfigChange}
              />
            </div>
          ) : (
            <div className="text-muted-foreground">Plugin not found: {widget.pluginId}</div>
          )}
        </CardContent>
      </Card>

      {showConfig ? (
        <WidgetConfigDialog
          widget={widget}
          onClose={() => {
            console.log('Closing config dialog');
            setShowConfig(false);
          }}
          onUpdate={(updates) => {
            console.log('Updating widget with:', updates);
            onUpdate(updates);
            setShowConfig(false);
          }}
        />
      ) : null}
    </>
  );
}

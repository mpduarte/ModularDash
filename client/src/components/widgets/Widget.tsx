import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Widget as WidgetType } from "../../lib/types";
import { X } from "lucide-react";
import { getPlugin } from "../../lib/pluginRegistry";
import { useState } from "react";
import WidgetConfigDialog from "../config/WidgetConfigDialog";
import { cn } from "@/lib/utils";

interface WidgetProps {
  widget: WidgetType;
  onUpdate: (updates: Partial<WidgetType>) => void;
  onShowOverlay?: () => void;
}

export default function Widget({ widget, onUpdate, onShowOverlay }: WidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const plugin = getPlugin(widget.pluginId);
  const PluginComponent = plugin?.component;
  
  const handleConfigChange = (newConfig: Record<string, any>) => {
    const updates: Partial<WidgetType> = {
      config: { ...widget.config, ...newConfig }
    };
    if (newConfig.title) {
      updates.title = newConfig.title;
    }
    onUpdate(updates);
  };

  const isTimeWidget = widget.pluginId === 'time-widget';
  const isHeaderless = isTimeWidget || widget.config.showHeader === false;

  // Common config dialog component
  const configDialog = showConfig && (
    <WidgetConfigDialog
      widget={widget}
      onClose={() => setShowConfig(false)}
      onUpdate={(updates) => {
        onUpdate(updates);
        setShowConfig(false);
      }}
    />
  );

  // Common close button component
  const closeButton = (
    <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 bg-background/80 hover:bg-background shadow-sm"
        onClick={(e) => {
          e.stopPropagation();
          onUpdate({ visible: false });
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  // Time widget specific render
  if (isTimeWidget) {
    return (
      <>
        <div className="w-full h-full drag-handle">
          <Card 
            className={cn(
              "w-full h-full relative group transition-colors duration-200",
              widget.config.theme === "minimal" && "bg-transparent border-0 hover:bg-background/5",
              widget.config.theme === "compact" && "shadow-sm",
              widget.config.theme === "performance" && "shadow-none [&_*]:!transition-none",
              "!p-0 !m-0"
            )}
          >
            <div className="relative z-[1] h-full">
              {closeButton}
              {PluginComponent && (
                <PluginComponent 
                  config={widget.config || {}}
                  onConfigChange={handleConfigChange}
                />
              )}
            </div>
          </Card>
        </div>
        {configDialog}
      </>
    );
  }

  // Regular widgets render
  return (
    <>
      <Card 
        className={cn(
          "w-full h-full relative group transition-colors duration-200",
          widget.config.theme === "minimal" && "bg-transparent border-0 hover:bg-background/5",
          widget.config.theme === "compact" && "shadow-sm",
          widget.config.theme === "performance" && "shadow-none [&_*]:!transition-none",
          widget.config.borderRadius === "rounded" && "rounded-xl",
          widget.config.borderRadius === "square" && "rounded-none",
          widget.config.borderRadius === "pill" && "rounded-full",
          isHeaderless && "!p-0 !m-0",
          widget.config.customStyles
        )}
      >
        <div className="relative z-[1] h-full">
          <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="drag-handle cursor-move">
              <span className="hover:bg-muted/50 rounded p-1">⋮</span>
            </div>
          </div>

          {closeButton}

          {PluginComponent ? (
            <PluginComponent 
              config={widget.config || {}}
              onConfigChange={handleConfigChange}
            />
          ) : (
            <div className="text-muted-foreground">
              Plugin not found: {widget.pluginId}
            </div>
          )}
        </div>
      </Card>
      {configDialog}
    </>
  );
}

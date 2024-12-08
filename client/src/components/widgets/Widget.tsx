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

  return (
    <>
      <Card 
        className={cn(
          "w-full h-full shadow-lg relative",
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
        )}
      >
        <div className="invisible group-hover:visible absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 hover:bg-background shadow-sm"
            onClick={() => onUpdate({ visible: false })}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="drag-handle cursor-move absolute inset-0" />
        <CardContent className="p-2 h-full">
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

      {showConfig && (
        <WidgetConfigDialog
          widget={widget}
          onClose={() => setShowConfig(false)}
          onUpdate={(updates) => {
            onUpdate(updates);
            setShowConfig(false);
          }}
        />
      )}
    </>
  );
}
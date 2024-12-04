import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Widget as WidgetType } from "../../lib/types";
import { Maximize2, X, Settings } from "lucide-react";
import { getPlugin } from "../../lib/pluginRegistry";
import { useState } from "react";
import WidgetConfigDialog from "../config/WidgetConfigDialog";
import { cn } from "@/lib/utils";

interface WidgetProps {
  widget: WidgetType;
  onShowOverlay: () => void;
  onUpdate: (updates: Partial<WidgetType>) => void;
}

export default function Widget({ widget, onShowOverlay, onUpdate }: WidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const plugin = getPlugin(widget.pluginId);
  const PluginComponent = plugin?.component;

  const handleConfigChange = (newConfig: Record<string, any>) => {
    onUpdate({ config: { ...widget.config, ...newConfig } });
  };

  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          "border border-border/50"
        )}>
        <CardHeader className="flex flex-row justify-between items-center p-4 drag-handle">
          <h3 className="font-medium">{widget.title}</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleConfigClick}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowOverlay}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUpdate({ visible: false })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {PluginComponent ? (
            <PluginComponent 
              config={widget.config || {}}
              onConfigChange={handleConfigChange}
            />
          ) : (
            <div className="text-muted-foreground">Plugin not found: {widget.pluginId}</div>
          )}
        </CardContent>
      </Card>

      {showConfig && (
        <WidgetConfigDialog
          widget={widget}
          onClose={() => setShowConfig(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}

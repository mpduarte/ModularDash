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

  // Time widget specific render
  if (isTimeWidget) {
    return (
      <>
        {/* Time widget with minimal container */}
        <div data-widget-type="time-widget" className="w-full h-full">
          <Card 
            className={cn(
              "w-full h-full relative group transition-all duration-200",
              "bg-background/40 backdrop-blur-md hover:bg-background/50",
              "!p-0 !m-0 border border-border/20 shadow-sm"
            )}
          >
            <div className="relative z-[1] h-full">
              {PluginComponent && (
                <PluginComponent 
                  config={widget.config || {}}
                  onConfigChange={handleConfigChange}
                />
              )}
              <div 
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 bg-background/80 hover:bg-background shadow-sm"
                  onClick={() => onUpdate({ visible: false })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
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

  // All widgets use minimal container style
  return (
    <>
      <Card 
        className={cn(
          "w-full h-full relative group transition-all duration-200",
          "bg-background/40 backdrop-blur-md hover:bg-background/50",
          "!p-0 !m-0 border border-border/20 shadow-sm",
          widget.config.customStyles
        )}
      >
        <div className="relative z-[1] h-full">
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
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
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

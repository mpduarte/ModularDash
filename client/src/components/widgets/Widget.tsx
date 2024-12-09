import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Widget as WidgetType } from "../../lib/types";
import { X } from "lucide-react";
import { getPlugin } from "../../lib/pluginRegistry";
import { useState, useCallback, useRef, useEffect } from "react";
import WidgetConfigDialog from "../config/WidgetConfigDialog";
import { cn } from "@/lib/utils";
import * as Portal from "@radix-ui/react-portal";
import { createPortal } from "react-dom";

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

  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    // Create a container for the portal outside the widget
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
    setPortalContainer(container);

    // Update position immediately after creation
    setTimeout(() => updateCloseButtonPosition(), 0);

    return () => {
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    };
  }, [updateCloseButtonPosition]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdate({ visible: false });
  }, [onUpdate]);

  const updateCloseButtonPosition = useCallback(() => {
    if (containerRef.current && portalContainer) {
      const rect = containerRef.current.getBoundingClientRect();
      portalContainer.style.top = `${rect.top}px`;
      portalContainer.style.left = `${rect.right - 24}px`;
      portalContainer.style.transform = 'translate(0, -50%)';
    }
  }, [portalContainer]);

  useEffect(() => {
    updateCloseButtonPosition();
    window.addEventListener('resize', updateCloseButtonPosition);
    window.addEventListener('scroll', updateCloseButtonPosition);
    
    return () => {
      window.removeEventListener('resize', updateCloseButtonPosition);
      window.removeEventListener('scroll', updateCloseButtonPosition);
    };
  }, [updateCloseButtonPosition]);

  const CloseButton = () => portalContainer && createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background shadow-sm rounded-full"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleClose(e);
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>,
    portalContainer
  );

  // Time widget specific render
  if (isTimeWidget) {
    return (
      <>
        {/* Time widget with minimal container */}
        <div 
          ref={containerRef}
          data-widget-type="time-widget" 
          className="w-full h-full relative group"
          onMouseEnter={() => setShowCloseButton(true)}
          onMouseLeave={() => setShowCloseButton(false)}
        >
          {showCloseButton && <CloseButton />}
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
      <div 
        ref={containerRef}
        className="w-full h-full relative group"
        onMouseEnter={() => setShowCloseButton(true)}
        onMouseLeave={() => setShowCloseButton(false)}
      >
        {showCloseButton && <CloseButton />}
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

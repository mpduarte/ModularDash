import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Widget as WidgetType } from '../../lib/types';
import { X } from 'lucide-react';
import { getPlugin } from '../../lib/pluginRegistry';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { WidgetConfigDialog } from '../config/WidgetConfigDialog';

interface WidgetProps {
  widget: WidgetType;
  onUpdate: (updates: Partial<WidgetType>) => void;
  onShowOverlay?: () => void;
}

export default function Widget({ widget, onUpdate, onShowOverlay }: WidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const plugin = getPlugin(widget.pluginId);
  const PluginComponent = plugin?.component;
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [showCloseButton, setShowCloseButton] = useState(false);

  const handleConfigChange = useCallback((updates: Partial<WidgetType>) => {
    onUpdate({
      config: { ...widget.config, ...updates.config },
      ...(updates.title && { title: updates.title })
    });
  }, [widget.config, onUpdate]);

  const updateCloseButtonPosition = useCallback(() => {
    if (containerRef.current && portalContainer) {
      const rect = containerRef.current.getBoundingClientRect();
      portalContainer.style.top = `${rect.top}px`;
      portalContainer.style.left = `${rect.right - 24}px`;
      portalContainer.style.transform = 'translate(0, -50%)';
    }
  }, [portalContainer]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdate({ visible: false });
  }, [onUpdate]);

  useEffect(() => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    };
  }, []);

  useEffect(() => {
    if (containerRef.current && portalContainer) {
      updateCloseButtonPosition();
    }
  }, [portalContainer, updateCloseButtonPosition]);

  useEffect(() => {
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
        onClick={handleClose}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>,
    portalContainer
  );

  const isTimeWidget = widget.pluginId === 'time-widget';
  const isHeaderless = isTimeWidget || widget.config.showHeader === false;

  if (isTimeWidget) {
    return (
      <>
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
                  config={widget.config}
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
            onUpdate={handleConfigChange}
          />
        )}
      </>
    );
  }

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
                config={widget.config}
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
          onUpdate={handleConfigChange}
        />
      )}
    </>
  );
}

import React, { useState } from 'react';
import Grid from '../components/grid/Grid';
import BackgroundZone from '../components/zones/BackgroundZone';
import OverlayZone from '../components/zones/OverlayZone';
import WidgetConfig from '../components/config/WidgetConfig';
import { Button } from '@/components/ui/button';
import { useWidgets } from '../hooks/useWidgets';
import { Settings } from 'lucide-react';

export default function Dashboard() {
  const [showConfig, setShowConfig] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const { widgets, updateWidget, addWidget, removeWidget } = useWidgets();
  
  const handleAddWidget = React.useCallback((pluginId: string) => {
    console.log('Dashboard: Adding widget for plugin:', pluginId);
    try {
      addWidget(pluginId);
      setShowConfig(false); // Close config after adding
    } catch (error) {
      console.error('Error adding widget:', error);
    }
  }, [addWidget]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <BackgroundZone>
        <div className="p-4 flex justify-end items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowConfig(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </BackgroundZone>

      <main className="container mx-auto p-4">
        <Grid
          widgets={widgets}
          onWidgetUpdate={updateWidget}
          onShowOverlay={() => setShowOverlay(true)}
        />
      </main>

      <WidgetConfig
        widgets={widgets}
        onClose={() => setShowConfig(false)}
        onAdd={handleAddWidget}
        onRemove={removeWidget}
        open={showConfig}
      />

      <OverlayZone 
        show={showOverlay}
        onClose={() => setShowOverlay(false)}
      />
    </div>
  );
}

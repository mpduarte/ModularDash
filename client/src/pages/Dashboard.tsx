
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Grid from '../components/grid/Grid';
import BackgroundZone from '../components/zones/BackgroundZone';
import OverlayZone from '../components/zones/OverlayZone';
import WidgetConfig from '../components/config/WidgetConfig';
import { useWidgets } from '../hooks/useWidgets';

export default function Dashboard() {
  const [showConfig, setShowConfig] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const { widgets, updateWidget, addWidget, removeWidget } = useWidgets();

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
        onAdd={addWidget}
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

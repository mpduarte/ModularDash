import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Widget, Plugin } from "../../lib/types";
import { Plus, Trash2, Settings } from "lucide-react";
import { usePlugins } from "../../hooks/usePlugins";
import { useState } from "react";

interface WidgetConfigProps {
  widgets: Widget[];
  onClose: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export default function WidgetConfig({ widgets, onClose, onAdd, onRemove }: WidgetConfigProps) {
  const { plugins, updatePlugin } = usePlugins();
  const [activeTab, setActiveTab] = useState("widgets");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Dashboard Configuration</DialogTitle>
          <DialogDescription>
            Manage your widgets and plugins
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
          </TabsList>

          <TabsContent value="widgets" className="py-4">
            <Button onClick={onAdd} className="w-full mb-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
            
            <ScrollArea className="h-[300px]">
              {widgets.map(widget => (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg"
                >
                  <span>{widget.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(widget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="plugins" className="py-4">
            <ScrollArea className="h-[400px]">
              {plugins.map(plugin => (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{plugin.name}</h4>
                    <p className="text-sm text-muted-foreground">{plugin.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updatePlugin(plugin.id, { enabled: !plugin.enabled })}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

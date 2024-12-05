import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Widget, Plugin } from "../../lib/types";
import { Plus, Trash2, Power } from "lucide-react";
import { usePlugins } from "../../hooks/usePlugins";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface WidgetConfigProps {
  widgets: Widget[];
  onClose: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  open: boolean;
}

export default function WidgetConfig({ widgets, onClose, onAdd, onRemove, open }: WidgetConfigProps) {
  const { plugins, updatePlugin, isLoading, isError, error } = usePlugins();
  const [activeTab, setActiveTab] = useState("widgets");

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
              {isLoading && (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              {isError && (
                <div className="p-4 text-destructive text-center">
                  <p>Error loading plugins: {error?.message}</p>
                </div>
              )}
              {!isLoading && !isError && plugins.map(plugin => (
                <Card key={plugin.id} className="mb-4">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{plugin.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            v{plugin.version}
                          </Badge>
                          <Badge variant={plugin.enabled ? "default" : "secondary"} className="text-xs">
                            {plugin.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{plugin.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Power className={`h-4 w-4 ${plugin.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                          <Switch
                            checked={plugin.enabled}
                            onCheckedChange={(checked) => updatePlugin(plugin.id, { enabled: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

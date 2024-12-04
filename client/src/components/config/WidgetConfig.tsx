import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Widget } from "../../lib/types";
import { Plus, Trash2 } from "lucide-react";

interface WidgetConfigProps {
  widgets: Widget[];
  onClose: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export default function WidgetConfig({ widgets, onClose, onAdd, onRemove }: WidgetConfigProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Widget Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

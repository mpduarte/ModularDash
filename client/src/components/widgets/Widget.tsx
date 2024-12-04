import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Widget as WidgetType } from "../../lib/types";
import { Maximize2, X } from "lucide-react";

interface WidgetProps {
  widget: WidgetType;
  onShowOverlay: () => void;
  onUpdate: (updates: Partial<WidgetType>) => void;
}

export default function Widget({ widget, onShowOverlay, onUpdate }: WidgetProps) {
  return (
    <Card className="w-full h-full bg-background/60 backdrop-blur-lg border border-border/50 shadow-lg">
      <CardHeader className="flex flex-row justify-between items-center p-4">
        <h3 className="font-medium">{widget.title}</h3>
        <div className="flex gap-2">
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
        {widget.content}
      </CardContent>
    </Card>
  );
}

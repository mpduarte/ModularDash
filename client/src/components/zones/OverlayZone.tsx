import { Dialog, DialogContent } from "@/components/ui/dialog";

interface OverlayZoneProps {
  show: boolean;
  onClose: () => void;
}

export default function OverlayZone({ show, onClose }: OverlayZoneProps) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] h-[80vh] bg-background/80 backdrop-blur-xl">
        <div className="h-full p-6">
          <h2 className="text-2xl font-semibold mb-4">Widget Details</h2>
          {/* Expanded widget content would go here */}
        </div>
      </DialogContent>
    </Dialog>
  );
}

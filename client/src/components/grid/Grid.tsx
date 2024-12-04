import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import Widget from '../widgets/Widget';
import { Widget as WidgetType, GridLayout } from '../../lib/types';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface GridProps {
  widgets: WidgetType[];
  onWidgetUpdate: (id: string, updates: Partial<WidgetType>) => void;
  onShowOverlay: () => void;
}

export default function Grid({ widgets, onWidgetUpdate, onShowOverlay }: GridProps) {
  const layouts = {
    lg: widgets.map(widget => ({
      i: String(widget.id),
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: 1,
      maxW: 3,
      minH: 1,
      maxH: 3
    } as GridLayout))
  };

  return (
    <div className="relative w-full min-h-[600px]">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={200}
        margin={[16, 16]}
        onLayoutChange={(layout: Layout[]) => {
          layout.forEach(item => {
            const widget = widgets.find(w => w.id.toString() === item.i);
            if (widget) {
              onWidgetUpdate(widget.id, {
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h
              });
            }
          });
        }}
      >
        {widgets.map(widget => (
          <div key={String(widget.id)} className="relative">
            <Widget
              widget={widget}
              onShowOverlay={onShowOverlay}
              onUpdate={(updates) => onWidgetUpdate(widget.id, updates)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

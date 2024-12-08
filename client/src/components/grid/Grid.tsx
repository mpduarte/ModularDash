import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
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
      i: widget.id.toString(),
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: 1,
      maxW: 3,
      minH: 1,
      // Allow weather widgets to expand vertically as needed
      maxH: widget.pluginId === 'weather-widget' ? Infinity : 3
    } as GridLayout))
  };

  return (
    <div className="relative w-full min-h-[600px] p-4">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={100}
        margin={[20, 20]}
        containerPadding={[20, 20]}
        useCSSTransforms={true}
        verticalCompact={true}
        preventCollision={false}
        // Use smaller row height for finer control over widget sizes
        autoSize={true}
        // Ensure proper height calculations
        onResize={(layout, oldItem, newItem, placeholder, e, node) => {
          if (newItem && widgets.find(w => w.id.toString() === newItem.i)?.pluginId === 'weather-widget') {
            const height = node.offsetHeight;
            const rows = Math.ceil(height / 100); // Divide by rowHeight
            if (rows !== newItem.h) {
              onLayoutChange(layout.map(item => 
                item.i === newItem.i ? { ...item, h: rows } : item
              ));
            }
          }
        }}
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
          <div 
            key={String(widget.id)} 
            className={`relative react-grid-item ${
              widget.pluginId === 'weather-widget' ? 'h-full flex flex-col' : ''
            }`}
            style={{
              height: widget.pluginId === 'weather-widget' ? 'auto' : undefined,
              minHeight: widget.pluginId === 'weather-widget' ? '100%' : undefined
            }}>
            <div className={`h-full w-full ${widget.pluginId === 'weather-widget' ? 'flex-grow' : ''}`}>
              <Widget
                widget={widget}
                onShowOverlay={onShowOverlay}
                onUpdate={(updates) => onWidgetUpdate(widget.id, updates)}
              />
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

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
    lg: widgets.map(widget => {
      const isWeatherWidget = widget.pluginId === 'weather-widget';
      return {
        i: widget.id.toString(),
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h,
        minW: 1,
        maxW: 3,
        minH: isWeatherWidget ? 2 : 1,
        maxH: isWeatherWidget ? 6 : 3,
        isDraggable: true,
        isResizable: true,
        resizeHandles: ['s'],
        isBounded: true
      } as GridLayout;
    })
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
        rowHeight={80}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        useCSSTransforms={false}
        verticalCompact={true}
        compactType="vertical"
        preventCollision={false}
        onResizeStop={(layout, oldItem, newItem, placeholder, e, node) => {
          const widget = widgets.find(w => w.id.toString() === newItem.i);
          if (widget?.pluginId === 'weather-widget') {
            const actualHeight = node.querySelector('.weather-widget-content')?.scrollHeight || 0;
            const rowHeight = 80;
            const newRows = Math.max(2, Math.ceil(actualHeight / rowHeight));
            if (newRows !== newItem.h) {
              onWidgetUpdate(widget.id, {
                x: newItem.x,
                y: newItem.y,
                w: newItem.w,
                h: newRows
              });
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
              widget.pluginId === 'weather-widget' ? 'weather-widget-container' : ''
            }`}>
            <div className="w-full h-full flex flex-col">
              <div className="weather-widget-content flex-1 p-4">
                <Widget
                  widget={widget}
                  onShowOverlay={onShowOverlay}
                  onUpdate={(updates) => onWidgetUpdate(widget.id, updates)}
                />
              </div>
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

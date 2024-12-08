import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Widget from '../widgets/Widget';
import { Widget as WidgetType } from '../../lib/types';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface GridProps {
  widgets: WidgetType[];
  onWidgetUpdate: (id: string, updates: Partial<WidgetType>) => void;
  onShowOverlay: () => void;
}

export default function Grid({ widgets, onWidgetUpdate, onShowOverlay }: GridProps) {
  const getWidgetConstraints = (widget: WidgetType) => {
    const constraints = {
      minW: 1,
      maxW: 3,
      minH: 2,
      maxH: 4,
      w: widget.w || 1,
      h: widget.h || 2
    };

    switch (widget.pluginId) {
      case 'weather-widget':
        constraints.minH = 3;
        constraints.maxH = 6;
        constraints.h = Math.max(constraints.minH, widget.h || 3);
        break;
      case 'calendar-widget':
        constraints.minH = 4;
        constraints.maxH = 8;
        constraints.h = Math.max(constraints.minH, widget.h || 4);
        break;
      case 'time-widget':
        constraints.minH = 2;
        constraints.maxH = 3;
        constraints.h = Math.max(constraints.minH, widget.h || 2);
        break;
    }

    return constraints;
  };

  const layouts = {
    lg: widgets.map(widget => ({
      i: widget.id.toString(),
      x: widget.x || 0,
      y: widget.y || 0,
      ...getWidgetConstraints(widget)
    }))
  };

  const handleLayoutChange = (layout: Layout[]) => {
    layout.forEach(item => {
      const widget = widgets.find(w => w.id.toString() === item.i);
      if (widget) {
        const updates = {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h
        };

        if (JSON.stringify(updates) !== JSON.stringify({
          x: widget.x,
          y: widget.y,
          w: widget.w,
          h: widget.h
        })) {
          onWidgetUpdate(widget.id, updates);
        }
      }
    });
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
      rowHeight={80}
      margin={[12, 12]}
      containerPadding={[12, 12]}
      onLayoutChange={handleLayoutChange}
      isResizable={true}
      isDraggable={true}
      draggableHandle=".drag-handle"
    >
      {widgets.map(widget => (
        <div 
          key={widget.id.toString()} 
          className="widget-container bg-white bg-opacity-90 rounded-lg shadow-lg overflow-hidden"
        >
          <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 truncate">{widget.title}</h3>
            <span className="drag-handle cursor-move p-1 hover:bg-gray-100 rounded">⋮</span>
          </header>
          <Widget
            widget={widget}
            onShowOverlay={onShowOverlay}
            onUpdate={(updates) => onWidgetUpdate(widget.id, updates)}
          />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}

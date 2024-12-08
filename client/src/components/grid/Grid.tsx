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
  const getWidgetConstraints = (widget: WidgetType) => {
    const isWeatherWidget = widget.pluginId === 'weather-widget';
    const isTimeWidget = widget.pluginId === 'time-widget';
    const isCalendarWidget = widget.pluginId === 'calendar-widget';
    
    const constraints = {
      minW: 1,
      maxW: 3,
      minH: 2,
      maxH: 4,
      w: widget.w || 1,
      h: widget.h || 2
    };

    if (isWeatherWidget) {
      constraints.minH = 3;
      constraints.maxH = 6;
      constraints.h = Math.max(constraints.minH, widget.h || 3);
    } else if (isCalendarWidget) {
      constraints.minH = 4;
      constraints.maxH = 8;
      constraints.h = Math.max(constraints.minH, widget.h || 4);
    } else if (isTimeWidget) {
      constraints.minH = 2;
      constraints.maxH = 3;
      constraints.h = Math.max(constraints.minH, widget.h || 2);
    }

    return constraints;
  };

  const layouts = {
    lg: widgets.map(widget => ({
      i: widget.id.toString(),
      x: widget.x || 0,
      y: widget.y || 0,
      ...getWidgetConstraints(widget),
      isDraggable: true,
      isResizable: true,
      resizeHandles: ['se', 'e', 's'],
      static: false
    } as GridLayout))
  };

  const handleLayoutChange = (layout: Layout[]) => {
    const hasChanges = layout.some(item => {
      const widget = widgets.find(w => w.id.toString() === item.i);
      return widget && (
        widget.x !== item.x ||
        widget.y !== item.y ||
        widget.w !== item.w ||
        widget.h !== item.h
      );
    });

    if (hasChanges) {
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
    }
  };

  return (
    <div className="grid-container w-full min-h-[600px] p-4">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={80}
        margin={[12, 12]}
        containerPadding={[12, 12]}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
        useCSSTransforms={true}
        verticalCompact={true}
        compactType="vertical"
        preventCollision={false}
        onLayoutChange={handleLayoutChange}
        onResizeStop={(layout, oldItem, newItem, placeholder, e, node) => {
          const widget = widgets.find(w => w.id.toString() === newItem.i);
          if (widget?.pluginId === 'weather-widget') {
            const actualHeight = node.querySelector('.widget-content')?.scrollHeight || 0;
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
      >
        {widgets.map(widget => (
          <div key={widget.id.toString()} className="bg-white bg-opacity-90 rounded-lg shadow-lg h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 truncate">{widget.title}</h3>
              <div className="drag-handle cursor-move p-1 hover:bg-gray-100 rounded">⋮</div>
            </div>
            <div className="widget-content flex-1 p-4 overflow-y-auto">
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

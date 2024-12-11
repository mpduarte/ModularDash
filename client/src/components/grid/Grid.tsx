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
      h: widget.h || 2,
      x: widget.x || 0,
      y: widget.y || 0,
      i: widget.id.toString()
    };

    switch (widget.pluginId) {
      case 'weather-widget':
        constraints.minH = 3;
        constraints.maxH = 6;
        constraints.h = Math.max(constraints.minH, widget.h || 3);
        break;
      case 'calendar-widget':
        constraints.minH = 6;  // Increased minimum height to accommodate events list
        constraints.maxH = 12; // Increased maximum height for more events
        constraints.h = Math.max(constraints.minH, widget.h || 6);
        break;
      case 'time-widget':
        constraints.minH = 2;
        constraints.maxH = 3;
        constraints.h = Math.max(constraints.minH, widget.h || 2);
        break;
    }

    return constraints;
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
      layouts={{ lg: widgets.map(getWidgetConstraints) }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
      rowHeight={80}
      margin={[12, 12]}
      containerPadding={[0, 0]}
      onLayoutChange={handleLayoutChange}
      isResizable={true}
      isDraggable={true}
      draggableHandle="[data-widget-type]"
      useCSSTransforms={true}
      className="layout"
    >
      {widgets.map(widget => {
        const isTimeWidget = widget.pluginId === 'time-widget';
        
        // All widgets get wrapper with full height and draggable handle
        return (
          <div 
            key={widget.id.toString()} 
            className="h-full flex flex-col w-full"
            style={{ height: '100%', touchAction: 'none' }}
            data-widget-type={widget.pluginId}
          >
            <div 
              className="h-full w-full flex flex-col"
              data-widget-type={widget.pluginId}
              style={{ touchAction: 'none' }}
            >
              <Widget
                widget={widget}
                onShowOverlay={onShowOverlay}
                onUpdate={(updates) => onWidgetUpdate(widget.id, updates)}
              />
            </div>
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
}

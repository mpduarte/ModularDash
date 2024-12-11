import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { format, startOfDay, endOfDay, parseISO, subMonths, addMonths } from 'date-fns';
import { Badge } from '../ui/badge';
import { expandRecurringEvents } from '@/lib/recurringEvents';
import { type PluginProps } from '@/lib/types';

interface CalendarEvent {
  summary: string;
  description?: string;
  start: string | Date;
  end: string | Date;
  location?: string;
  recurrence?: string[];
  isRecurring?: boolean;
  isAllDay?: boolean;
  uid?: string;
}

interface CalendarWidgetProps extends Omit<PluginProps, 'config'> {
  config: {
    calendarUrl?: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
    title?: string;
    [key: string]: any;
  };
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  config,
  onConfigChange
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config?.calendarUrl) {
      fetchEvents();
    }

    if (config?.autoRefresh && config?.refreshInterval) {
      const interval = setInterval(fetchEvents, config.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [config?.calendarUrl, config?.autoRefresh, config?.refreshInterval]);

  const fetchEvents = async () => {
    if (!config?.calendarUrl) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/calendar/events?url=${encodeURIComponent(config.calendarUrl)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch calendar feed');
      }
      
      const { events: calendarEvents } = await response.json();
      
      let processedEvents = calendarEvents.map((event: CalendarEvent) => {
        const rawStart = typeof event.start === 'string' ? event.start : event.start.toString();
        const rawEnd = typeof event.end === 'string' ? event.end : event.end.toString();
        
        const parseDate = (dateStr: string, isAllDay: boolean = false) => {
          if (isAllDay) {
            const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
            return new Date(year, month - 1, day);
          }
          return new Date(dateStr);
        };

        let start = parseDate(rawStart, event.isAllDay);
        let end = parseDate(rawEnd, event.isAllDay);

        const isAllDay = event.isAllDay ?? (() => {
          if (!rawStart.includes('T') && !rawEnd.includes('T')) {
            return true;
          }

          if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd') &&
              start.getHours() === end.getHours() && 
              start.getMinutes() === end.getMinutes()) {
            return true;
          }

          const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (Math.abs(diffHours - 24) < 0.1) {
            return true;
          }

          return false;
        })();

        if (isAllDay) {
          start = startOfDay(start);
          end = startOfDay(end);
        }

        return {
          ...event,
          start,
          end,
          isRecurring: Boolean(event.recurrence?.length),
          isAllDay
        };
      });

      const expandedEvents = processedEvents.flatMap((event: CalendarEvent) => 
        expandRecurringEvents(
          {
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
          },
          subMonths(new Date(), 1),
          addMonths(new Date(), 3)
        )
      );
      
      setEvents(expandedEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const getDayEvents = (day: Date | null) => {
    if (!day || !(day instanceof Date) || isNaN(day.getTime())) {
      return [];
    }
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    return events
      .filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        if (event.isAllDay) {
          const eventStartDay = startOfDay(eventStart);
          const eventEndDay = startOfDay(eventEnd);
          const selectedDay = startOfDay(day);
          return selectedDay >= eventStartDay && selectedDay <= eventEndDay;
        }

        const eventStartUTC = new Date(eventStart);
        const dayStartUTC = new Date(Date.UTC(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          -eventStartUTC.getTimezoneOffset() / 60,
          0, 0, 0
        ));
        const dayEndUTC = new Date(Date.UTC(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          23 - eventStartUTC.getTimezoneOffset() / 60,
          59, 59, 999
        ));
        return eventStartUTC >= dayStartUTC && eventStartUTC <= dayEndUTC;
      })
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" data-widget-type={config.pluginId}>
      <div className="flex flex-col w-full h-full flex-grow">
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              if (newDate instanceof Date && !isNaN(newDate.getTime())) {
                setDate(newDate);
              }
            }}
            className="w-full rounded-t-md border-x border-t border-border/20"
            defaultMonth={new Date()}
          />
          
          <ScrollArea className="flex-1 h-full rounded-b-md border-x border-b border-border/20 p-4 bg-background/40 backdrop-blur-md">
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading events...</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : getDayEvents(date).length > 0 ? (
                getDayEvents(date).map((event, index) => (
                  <div key={`${event.uid}-${index}`} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{event.summary}</h4>
                      {event.isRecurring && (
                        <Badge variant="outline" className="text-xs">
                          Recurring
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.isAllDay ? "All Day" : `${format(new Date(event.start), 'h:mm a')} - ${format(new Date(event.end), 'h:mm a')}`}
                    </p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-sm text-muted-foreground">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {config?.calendarUrl ? 'No events for this day' : 'No calendar URL configured'}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;

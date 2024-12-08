import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { format, startOfDay, endOfDay, isEqual, parseISO, addDays } from 'date-fns';
import { Badge } from '../ui/badge';

interface CalendarEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  recurrence?: string[];
  isRecurring?: boolean;
  isAllDay?: boolean;
  uid?: string;
}

interface CalendarWidgetProps {
  config?: {
    calendarUrl?: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
    title?: string;
  };
  onConfigChange?: (config: any) => void;
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
      
      const processedEvents = calendarEvents.map((event: CalendarEvent) => {
        // Parse dates as UTC and convert to local time
        const rawStart = typeof event.start === 'string' ? event.start : event.start.toString();
        const rawEnd = typeof event.end === 'string' ? event.end : event.end.toString();
        
        // Function to parse date considering UTC
        const parseDate = (dateStr: string) => {
          if (!dateStr.includes('T')) {
            // Date-only format: treat as local midnight
            return new Date(dateStr + 'T00:00:00');
          }
          // Parse ISO string and convert to local time
          return parseISO(dateStr);
        };

        const start = parseDate(rawStart);
        const end = parseDate(rawEnd);

        // Calculate if it's an all-day event
        const isAllDay = (() => {
          // Case 1: Date-only strings (no time component)
          if (!rawStart.includes('T') && !rawEnd.includes('T')) {
            return true;
          }

          // Case 2: Same date with same time or 24h period
          if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
            // Check if times are the same
            if (start.getHours() === end.getHours() && 
                start.getMinutes() === end.getMinutes()) {
              return true;
            }
            // Check if it spans exactly 24 hours
            const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            if (diffHours === 24) {
              return true;
            }
          }

          // Case 3: Ends at midnight of the next day
          const nextDay = addDays(start, 1);
          if (format(nextDay, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd') &&
              end.getHours() === 0 && end.getMinutes() === 0) {
            return true;
          }

          return false;
        })();

        return {
          ...event,
          start,
          end,
          isRecurring: Boolean(event.recurrence?.length),
          isAllDay
        };
      });

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const getDayEvents = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    return events
      .filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        if (event.isAllDay) {
          // For all-day events, compare the date without time
          const eventDate = startOfDay(eventStart);
          return format(eventDate, 'yyyy-MM-dd') === format(dayStart, 'yyyy-MM-dd');
        }

        // For time-specific events, check if they occur on this day
        return eventStart >= dayStart && eventStart <= dayEnd;
      })
      .sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return a.start.getTime() - b.start.getTime();
      });
  };

  return (
    <Card className="w-full h-full p-4">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{config?.title || 'Calendar'}</h3>
        </div>
        
        <div className="grid gap-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && setDate(newDate)}
            className="rounded-md border"
          />
          
          <ScrollArea className="h-[200px] rounded-md border p-4">
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
                      {event.isAllDay ? "All Day" : `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`}
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
    </Card>
  );
};

export default CalendarWidget;

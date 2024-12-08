import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';

interface CalendarEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  recurrence?: string[];
  isRecurring?: boolean;
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

    // Set up auto-refresh if enabled
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
      
      const processedEvents = calendarEvents.map((event: CalendarEvent) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        isRecurring: Boolean(event.recurrence?.length)
      }));

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const getDayEvents = (day: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Check if it's an all-day event (no time component or full 24h period)
      const isAllDay = 
        (eventStart.getHours() === 0 && eventStart.getMinutes() === 0 &&
         eventEnd.getHours() === 0 && eventEnd.getMinutes() === 0) ||
        (eventEnd.getTime() - eventStart.getTime() === 24 * 60 * 60 * 1000);

      if (isAllDay) {
        // For all-day events, adjust for timezone and compare dates
        const eventDate = new Date(eventStart.toISOString().split('T')[0]);
        const compareDate = new Date(day.toISOString().split('T')[0]);
        return eventDate.getTime() === compareDate.getTime();
      } else {
        // For time-specific events, check if they overlap with the day
        const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const endOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
        return (eventStart <= endOfDay && eventEnd >= startOfDay);
      }
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
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
                      {(event.start.getHours() === 0 && event.start.getMinutes() === 0 &&
                        event.end.getHours() === 0 && event.end.getMinutes() === 0 &&
                        Math.abs(event.end.getTime() - event.start.getTime()) <= 24 * 60 * 60 * 1000)
                        ? "All Day"
                        : `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`}
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
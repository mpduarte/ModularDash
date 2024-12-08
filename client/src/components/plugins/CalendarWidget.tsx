import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { format, startOfDay, endOfDay, isEqual } from 'date-fns';
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
      
      const processedEvents = calendarEvents.map((event: CalendarEvent) => {
        // Parse dates and normalize to local timezone
        const start = new Date(event.start);
        const end = new Date(event.end);

        // Function to check if a date string is in date-only format (no time component)
        const isDateOnly = (dateStr: string) => 
          typeof dateStr === 'string' && !dateStr.includes('T');

        // Function to check if two dates are on the same day
        const isSameDay = (date1: Date, date2: Date) =>
          date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getDate() === date2.getDate();

        // Detect if it's an all-day event
        const isAllDay = 
          // Case 1: Date-only format in iCal
          (isDateOnly(event.start.toString()) && isDateOnly(event.end.toString())) ||
          // Case 2: Same start/end time in a day indicates an all-day event
          (isSameDay(start, end) && 
           start.getHours() === end.getHours() && 
           start.getMinutes() === end.getMinutes()) ||
          // Case 3: 24-hour period
          (isSameDay(start, end) &&
           Math.abs(end.getTime() - start.getTime()) <= 24 * 60 * 60 * 1000);

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
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // For all-day events, only check the date portion
      if (event.isAllDay) {
        const eventDate = startOfDay(eventStart);
        const compareDate = startOfDay(day);
        return isEqual(eventDate, compareDate);
      }

      // For time-specific events, check if they occur on this day
      const dayStartTime = startOfDay(day);
      const dayEndTime = endOfDay(day);
      return eventStart >= dayStartTime && eventStart <= dayEndTime;
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

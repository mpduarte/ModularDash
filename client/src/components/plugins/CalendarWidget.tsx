import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { format, parseISO } from 'date-fns';
import * as ical from 'ical';

interface CalendarEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  recurrence?: string[];
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
      const response = await fetch(config.calendarUrl);
      if (!response.ok) throw new Error('Failed to fetch calendar feed');
      
      const icalData = await response.text();
      const parsedEvents = ical.parseICS(icalData);
      
      const processedEvents: CalendarEvent[] = Object.values(parsedEvents)
        .filter(event => event.type === 'VEVENT')
        .map(event => ({
          summary: event.summary || 'Untitled Event',
          description: event.description,
          start: event.start || new Date(),
          end: event.end || new Date(),
          location: event.location,
          recurrence: event.rrule ? [event.rrule.toString()] : undefined
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
      const eventDate = new Date(event.start);
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getFullYear() === day.getFullYear();
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
                  <div key={index} className="space-y-1">
                    <h4 className="font-medium">{event.summary}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(event.start, 'HH:mm')} - 
                      {format(event.end, 'HH:mm')}
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

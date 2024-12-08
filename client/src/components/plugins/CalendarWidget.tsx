import React, { useEffect, useState } from 'react';
import { Card } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';

interface CalendarEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
}

interface CalendarWidgetProps {
  id: string;
  title?: string;
  config?: {
    calendarUrl?: string;
  };
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  id,
  title,
  config,
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config?.calendarUrl) {
      fetchEvents();
    }
  }, [config?.calendarUrl]);

  const fetchEvents = async () => {
    if (!config?.calendarUrl) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/calendar/events?url=${encodeURIComponent(config.calendarUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data.events.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      })));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
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
    });
  };

  return (
    <Card className="w-full h-full p-4">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title || 'Calendar'}</h3>
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
              ) : getDayEvents(date).length > 0 ? (
                getDayEvents(date).map((event, index) => (
                  <div key={index} className="space-y-1">
                    <h4 className="font-medium">{event.summary}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.start), 'HH:mm')} - 
                      {format(new Date(event.end), 'HH:mm')}
                    </p>
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

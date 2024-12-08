import { RRule, RRuleSet, rrulestr } from 'rrule';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

interface RecurringEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  recurrence?: string[];
  isAllDay?: boolean;
  uid?: string;
}

export function expandRecurringEvents(
  event: RecurringEvent,
  rangeStart: Date = subMonths(new Date(), 1),
  rangeEnd: Date = addMonths(new Date(), 3)
): RecurringEvent[] {
  if (!event.recurrence?.length) {
    return [event];
  }

  try {
    const rruleSet = new RRuleSet();
    
    // Add all recurrence rules from the event
    event.recurrence.forEach(rule => {
      try {
        // Convert iCal RRULE to RRule object
        const rrule = rrulestr(rule, { dtstart: event.start });
        rruleSet.rrule(rrule);
      } catch (error) {
        console.error('Error parsing recurrence rule:', rule, error);
      }
    });

    // Get all occurrences between start and end dates
    const occurrences = rruleSet.between(rangeStart, rangeEnd, true);

    // Map each occurrence to a new event instance
    return occurrences.map(occurrence => {
      const duration = event.end.getTime() - event.start.getTime();
      const instanceEnd = new Date(occurrence.getTime() + duration);

      return {
        ...event,
        start: occurrence,
        end: instanceEnd,
        isRecurring: true,
        // Add unique ID for each instance by appending timestamp
        uid: `${event.uid}-${occurrence.getTime()}`
      };
    });
  } catch (error) {
    console.error('Error expanding recurring event:', error);
    return [event];
  }
}

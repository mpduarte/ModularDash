import express from 'express';
import ical from 'node-ical';
import { Router } from 'express';
import { format } from 'date-fns';
import { calendarProviderRequests, calendarProviderLatency, calendarProviderErrors } from '../metrics';

const router: Router = express.Router();

router.get('/events', async (req, res) => {
  const { url } = req.query;
  const startTime = Date.now();

  if (!url || typeof url !== 'string') {
    calendarProviderErrors.labels('invalid_url').inc();
    return res.status(400).json({ error: 'Calendar URL is required' });
  }

  try {
    // Convert webcal to https
    const fetchUrl = url.replace(/^webcal:\/\//i, 'https://');
    
    // Validate URL format
    try {
      new URL(fetchUrl);
    } catch (urlError) {
      calendarProviderErrors.labels('invalid_url').inc();
      return res.status(400).json({ 
        error: 'Invalid calendar URL',
        message: 'Please provide a valid webcal:// or https:// URL'
      });
    }

    const events = await new Promise((resolve, reject) => {
      ical.fromURL(fetchUrl, {}, (error, data) => {
        if (error) {
          calendarProviderErrors.labels('fetch_error').inc();
          reject(new Error(`Failed to fetch calendar: ${error.message}`));
          return;
        }

        try {
          const calendarEvents = Object.values(data)
            .filter(event => event.type === 'VEVENT')
            .map(event => {
              // Check if the event is a date-only event (no time component)
              const isDateOnly = !event.start?.toISOString().includes('T');
              
              // For all-day events, preserve the original date without timezone conversion
              let start, end;
              
              if (isDateOnly) {
                // For date-only events, keep the original date
                const startStr = event.start.toISOString().split('T')[0];
                const endStr = (event.end || event.start).toISOString().split('T')[0];
                // Add time component to make it a full day
                start = new Date(`${startStr}T00:00:00.000Z`);
                end = new Date(`${endStr}T00:00:00.000Z`);
              } else {
                start = event.start;
                end = event.end || event.start;
              }

              // Function to check if times are effectively identical
              const areTimesIdentical = (date1: Date, date2: Date) => {
                return date1.getTime() === date2.getTime();
              };

              // Check if event should be treated as all-day
              const shouldBeAllDay = isDateOnly || areTimesIdentical(start, end);

              // Convert to all-day event if conditions are met
              if (shouldBeAllDay) {
                // For all-day events, set start to beginning of day and end to end of day
                const startDate = new Date(start);
                // Use UTC to avoid timezone issues
                start = new Date(Date.UTC(
                  startDate.getUTCFullYear(),
                  startDate.getUTCMonth(),
                  startDate.getUTCDate(),
                  0, 0, 0, 0
                ));
                end = new Date(Date.UTC(
                  startDate.getUTCFullYear(),
                  startDate.getUTCMonth(),
                  startDate.getUTCDate(),
                  23, 59, 59, 999
                ));
              }

              const processedEvent = {
                summary: event.summary || 'Untitled Event',
                description: event.description,
                start: start,
                end: end,
                location: event.location,
                recurrence: event.rrule ? [event.rrule.toString()] : undefined,
                uid: event.uid,
                isAllDay: shouldBeAllDay
              };

              console.log('Processed event:', {
                summary: processedEvent.summary,
                start: format(processedEvent.start, 'yyyy-MM-dd HH:mm:ss'),
                end: format(processedEvent.end, 'yyyy-MM-dd HH:mm:ss'),
                isAllDay: processedEvent.isAllDay,
                rawStartTime: start.getTime(),
                rawEndTime: end.getTime(),
                timeMatch: areTimesIdentical(start, end)
              });

              return processedEvent;
            })
            .filter(event => event.start && event.end) // Ensure valid dates
            .sort((a, b) => a.start.getTime() - b.start.getTime()); // Sort by start time

          resolve(calendarEvents);
        } catch (parseError) {
          calendarProviderErrors.labels('parse_error').inc();
          const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
          reject(new Error(`Failed to parse calendar data: ${errorMessage}`));
        }
      });
    });

    const duration = (Date.now() - startTime) / 1000;
    calendarProviderLatency.observe(duration);
    calendarProviderRequests.labels('success').inc();

    res.json({ events });
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    calendarProviderLatency.observe(duration);
    calendarProviderRequests.labels('error').inc();

    console.error('Error fetching calendar events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

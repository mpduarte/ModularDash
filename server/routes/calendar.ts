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
                // For date-only events, keep the original date in local time
                const startDate = event.start;
                const endDate = event.end || event.start;
                
                // Create dates in local time (not UTC)
                start = new Date(
                  startDate.getFullYear(),
                  startDate.getMonth(),
                  startDate.getDate(),
                  0, 0, 0, 0
                );
                
                end = new Date(
                  endDate.getFullYear(),
                  endDate.getMonth(),
                  endDate.getDate(),
                  23, 59, 59, 999
                );
              } else {
                // For time-specific events, preserve the original UTC time
                const startDate = event.start;
                const endDate = event.end || event.start;
                
                // Create dates preserving the UTC time
                start = new Date(startDate.toISOString());
                end = new Date(endDate.toISOString());
              }

              // Function to check if times are effectively identical or span exactly 24 hours
              const shouldTreatAsAllDay = (start: Date, end: Date, isDateOnly: boolean) => {
                if (isDateOnly) return true;

                // Case 1: Exact same time
                if (start.getTime() === end.getTime()) return true;

                // Case 2: 24-hour duration (accounting for DST)
                const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                if (Math.abs(durationHours - 24) < 0.1) return true;

                // Case 3: Same calendar date
                const sameDate = start.getFullYear() === end.getFullYear() &&
                               start.getMonth() === end.getMonth() &&
                               start.getDate() === end.getDate();
                if (sameDate && 
                    start.getHours() === 0 && start.getMinutes() === 0 &&
                    end.getHours() === 23 && end.getMinutes() === 59) return true;

                return false;
              };

              // Check if event should be treated as all-day
              const shouldBeAllDay = shouldTreatAsAllDay(start, end, isDateOnly);

              // Convert to all-day event if conditions are met
              if (shouldBeAllDay) {
                // For all-day events, set start to beginning of day and end to end of day
                const startDate = new Date(start);
                start = new Date(Date.UTC(
                  startDate.getUTCFullYear(),
                  startDate.getUTCMonth(),
                  startDate.getUTCDate(),
                  0, 0, 0, 0
                ));
                end = new Date(Date.UTC(
                  startDate.getUTCFullYear(),
                  startDate.getUTCMonth(),
                  startDate.getUTCDate() + 1,
                  0, 0, 0, 0
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

              console.log('Processing event:', {
                summary: processedEvent.summary,
                originalStart: event.start.toISOString(),
                originalEnd: (event.end || event.start).toISOString(),
                processedStart: format(start, 'yyyy-MM-dd HH:mm:ss xxx'),
                processedEnd: format(end, 'yyyy-MM-dd HH:mm:ss xxx'),
                isAllDay: processedEvent.isAllDay,
                isDateOnly: isDateOnly,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                startLocal: start.toLocaleString(),
                endLocal: end.toLocaleString(),
                durationHours: (end.getTime() - start.getTime()) / (1000 * 60 * 60)
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

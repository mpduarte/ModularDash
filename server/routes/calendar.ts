import express from 'express';
import ical from 'node-ical';
import { Router } from 'express';
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
              // Determine if it's an all-day event by checking if start/end are date-only
              const isDateOnly = !event.start?.toString().includes('T');
              
              // For all-day events, ensure we use the date portion only
              let start = event.start;
              let end = event.end || event.start;
              
              if (isDateOnly) {
                // For date-only events, create dates at start of day in local timezone
                start = new Date(event.start.toISOString().split('T')[0]);
                end = new Date(end.toISOString().split('T')[0]);
              }

              return {
                summary: event.summary || 'Untitled Event',
                description: event.description,
                start: start,
                end: end,
                location: event.location,
                recurrence: event.rrule ? [event.rrule.toString()] : undefined,
                uid: event.uid,
                isAllDay: isDateOnly
              };
            })
            .filter(event => event.start && event.end) // Ensure valid dates
            .sort((a, b) => a.start.getTime() - b.start.getTime()); // Sort by start time

          resolve(calendarEvents);
        } catch (parseError) {
          calendarProviderErrors.labels('parse_error').inc();
          reject(new Error(`Failed to parse calendar data: ${parseError.message}`));
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

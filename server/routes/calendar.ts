import express from 'express';
import ical from 'node-ical';
import { Router } from 'express';

const router: Router = express.Router();

router.get('/events', async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Calendar URL is required' });
  }

  try {
    // Convert webcal to https
    const fetchUrl = url.replace(/^webcal:\/\//i, 'https://');
    
    const events = await new Promise((resolve, reject) => {
      ical.fromURL(fetchUrl, {}, (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        const calendarEvents = Object.values(data)
          .filter(event => event.type === 'VEVENT')
          .map(event => ({
            summary: event.summary,
            description: event.description,
            start: event.start,
            end: event.end,
            location: event.location,
          }));

        resolve(calendarEvents);
      });
    });

    res.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

export default router;

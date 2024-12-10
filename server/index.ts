import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { db, sql, testConnection } from "db";
import { plugins } from "@db/schema";
import { eq } from "drizzle-orm";
import { metricsMiddleware, metricsHandler } from './metrics';

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] ${message}`);
}

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Enable metrics collection if environment variable is set
if (process.env.ENABLE_METRICS === 'true') {
  app.use(metricsMiddleware);
  app.get('/metrics', metricsHandler);
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function seedDefaultPlugins() {
  log('Starting plugin seeding process...');
  
  const defaultPlugins = [
    {
      id: 'text-widget',
      name: 'Text Widget',
      description: 'Simple text display widget',
      version: '1.0.0',
      enabled: true,
      config: { content: '' },
      component: 'TextWidget',
      category: 'content'
    },
    {
      id: 'html-widget',
      name: 'HTML Widget',
      description: 'Rich HTML content widget',
      version: '1.0.0',
      enabled: true,
      config: { content: '' },
      component: 'HtmlWidget',
      category: 'content'
    },
    {
      id: 'weather-widget',
      name: 'Weather Widget',
      description: 'Displays weather information for a specified location',
      version: '1.0.0',
      enabled: true,
      component: 'WeatherWidget',
      category: 'widgets',
      config: {
        city: 'San Francisco, CA, USA',
        units: 'imperial',
        titleFormat: 'city-state-country',
        refreshInterval: 300000,
        enableAlerts: false,
        alertThreshold: 80,
        weatherCondition: 'rain',
        alertType: 'visual'
      }
    },
    {
      id: 'time-widget',
      name: '',
      description: 'Displays current time with configurable format',
      version: '1.0.0',
      enabled: true,
      component: 'TimeWidget',
      category: 'widgets',
      config: {
        format: 'HH:mm',
        showSeconds: false,
        use24Hour: false,
        showDate: true,
        dateFormat: 'PPP',
        timezone: 'local',
        displayMode: 'digital',
        showMinuteMarks: true,
        showHourMarks: true,
        clockSize: 200,
        theme: 'minimal',
        padding: 'none',
        showHeader: false,
        title: ''
      }
    },
    {
      id: 'calendar-widget',
      name: 'Calendar Widget',
      description: 'Display calendar events from iCal/WebCal/CalDAV feeds',
      version: '1.0.0',
      enabled: true,
      component: 'CalendarWidget',
      category: 'widgets',
      config: {
        calendarUrl: '',
        autoRefresh: false,
        refreshInterval: 300,
        title: 'Calendar'
      }
    }
  ];

  try {
    for (const plugin of defaultPlugins) {
      try {
        const existing = await db.select().from(plugins).where(eq(plugins.id, plugin.id));
        if (existing.length === 0) {
          await db.insert(plugins).values(plugin);
          log(`Successfully seeded plugin: ${plugin.id}`);
        }
      } catch (error) {
        log(`Error seeding plugin: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    }
    log('Plugin seeding completed successfully');
  } catch (error) {
    log(`Error in seeding process: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({
    error: true,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

(async () => {
  try {
    log('Starting server initialization...');
    
    // Initialize database and verify connection
    let retries = 5;
    while (retries > 0) {
      try {
        // Test database connection using the new test function
        log('Testing database connection...');
        const isConnected = await testConnection();
        
        if (!isConnected) {
          throw new Error('Database connection test failed');
        }
        
        log('Database connection successful');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          log(`Failed to connect to database after all retries: ${error instanceof Error ? error.message : String(error)}`);
          console.error('Database connection error:', error);
          process.exit(1);
        }
        log(`Database connection attempt failed, retrying in 2 seconds... (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Seed default plugins
    try {
      await seedDefaultPlugins();
      log('Database initialization complete');
    } catch (error) {
      log(`Database initialization error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Full error:', error);
      process.exit(1);
    }
    
    const server = createServer(app);
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    
    // Set up environment-specific middleware
    if (app.get("env") === "development") {
      log('Setting up development middleware...');
      await setupVite(app, server);
      log('Vite middleware setup complete');
    }

    // Set up API routes
    log('Registering API routes...');
    try {
      await registerRoutes(app);
      log('Routes registered successfully');
    } catch (error) {
      log(`Failed to register routes: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Full route registration error:', error);
      process.exit(1);
    }

    // Set up static serving for production
    if (app.get("env") !== "development") {
      log('Setting up static file serving...');
      serveStatic(app);
      log('Static serving setup complete');
    }

    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      log(`Server listening on port ${PORT}`);
      if (process.send) {
        process.send('ready');
      }
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
})();
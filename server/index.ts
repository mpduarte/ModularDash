import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { db } from "db";
import { plugins } from "@db/schema";
import { eq } from "drizzle-orm";

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

// Import metrics middleware
import { metricsMiddleware, metricsHandler } from './metrics';

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
      description: 'Simple text display widget for content',
      version: '1.0.0',
      enabled: true,
      component: 'TextWidget',
      category: 'widgets',
      config: {
        content: 'Sample text content'
      }
    },
    {
      id: 'html-widget',
      name: 'HTML Widget',
      description: 'Display custom HTML content with formatting',
      version: '1.0.0',
      enabled: true,
      component: 'HtmlWidget',
      category: 'widgets',
      config: {}
    },
    {
      id: 'weather-widget',
      name: 'Weather Widget',
      description: 'Displays current weather conditions and forecast',
      version: '1.0.0',
      enabled: true,
      component: 'WeatherWidget',
      category: 'widgets',
      config: {
        city: 'San Francisco',
        units: 'imperial',
        refreshInterval: 300000
      }
    },
    {
      id: 'background-manager',
      name: 'Background Manager',
      description: 'Manage dashboard background images and rotation settings',
      version: '1.0.0',
      enabled: true,
      component: 'BackgroundManagerPlugin',
      category: 'appearance',
      config: {
        images: [],
        currentImageIndex: 0,
        interval: 8000,
        isAutoRotate: false,
        transition: 'fade'
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
    
    // Initialize database and seed data
    try {
      await seedDefaultPlugins();
      log('Database initialization complete');
    } catch (error) {
      log(`Database initialization error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
    
    const server = createServer(app);
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    
    // Handle server errors globally
    server.on('error', (error: any) => {
      log(`Server error encountered: ${error.message}`);
      if (error.code === 'EADDRINUSE') {
        log('Port is already in use. Attempting to close and retry...');
        setTimeout(() => {
          server.close();
          server.listen(PORT, '0.0.0.0');
        }, 1000);
      }
    });

    // Set up environment-specific middleware first
    if (app.get("env") === "development") {
      log('Setting up development middleware...');
      await setupVite(app, server);
      log('Vite middleware setup complete');
    }

    // Set up API routes
    log('Registering API routes...');
    registerRoutes(app);
    log('Routes registered successfully');
    
    // Set up static serving for production
    if (app.get("env") !== "development") {
      log('Setting up static file serving...');
      serveStatic(app);
      log('Static serving setup complete');
    }

    // Add signal handling for graceful shutdown
    process.on('SIGTERM', () => {
      log('Received SIGTERM signal. Shutting down gracefully...');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    });

    // Start the server
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        return new Promise<void>((res) => {
          server.close(() => {
            log('Cleaned up existing server instance');
            res();
          });
        });
      };

      const startServer = async () => {
        try {
          await cleanup();
          server.listen(PORT, '0.0.0.0', () => {
            log(`Server listening on port ${PORT}`);
            if (process.send) {
              process.send('ready');
            }
            resolve();
          });
        } catch (error) {
          log(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
          reject(error);
        }
      };

      startServer().catch(reject);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
})();

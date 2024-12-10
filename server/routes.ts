import express from "express";
import { db } from "db";
import { widgets, plugins } from "@db/schema";
import { eq } from "drizzle-orm";
import { weatherProviderErrors, weatherProviderRequests, weatherProviderLatency } from "./metrics";
import calendarRoutes from "./routes/calendar";

// Database connection verification
async function verifyDatabaseConnection() {
  try {
    await db.select().from(widgets).limit(1);
    console.log('[Database] Connection successful');
    return true;
  } catch (error) {
    console.error('[Database] Connection error:', error);
    return false;
  }
}

export async function registerRoutes(app: express.Express) {
  // Verify database connection
  const isDatabaseConnected = await verifyDatabaseConnection();
  if (!isDatabaseConnected) {
    console.error('[Server] Failed to establish database connection');
    throw new Error('Database connection failed');
  }
  console.log('[Server] Database connection verified');
  // Health check route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  
  // Calendar routes
  app.use("/api/calendar", calendarRoutes);
  // Weather API endpoint
  app.get("/api/weather", async (req, res) => {
    try {
      const city = req.query.city as string;
      if (!city) {
        return res.status(400).json({ error: "City parameter is required" });
      }

      let provider = req.query.provider as string || 'openweathermap';
      const units = req.query.units as string || 'imperial';
      
      // Format city name for API (supports "city,state code,country code")
      const formattedCity = city.includes(',') ? 
        city.split(',').map(part => part.trim()).join(',') : 
        `${city},US`; // Default to US if no country specified

      // Provider health tracking
      const providerHealthStatus: Record<string, {
        lastError?: number;
        consecutiveErrors: number;
        responseTimes: number[];
        lastResponseTime?: number;
        totalRequests: number;
        successfulRequests: number;
      }> = {
        openweathermap: {
          consecutiveErrors: 0,
          responseTimes: [],
          totalRequests: 0,
          successfulRequests: 0
        },
        weatherapi: {
          consecutiveErrors: 0,
          responseTimes: [],
          totalRequests: 0,
          successfulRequests: 0
        }
      };

      // Health check function that uses in-memory error tracking
      const checkProviderHealth = (providerName: string) => {
        const status = providerHealthStatus[providerName];
        if (!status) return true;

        // Calculate success rate
        const successRate = status.totalRequests > 0
          ? status.successfulRequests / status.totalRequests
          : 1;

        // Calculate average response time from last 5 requests
        const recentResponseTimes = status.responseTimes.slice(-5);
        const avgResponseTime = recentResponseTimes.length > 0
          ? recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length
          : 0;

        // Provider is unhealthy if:
        // 1. Has 3+ consecutive errors in the last minute
        // 2. Success rate below 70% in recent requests
        // 3. Average response time above 2 seconds
        if (
          (status.consecutiveErrors >= 3 && status.lastError && Date.now() - status.lastError < 60000) ||
          (status.totalRequests > 10 && successRate < 0.7) ||
          (recentResponseTimes.length >= 5 && avgResponseTime > 2000)
        ) {
          console.log(`Provider ${providerName} health check failed:`, {
            consecutiveErrors: status.consecutiveErrors,
            successRate,
            avgResponseTime
          });
          return false;
        }
        return true;
      };

      // Update provider health status
      const updateProviderHealth = (providerName: string, success: boolean, responseTime?: number) => {
        const status = providerHealthStatus[providerName];
        if (!status) return;

        status.totalRequests++;
        if (success) {
          status.consecutiveErrors = 0;
          status.lastError = undefined;
          status.successfulRequests++;
        } else {
          status.consecutiveErrors++;
          status.lastError = Date.now();
        }

        if (responseTime) {
          status.responseTimes.push(responseTime);
          status.lastResponseTime = responseTime;
          // Keep only last 100 response times
          if (status.responseTimes.length > 100) {
            status.responseTimes.shift();
          }
        }

        // Log provider health metrics
        weatherProviderLatency.labels(providerName).observe(responseTime ? responseTime / 1000 : 0);
        if (success) {
          weatherProviderRequests.labels(providerName, 'success').inc();
        } else {
          weatherProviderErrors.labels(providerName, 'api').inc();
          weatherProviderRequests.labels(providerName, 'error').inc();
        }
      };

      // Fetch weather data from a specific provider with error handling and metrics
      const fetchFromProvider = async (providerName: string): Promise<any> => {
        const startTime = Date.now();
        let response, data, url;

        try {
          // Configure provider-specific details
          if (providerName === 'openweathermap') {
            const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
            if (!API_KEY) {
              console.error('OpenWeatherMap API key missing');
              throw new Error("OpenWeatherMap API key not configured");
            }
            url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(formattedCity)}&appid=${API_KEY}&units=${units}`;
          } else if (providerName === 'weatherapi') {
            const API_KEY = process.env.WEATHERAPI_KEY;
            if (!API_KEY) {
              console.error('WeatherAPI key missing');
              throw new Error("WeatherAPI key not configured");
            }
            url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(formattedCity)}&aqi=no`;
          } else {
            throw new Error("Invalid provider specified");
          }

          // Log request attempt with redacted API key for debugging
          const redactedUrl = url.replace(/key=[^&]+|appid=[^&]+/, 'key=REDACTED');
          console.log(`Attempting to fetch weather data from ${providerName}:`, redactedUrl);

          // Make the API request with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          data = await response.json();

          if (!response.ok) {
            const errorMessage = data.message || data.error?.message || response.statusText;
            console.error(`${providerName} API error:`, errorMessage);
            throw new Error(errorMessage);
          }

          // Record metrics for successful request
          weatherProviderRequests.labels(providerName, 'success').inc();
          weatherProviderLatency.labels(providerName).observe((Date.now() - startTime) / 1000);

          console.log(`Successfully fetched weather data from ${providerName}`);
          
          // Format location information consistently
          let formattedData = { ...data };
          if (providerName === 'weatherapi') {
            formattedData = {
              ...data,
              name: data.location.name,
              sys: {
                country: data.location.country,
                state: data.location.region
              }
            };
          }
          return { ...formattedData, provider: providerName };

        } catch (error) {
          // Record error metrics
          weatherProviderErrors.labels(providerName, 'api').inc();
          weatherProviderRequests.labels(providerName, 'error').inc();
          weatherProviderLatency.labels(providerName).observe((Date.now() - startTime) / 1000);

          // Enhanced error logging
          console.error(`Failed to fetch weather data from ${providerName}:`, error instanceof Error ? error.message : 'Unknown error');
          
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`${providerName} request timed out`);
          }
          throw error;
        }
      };

      // Try primary provider first
      try {
        if (!checkProviderHealth(provider)) {
          console.log(`Provider ${provider} health check failed, switching to backup provider`);
          provider = provider === 'openweathermap' ? 'weatherapi' : 'openweathermap';
        }

        const startTime = Date.now();
        try {
          const data = await Promise.race([
            fetchFromProvider(provider),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 5000)
            )
          ]);
          
          const responseTime = Date.now() - startTime;
          updateProviderHealth(provider, true, responseTime);
          
          // Log success metrics
          weatherProviderRequests.labels(provider, 'success').inc();
          weatherProviderLatency.labels(provider).observe(responseTime / 1000);
          
          return res.json(data);
        } catch (error) {
          const responseTime = Date.now() - startTime;
          console.error(`Error with ${provider}:`, error);
          updateProviderHealth(provider, false, responseTime);
          
          // Type guard for error object
          const isErrorWithName = (err: unknown): err is { name: string } => {
            return err !== null && typeof err === 'object' && 'name' in err;
          };
          
          // Log failure metrics with type checking
          weatherProviderErrors.labels(
            provider, 
            isErrorWithName(error) && error.name === 'AbortError' ? 'timeout' : 'api'
          ).inc();
          weatherProviderRequests.labels(provider, 'error').inc();
          
          throw error;
        }
      } catch (primaryError) {
        // Switch to backup provider
        const backupProvider = provider === 'openweathermap' ? 'weatherapi' : 'openweathermap';
        console.log(`Switching to backup provider: ${backupProvider}`);
        
        const startTime = Date.now();
        try {
          const data = await Promise.race([
            fetchFromProvider(backupProvider),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 5000)
            )
          ]);
          
          const responseTime = Date.now() - startTime;
          updateProviderHealth(backupProvider, true, responseTime);
          
          // Log success metrics for backup provider
          weatherProviderRequests.labels(backupProvider, 'success').inc();
          weatherProviderLatency.labels(backupProvider).observe(responseTime / 1000);
          
          return res.json(data);
        } catch (backupError) {
          const responseTime = Date.now() - startTime;
          console.error(`Backup provider ${backupProvider} also failed:`, backupError);
          updateProviderHealth(backupProvider, false, responseTime);
          
          // Log failure metrics for backup provider
          // Type guard for error object
          const isErrorWithName = (err: unknown): err is { name: string } => {
            return err !== null && typeof err === 'object' && 'name' in err;
          };
          
          const errorType = isErrorWithName(backupError) && backupError.name === 'AbortError' ? 'timeout' : 'api';
          weatherProviderErrors.labels(backupProvider, errorType).inc();
          weatherProviderRequests.labels(backupProvider, 'error').inc();
          
          throw new Error('All weather providers failed');
        }
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).json({
        error: 'Failed to fetch weather data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // CORS middleware - must be before route handlers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Air Quality API endpoint
  app.get("/api/air-quality", async (req, res) => {
    try {
      const lat = req.query.lat as string;
      const lon = req.query.lon as string;
      
      if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude parameters are required" });
      }

      const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
      if (!API_KEY) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
      console.log('Fetching air quality data from:', url.replace(API_KEY, 'REDACTED'));

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        console.error('OpenWeatherMap API error:', data);
        return res.status(response.status).json({
          error: 'Air Quality API error',
          message: data.message || response.statusText
        });
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching air quality data:', error);
      res.status(500).json({
        error: 'Failed to fetch air quality data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Plugin routes
  app.get("/api/plugins", async (_req, res) => {
    try {
      console.log('Fetching plugins from database...');
      const allPlugins = await db.select().from(plugins);
      console.log('Retrieved plugins:', JSON.stringify(allPlugins, null, 2));
      
      // Ensure proper response headers for caching
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', 'application/json');
      
      if (!Array.isArray(allPlugins)) {
        console.error('Invalid plugins data structure:', allPlugins);
        throw new Error('Invalid plugins data structure');
      }
      
      // Ensure all plugins have required fields
      const processedPlugins = allPlugins.map(plugin => ({
        ...plugin,
        enabled: plugin.enabled ?? true,
        category: plugin.category || 'other',
        config: plugin.config || {}
      }));
      
      console.log('Sending processed plugins:', JSON.stringify(processedPlugins, null, 2));
      res.json(processedPlugins);
    } catch (error) {
      console.error('Error fetching plugins:', error);
      res.status(500).json({
        error: 'Failed to fetch plugins',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  app.get("/api/plugins/:id", async (req, res) => {
    try {
      const plugin = await db.select().from(plugins).where(eq(plugins.id, req.params.id));
      if (!plugin.length) {
        return res.status(404).json({ error: "Plugin not found" });
      }
      res.json(plugin[0]);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch plugin',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.patch("/api/plugins/:id", async (req, res) => {
    try {
      const plugin = await db
        .update(plugins)
        .set(req.body)
        .where(eq(plugins.id, req.params.id))
        .returning();
      
      if (!plugin.length) {
        return res.status(404).json({ error: "Plugin not found" });
      }
      res.json(plugin[0]);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update plugin',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Widget routes
  app.get("/api/widgets", async (_req, res) => {
    try {
      const allWidgets = await db.select().from(widgets);
      res.json(allWidgets);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch widgets',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/widgets/:id", async (req, res) => {
    try {
      const widget = await db.select().from(widgets).where(eq(widgets.id, parseInt(req.params.id)));
      if (!widget.length) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget[0]);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch widget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/widgets", async (req, res) => {
    try {
      console.log('Received widget creation request:', req.body);
      
      // Validate required fields
      if (!req.body.pluginId) {
        console.error('Missing required field: pluginId');
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Missing required field: pluginId'
        });
      }

      // Create the widget
      console.log('Creating widget with data:', req.body);
      const widget = await db.insert(widgets).values(req.body).returning();
      console.log('Widget created successfully:', widget[0]);
      res.json(widget[0]);
    } catch (error) {
      console.error('Error creating widget:', error);
      res.status(500).json({
        error: 'Failed to create widget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.patch("/api/widgets/:id", async (req, res) => {
    try {
      const widget = await db
        .update(widgets)
        .set(req.body)
        .where(eq(widgets.id, parseInt(req.params.id)))
        .returning();
      
      if (!widget.length) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget[0]);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to update widget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete("/api/widgets/:id", async (req, res) => {
    try {
      await db.delete(widgets).where(eq(widgets.id, parseInt(req.params.id)));
      res.status(204).end();
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete widget',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

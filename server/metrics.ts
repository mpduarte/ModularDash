import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a Registry
export const register = new Registry();

// Add a custom prefix to all metrics
register.setDefaultLabels({
  app: 'modular-dashboard'
});

// Enable collection of default metrics
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDurationMicroseconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Weather provider specific metrics
export const weatherProviderRequests = new Counter({
  name: 'weather_provider_requests_total',
  help: 'Total number of requests to weather providers',
  labelNames: ['provider', 'status']
});

export const weatherProviderLatency = new Histogram({
  name: 'weather_provider_latency_seconds',
  help: 'Latency of weather provider requests',
  labelNames: ['provider'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const weatherProviderErrors = new Counter({
  name: 'weather_provider_errors_total',
  help: 'Total number of weather provider errors',
  labelNames: ['provider', 'error_type']
});
// Calendar provider metrics
export const calendarProviderRequests = new Counter({
  name: 'calendar_provider_requests_total',
  help: 'Total number of requests to calendar providers',
  labelNames: ['status']
});

export const calendarProviderLatency = new Histogram({
  name: 'calendar_provider_latency_seconds',
  help: 'Latency of calendar provider requests',
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const calendarProviderErrors = new Counter({
  name: 'calendar_provider_errors_total',
  help: 'Total number of calendar provider errors',
  labelNames: ['error_type']
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(weatherProviderRequests);
register.registerMetric(weatherProviderLatency);
register.registerMetric(weatherProviderErrors);
register.registerMetric(calendarProviderRequests);
register.registerMetric(calendarProviderLatency);
register.registerMetric(calendarProviderErrors);

// Metrics middleware
export const metricsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;
    const statusCode = res.statusCode.toString();
    
    httpRequestDurationMicroseconds
      .labels(req.method, route, statusCode)
      .observe(duration / 1000);
    
    httpRequestCounter
      .labels(req.method, route, statusCode)
      .inc();
  });
  
  next();
};

// Metrics endpoint handler
export const metricsHandler = async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
};

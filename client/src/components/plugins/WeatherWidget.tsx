import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type PluginComponent, PluginProps } from '../../lib/types';
import { createPortal } from 'react-dom';

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    description: string;
    icon: string;
    id: number;
    main: string;
  }>;
  name: string;
  coord: {
    lat: number;
    lon: number;
  };
}

interface AirQualityData {
  list: Array<{
    main: {
      aqi: number;
    };
    components: {
      co: number;
      no2: number;
      o3: number;
      pm2_5: number;
      pm10: number;
    };
  }>;
}

const AQI_LEVELS = {
  1: { label: 'Good', color: 'bg-green-500' },
  2: { label: 'Fair', color: 'bg-yellow-500' },
  3: { label: 'Moderate', color: 'bg-orange-500' },
  4: { label: 'Poor', color: 'bg-red-500' },
  5: { label: 'Very Poor', color: 'bg-purple-500' }
};

const WeatherWidgetComponent: React.FC<PluginProps> = ({ config, onConfigChange }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCity, setEditingCity] = useState(false);
  const [tempCity, setTempCity] = useState(config.city);
  const units = config.units || 'imperial';
  const unitSymbol = units === 'metric' ? '°C' : '°F';
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Get the base URL from the current window location
  const baseUrl = window.location.origin;

  const fetchAirQuality = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/air-quality?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error(`Air Quality API error: ${response.statusText}`);
      }
      const data = await response.json();
      setAirQuality(data);
    } catch (error) {
      console.error('Error fetching air quality:', error);
      // Don't set error state to avoid blocking weather display
    }
  };

  const checkAlerts = (weatherData: WeatherData) => {
    if (!config.enableAlerts) return;
    
    const triggeredAlerts: string[] = [];
    
    // Check temperature threshold
    const currentTemp = Math.round(weatherData.main.temp);
    const threshold = config.alertThreshold || 80;
    
    if (currentTemp >= threshold) {
      triggeredAlerts.push(`Temperature Alert: Current temperature (${currentTemp}${unitSymbol}) exceeds threshold of ${threshold}${unitSymbol}`);
      console.log('Temperature alert triggered:', { currentTemp, threshold });
    }

    // Check weather condition
    if (config.weatherCondition) {
      const currentCondition = weatherData.weather[0].main.toLowerCase();
      if (currentCondition.includes(config.weatherCondition.toLowerCase())) {
        triggeredAlerts.push(`Weather Condition Alert: ${weatherData.weather[0].description}`);
        console.log('Weather condition alert triggered:', { currentCondition, targetCondition: config.weatherCondition });
      }
    }

    if (triggeredAlerts.length > 0) {
      console.log('Showing alerts:', triggeredAlerts);
      setNotificationMessage(triggeredAlerts.join('\n'));
      setShowNotification(true);
      
      if (config.alertType === 'sound' || config.alertType === 'both') {
        try {
          const audio = new Audio('/alert.mp3');
          audio.play().catch(error => console.error('Error playing alert sound:', error));
        } catch (error) {
          console.error('Error creating audio:', error);
        }
      }

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };

  const fetchWeather = async (city: string, targetUnits?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${baseUrl}/api/weather?city=${encodeURIComponent(city)}&units=${targetUnits || units}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
        }
        if (response.status === 429) {
          throw new Error('Weather service is temporarily unavailable due to high demand. Please try again in a few minutes.');
        }
        throw new Error(data.message || `Weather API error: ${response.statusText}`);
      }

      setWeather(data);
      checkAlerts(data);
      
      // Add delay before fetching air quality to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch air quality data using coordinates
      if (data.coord) {
        await fetchAirQuality(data.coord.lat, data.coord.lon);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch weather data periodically
  useEffect(() => {
    const fetchData = async () => {
      await fetchWeather(config.city);
    };

    fetchData();
    // Increase default refresh interval to 10 minutes (600000ms) to avoid rate limits
    const refreshInterval = Math.max(600000, config.refreshInterval || 600000);
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [config.city, config.refreshInterval, config.units]);

  const handleCityUpdate = () => {
    if (tempCity.trim() === '') {
      setError('City name cannot be empty');
      return;
    }
    
    if (onConfigChange) {
      onConfigChange({ ...config, city: tempCity });
    }
    setEditingCity(false);
  };

  const handleUnitToggle = async () => {
    try {
      const newUnits = units === 'metric' ? 'imperial' : 'metric';
      console.log('Switching units:', { current: units, new: newUnits });
      
      // First update the config
      await onConfigChange({ ...config, units: newUnits });
      
      // Then fetch new data with new units
      await fetchWeather(config.city, newUnits);
      
      console.log('Unit switch completed:', { newUnits });
    } catch (error) {
      console.error('Error switching units:', error);
      setError('Failed to switch temperature units. Please try again.');
    }
  };

  if (loading && !weather) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse flex flex-col gap-2">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showNotification && createPortal(
        <div className="fixed top-4 right-4 z-[9999] bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 max-w-md border-2 border-destructive-foreground">
          <div className="font-semibold mb-2">Weather Alert</div>
          <pre className="whitespace-pre-wrap text-sm">{notificationMessage}</pre>
        </div>,
        document.body
      )}
      <Card className="p-4">
        {/* Header Section */}
        <header className="flex justify-between items-center mb-4">
          {editingCity ? (
            <form className="flex gap-2 items-center" onSubmit={(e) => { e.preventDefault(); handleCityUpdate(); }}>
              <Input
                value={tempCity}
                onChange={(e) => setTempCity(e.target.value)}
                placeholder="Enter city name"
                className="w-40"
              />
              <Button type="submit" size="sm">Update</Button>
              <Button onClick={() => setEditingCity(false)} variant="outline" size="sm">Cancel</Button>
            </form>
          ) : (
            <>
              <h3 className="text-lg font-semibold">{weather?.name || 'Loading...'}</h3>
              <Button onClick={() => setEditingCity(true)} variant="ghost" size="sm">Change City</Button>
            </>
          )}
        </header>

        {/* Error Message */}
        {error && (
          <p className="text-destructive text-sm mb-4" role="alert">{error}</p>
        )}
        
        {/* Weather Content */}
        {weather && (
          <section className="space-y-4">
            {/* Current Weather */}
            <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
              <img
                src={`https://openweathermap.org/img/w/${weather.weather[0].icon}.png`}
                alt={weather.weather[0].description}
                className="w-16 h-16"
              />
              <div className="space-y-1">
                <p className="text-3xl font-bold">{Math.round(weather.main.temp)}{unitSymbol}</p>
                <p className="text-muted-foreground capitalize">{weather.weather[0].description}</p>
              </div>
            </div>
            
            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <Label>Feels Like</Label>
                <p>{Math.round(weather.main.feels_like)}{unitSymbol}</p>
              </div>
              <div className="space-y-1">
                <Label>Humidity</Label>
                <p>{weather.main.humidity}%</p>
              </div>
            </div>

            {/* Air Quality */}
            {airQuality?.list?.[0] && (
              <div className="border-t pt-4">
                <Label className="block mb-2">Air Quality</Label>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-3 h-3 rounded-full ${AQI_LEVELS[airQuality.list[0].main.aqi as keyof typeof AQI_LEVELS].color}`} />
                  <span>{AQI_LEVELS[airQuality.list[0].main.aqi as keyof typeof AQI_LEVELS].label}</span>
                </div>
                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                  <span>PM2.5: {airQuality.list[0].components.pm2_5.toFixed(1)} μg/m³</span>
                  <span>PM10: {airQuality.list[0].components.pm10.toFixed(1)} μg/m³</span>
                </div>
              </div>
            )}

            {/* Temperature Unit Toggle */}
            <div className="border-t pt-4 flex justify-between items-center">
              <Label>Temperature Unit</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnitToggle}
              >
                Switch to {units === 'metric' ? '°F' : '°C'}
              </Button>
            </div>
          </section>
        )}
      </Card>
    </>
  );
};

// Export the component directly
export const WeatherWidget: PluginComponent = WeatherWidgetComponent;

// Export the configuration
export const weatherWidgetConfig = {
  id: 'weather-widget',
  name: 'Weather Widget',
  description: 'Displays current weather conditions and forecast',
  version: '1.0.0',
  component: WeatherWidgetComponent,
  category: 'widgets',
  defaultConfig: {
    city: 'San Francisco',
    units: 'imperial',
    refreshInterval: 300000,
    enableAlerts: false,
    alertThreshold: 80,
    weatherCondition: 'rain',
    alertType: 'visual'
  }
};

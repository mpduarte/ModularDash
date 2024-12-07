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
}

interface WeatherAlert {
  type: 'temperature' | 'condition';
  threshold: number;
  condition?: string;
  triggered: boolean;
}

const WeatherWidgetComponent: React.FC<PluginProps> = ({ config, onConfigChange }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCity, setEditingCity] = useState(false);
  const [tempCity, setTempCity] = useState(config.city);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const checkAlerts = (weatherData: WeatherData) => {
    if (!config.enableAlerts) return;
    
    const triggeredAlerts: string[] = [];
    
    // Check temperature threshold
    const currentTemp = Math.round(weatherData.main.temp);
    const threshold = config.alertThreshold || 80;
    
    if (currentTemp >= threshold) {
      triggeredAlerts.push(`Temperature Alert: Current temperature (${currentTemp}°F) exceeds threshold of ${threshold}°F`);
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
          const audio = new Audio('/public/alert.mp3');
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

  const fetchWeather = async (city: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }
      const data = await response.json();
      setWeather(data);
      checkAlerts(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather data';
      if (errorMessage.includes('city not found')) {
        setError(`City "${tempCity}" not found. Please enter a valid city name (e.g., "Minden,NV,US" or "San Francisco")`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check alerts when weather data changes
  useEffect(() => {
    if (weather) {
      console.log('Checking alerts for weather data:', weather);
      checkAlerts(weather);
    }
  }, [weather, config.enableAlerts, config.alertThreshold, config.weatherCondition]);

  // Fetch weather data periodically
  useEffect(() => {
    const fetchData = async () => {
      await fetchWeather(config.city);
    };

    fetchData();
    const interval = setInterval(fetchData, config.refreshInterval || 300000);

    return () => clearInterval(interval);
  }, [config.city, config.refreshInterval]);

  const handleCityUpdate = () => {
    if (onConfigChange) {
      onConfigChange({ ...config, city: tempCity });
    }
    setEditingCity(false);
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showNotification && createPortal(
        <div className="fixed top-4 right-4 z-[9999] bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 max-w-md border-2 border-destructive-foreground" style={{ position: 'fixed', top: '1rem', right: '1rem' }}>
          <div className="font-semibold mb-2">Weather Alert</div>
          <pre className="whitespace-pre-wrap text-sm">{notificationMessage}</pre>
        </div>,
        document.body
      )}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              {editingCity ? (
                <div className="flex gap-2 items-center">
                  <Input
                    value={tempCity}
                    onChange={(e) => setTempCity(e.target.value)}
                    placeholder="Enter city name"
                    className="w-40"
                  />
                  <Button onClick={handleCityUpdate} size="sm">Update</Button>
                  <Button onClick={() => setEditingCity(false)} variant="outline" size="sm">Cancel</Button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">{weather?.name}</h3>
                  <Button onClick={() => setEditingCity(true)} variant="ghost" size="sm">Change City</Button>
                </>
              )}
            </div>
            
            {weather && (
              <>
                <div className="flex items-center gap-4">
                  <img
                    src={`https://openweathermap.org/img/w/${weather.weather[0].icon}.png`}
                    alt={weather.weather[0].description}
                    className="w-16 h-16"
                  />
                  <div>
                    <div className="text-3xl font-bold">{Math.round(weather.main.temp)}°F</div>
                    <div className="text-muted-foreground capitalize">
                      {weather.weather[0].description}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <Label>Feels Like</Label>
                    <div>{Math.round(weather.main.feels_like)}°F</div>
                  </div>
                  <div>
                    <Label>Humidity</Label>
                    <div>{weather.main.humidity}%</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
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

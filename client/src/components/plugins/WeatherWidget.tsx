import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type PluginComponent } from '../../lib/types';

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

const WeatherWidgetComponent: React.FC<{ config: any; onConfigChange?: (config: any) => void }> = ({ config, onConfigChange }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCity, setEditingCity] = useState(false);
  const [tempCity, setTempCity] = useState(config.city);
  const [alerts, setAlerts] = useState<WeatherAlert[]>(config.alerts || []);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const checkAlerts = (weatherData: WeatherData) => {
    if (!config.enableAlerts) return;
    
    const triggeredAlerts: string[] = [];
    
    alerts.forEach(alert => {
      if (alert.type === 'temperature') {
        const temp = Math.round(weatherData.main.temp);
        if (temp >= alert.threshold) {
          triggeredAlerts.push(`Temperature alert: Current temperature (${temp}°F) exceeds ${alert.threshold}°F`);
        }
      } else if (alert.type === 'condition' && alert.condition) {
        const currentCondition = weatherData.weather[0].main.toLowerCase();
        if (currentCondition.includes(alert.condition.toLowerCase())) {
          triggeredAlerts.push(`Weather condition alert: ${weatherData.weather[0].description}`);
        }
      }
    });

    if (triggeredAlerts.length > 0) {
      setNotificationMessage(triggeredAlerts.join('\n'));
      setShowNotification(true);
      
      if (config.alertType === 'sound' || config.alertType === 'both') {
        // Play alert sound
        const audio = new Audio('/alert.mp3');
        audio.play().catch(console.error);
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
      setError(error instanceof Error ? error.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAndCheck = async () => {
      await fetchWeather(config.city);
      if (weather) {
        checkAlerts(weather);
      }
    };

    fetchAndCheck();
    const interval = setInterval(fetchAndCheck, config.refreshInterval || 300000);

    return () => clearInterval(interval);
  }, [config.city, config.refreshInterval, config.enableAlerts]);

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
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
          <pre className="whitespace-pre-wrap">{notificationMessage}</pre>
        </div>
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
    alerts: [],
    alertType: 'visual'
  }
};

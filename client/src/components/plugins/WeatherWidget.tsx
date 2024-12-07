import React, { useState, useEffect } from 'react';
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
        throw new Error(data.message || `Weather API error: ${response.statusText}`);
      }

      setWeather(data);
      if (data.coord) {
        await fetchAirQuality(data.coord.lat, data.coord.lon);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchWeather(config.city);
    };

    fetchData();
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
    const newUnits = units === 'metric' ? 'imperial' : 'metric';
    await onConfigChange({ ...config, units: newUnits });
    await fetchWeather(config.city, newUnits);
  };

  if (loading && !weather) {
    return (
      <div className="p-6 bg-card/95 backdrop-blur-sm rounded-lg border shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/4" />
        </div>
      </div>
    );
  }

  return (
    <>
      {showNotification && createPortal(
        <div className="fixed top-4 right-4 z-[9999] bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="font-semibold mb-2">Weather Alert</div>
          <pre className="whitespace-pre-wrap text-sm">{notificationMessage}</pre>
        </div>,
        document.body
      )}
      <div className="p-6 bg-card/95 backdrop-blur-sm rounded-lg border shadow-sm">
        <div className="space-y-6">
          <header className="flex justify-between items-center">
            {editingCity ? (
              <form 
                className="flex gap-2 items-center" 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCityUpdate();
                }}
              >
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

          {error && (
            <p className="text-destructive text-sm" role="alert">{error}</p>
          )}
          
          {weather && (
            <>
              <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                <img
                  src={`https://openweathermap.org/img/w/${weather.weather[0].icon}.png`}
                  alt={weather.weather[0].description}
                  className="w-16 h-16"
                />
                <div>
                  <p className="text-3xl font-bold">{Math.round(weather.main.temp)}{unitSymbol}</p>
                  <p className="text-muted-foreground capitalize">{weather.weather[0].description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Feels Like</Label>
                  <p>{Math.round(weather.main.feels_like)}{unitSymbol}</p>
                </div>
                <div>
                  <Label>Humidity</Label>
                  <p>{weather.main.humidity}%</p>
                </div>
              </div>

              {airQuality?.list?.[0] && (
                <div className="border-t pt-4">
                  <Label className="block mb-2">Air Quality</Label>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${AQI_LEVELS[airQuality.list[0].main.aqi as keyof typeof AQI_LEVELS].color}`} />
                    <span>{AQI_LEVELS[airQuality.list[0].main.aqi as keyof typeof AQI_LEVELS].label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span>PM2.5: {airQuality.list[0].components.pm2_5.toFixed(1)} μg/m³</span>
                    <span>PM10: {airQuality.list[0].components.pm10.toFixed(1)} μg/m³</span>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label>Temperature Unit</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnitToggle}
                  >
                    Switch to {units === 'metric' ? '°F' : '°C'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export const WeatherWidget: PluginComponent = WeatherWidgetComponent;

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

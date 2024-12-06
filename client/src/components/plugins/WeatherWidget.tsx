import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  name: string;
}

import { type PluginComponent } from '../../lib/types';

export const WeatherWidget: PluginComponent = ({ config, onConfigChange }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCity, setEditingCity] = useState(false);
  const [tempCity, setTempCity] = useState(config.city);

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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(config.city);
    const interval = setInterval(() => {
      fetchWeather(config.city);
    }, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [config.city]);

  const handleCityUpdate = () => {
    if (onConfigChange) {
      onConfigChange({ city: tempCity });
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
  );
};

export const weatherWidgetConfig = {
  id: 'weather-widget',
  name: 'Weather Widget',
  description: 'Displays current weather conditions and forecast',
  version: '1.0.0',
  component: WeatherWidget,
  category: 'widgets',
  defaultConfig: {
    city: 'San Francisco',
    units: 'imperial',
    refreshInterval: 300000
  },
  enabled: true
};

export default WeatherWidget;

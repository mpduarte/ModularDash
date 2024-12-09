import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeatherIcon } from "@/components/ui/weather-icon";
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
  provider?: string;
  sys?: {
    type?: number;
    id?: number;
    country?: string;
    sunrise?: number;
    sunset?: number;
    state?: string;
  };
}

interface WeatherAPIResponse {
  location: {
    name: string;
    lat: number;
    lon: number;
    country: string;
    region: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    feelslike_c: number;
    feelslike_f: number;
    humidity: number;
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

  const formatLocationTitle = (cityInput: string, weatherCityName: string, titleFormat?: string) => {
    // Clean and normalize the input
    const cleanInput = cityInput.replace(/\s*,\s*/g, ',').trim();
    const inputParts = cleanInput.split(',').map(part => part.trim()).filter(Boolean);
    
    // Use input city name or fallback to weather API city name
    const cityName = inputParts[0] || weatherCityName || 'Unknown Location';
    
    // Handle empty or single part input
    if (inputParts.length <= 1) {
      return cityName;
    }
    
    // Check for US state code format (e.g., "CA", "NY")
    const stateCodeRegex = /^[A-Z]{2}$/i;
    const secondPart = inputParts[1];
    const isUSState = stateCodeRegex.test(secondPart);
    
    const stateCode = isUSState ? secondPart.toUpperCase() : '';
    const country = inputParts[2]?.trim() || (isUSState ? 'USA' : secondPart);

    // Format the title based on configuration
    switch (titleFormat) {
      case 'city-only':
        return cityName;
      case 'city-country':
        return country ? `${cityName}, ${country}` : cityName;
      case 'city-state':
        return stateCode ? `${cityName}, ${stateCode}` : cityName;
      case 'city-state-country':
      default:
        if (stateCode && country) {
          return `${cityName}, ${stateCode}, ${country}`;
        } else if (country) {
          return `${cityName}, ${country}`;
        }
        return cityName;
    }
  };

  const fetchWeather = async (city: string, targetUnits?: string) => {
    try {
      setLoading(true);
      setError(null);
      let weatherData = null;
      
      // Let's use only city for initial title until we get the actual data
      if (onConfigChange) {
        onConfigChange({
          ...config,
          city: city
        });
      }
      
      // Try OpenWeatherMap first
      try {
        console.log('Fetching weather data from OpenWeatherMap for city:', city);
        const response = await fetch(
          `${baseUrl}/api/weather?city=${encodeURIComponent(city)}&units=${targetUnits || units}&provider=openweathermap`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log('OpenWeatherMap response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('OpenWeatherMap data received:', data);
          weatherData = { ...data, provider: 'openweathermap' };
          console.log('Transformed weather data:', weatherData);
        } else {
          const errorText = await response.text();
          console.error('OpenWeatherMap error response:', errorText);
          throw new Error('OpenWeatherMap service unavailable');
        }
      } catch (openWeatherError) {
        console.warn('Primary API failed, switching to backup provider');
        
        // Fallback to WeatherAPI.com
        const weatherApiResponse = await fetch(
          `${baseUrl}/api/weather?city=${encodeURIComponent(city)}&units=${targetUnits || units}&provider=weatherapi`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        if (!weatherApiResponse.ok) {
          throw new Error(`Both weather providers failed. WeatherAPI error: ${weatherApiResponse.statusText}`);
        }

        const weatherApiData: WeatherAPIResponse = await weatherApiResponse.json();

        // Transform WeatherAPI.com data to match OpenWeatherMap format
        weatherData = {
          main: {
            temp: units === 'metric' ? weatherApiData.current.temp_c : weatherApiData.current.temp_f,
            feels_like: units === 'metric' ? weatherApiData.current.feelslike_c : weatherApiData.current.feelslike_f,
            humidity: weatherApiData.current.humidity,
            temp_min: units === 'metric' ? weatherApiData.current.temp_c : weatherApiData.current.temp_f,
            temp_max: units === 'metric' ? weatherApiData.current.temp_c : weatherApiData.current.temp_f,
          },
          weather: [{
            description: weatherApiData.current.condition.text,
            icon: weatherApiData.current.condition.icon,
            id: weatherApiData.current.condition.code,
            main: weatherApiData.current.condition.text,
          }],
          name: weatherApiData.location.name,
          coord: {
            lat: weatherApiData.location.lat,
            lon: weatherApiData.location.lon,
          },
          sys: {
            state: weatherApiData.location.region || undefined,
            country: weatherApiData.location.country || undefined
          },
          provider: 'weatherapi'
        };
      }

      if (weatherData && weatherData.main && weatherData.weather) {
        console.log('Setting weather data:', weatherData);
        // Ensure the weather data has the required structure
        const validatedWeatherData = {
          ...weatherData,
          main: {
            temp: weatherData.main.temp || 0,
            feels_like: weatherData.main.feels_like || 0,
            humidity: weatherData.main.humidity || 0,
          },
          weather: [{
            description: weatherData.weather[0]?.description || 'No description available',
            icon: weatherData.weather[0]?.icon || '01d',
            id: weatherData.weather[0]?.id || 0,
            main: weatherData.weather[0]?.main || 'Unknown'
          }]
        };
        setWeather(validatedWeatherData);
        
        // Generate and update the location-based title using the configured format
        const generatedTitle = formatLocationTitle(config.city, weatherData.name, config.titleFormat);
        if (onConfigChange) {
          onConfigChange({
            ...config,
            title: generatedTitle
          });
        }
        
        if (weatherData.coord) {
          console.log('Fetching air quality for coordinates:', weatherData.coord);
          await fetchAirQuality(weatherData.coord.lat, weatherData.coord.lon);
        }
      } else {
        console.warn('Invalid or missing weather data structure:', weatherData);
        setError('Unable to process weather data');
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (config.city) {
        await fetchWeather(config.city);
      }
    };

    fetchData();
    
    // Update title when format changes even without fetching
    if (weather && onConfigChange && config.titleFormat) {
      const newTitle = formatLocationTitle(config.city, weather.name, config.titleFormat);
      onConfigChange({
        ...config,
        title: newTitle
      });
    }

    const refreshInterval = config.autoRefresh ? Math.max(5000, (config.refreshInterval || 30) * 1000) : 0;
    
    let interval: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      interval = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [config.city, config.refreshInterval, config.units, config.autoRefresh, config.titleFormat]);

  if (loading && !weather) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4 rounded-lg border border-destructive/50">
        <p className="font-medium">Error loading weather data</p>
        <p className="text-sm mt-1">{error}</p>
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
      
      {error ? (
        <div className="text-destructive p-4 text-center rounded-lg border border-destructive/20 bg-destructive/10">
          <p>{error}</p>
        </div>
      ) : weather && weather.main && weather.weather ? (
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="relative flex items-center gap-4">
                <div className="relative">
                  <WeatherIcon
                    condition={weather.weather[0]?.icon || '01d'}
                    size="md"
                    animated={true}
                    className="transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary/10 backdrop-blur-sm border border-border/20 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-primary">
                      {typeof weather.main.humidity === 'number' ? weather.main.humidity : '--'}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-4xl font-bold tracking-tight">
                    {typeof weather.main.temp === 'number' ? Math.round(weather.main.temp) : '--'}
                    <span className="text-2xl ml-1">{unitSymbol}</span>
                  </p>
                  <p className="text-muted-foreground capitalize text-sm font-medium mt-1">
                    {weather.weather[0]?.description || 'Weather information unavailable'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <div className="space-y-1 p-3 rounded-lg bg-background/30 backdrop-blur-sm border border-border/20 transition-colors hover:bg-background/40">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground/70">Feels Like</Label>
              <p className="text-lg font-semibold">
                {typeof weather.main.feels_like === 'number' ? Math.round(weather.main.feels_like) : '--'}
                <span className="text-sm ml-1">{unitSymbol}</span>
              </p>
            </div>
            
            {airQuality?.list?.[0] && (
              <div className="space-y-1 p-3 rounded-lg bg-background/30 backdrop-blur-sm border border-border/20 transition-colors hover:bg-background/40">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground/70">Air Quality</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-background/20 overflow-hidden">
                    <div 
                      className={`h-full ${AQI_LEVELS[airQuality.list[0].main.aqi as keyof typeof AQI_LEVELS].color} transition-all duration-300`} 
                      style={{ width: `${(airQuality.list[0].main.aqi / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{AQI_LEVELS[airQuality.list[0].main.aqi as keyof typeof AQI_LEVELS].label}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-border/10">
            <p className="text-[10px] text-muted-foreground/60 text-right">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 h-full">
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded-lg w-3/4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-20 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      )}
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
    city: 'San Francisco, CA, USA',
    units: 'imperial',
    titleFormat: 'city-state-country', // Options: 'city-only', 'city-country', 'city-state', 'city-state-country'
    refreshInterval: 300000,
    enableAlerts: false,
    alertThreshold: 80,
    weatherCondition: 'rain',
    alertType: 'visual'
  }
};

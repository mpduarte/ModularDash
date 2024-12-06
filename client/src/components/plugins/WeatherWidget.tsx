import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface WeatherWidgetProps {
  config: {
    city?: string;
  };
}

const WeatherWidget = ({ config }: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const city = config.city || 'San Francisco';
        const response = await axios.get(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = response.data;
        
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].description,
          humidity: data.main.humidity,
          windSpeed: data.wind.speed,
          icon: data.weather[0].icon,
        });
        setError(null);
      } catch (err) {
        setError('Failed to fetch weather data');
        console.error('Error fetching weather:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [config.city]);

  if (loading) {
    return (
      <Card className="p-4 w-full h-full">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-8 w-1/2" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 w-full h-full">
        <div className="text-red-500">{error}</div>
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <Card className="p-4 w-full h-full">
      <div className="flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-2">{config.city || 'San Francisco'}</h3>
        <img
          src={`http://openweathermap.org/img/w/${weather.icon}.png`}
          alt={weather.description}
          className="w-16 h-16"
        />
        <div className="text-3xl font-bold my-2">{weather.temp}°F</div>
        <div className="text-gray-600 capitalize">{weather.description}</div>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-500">Humidity:</span>
            <span className="ml-2">{weather.humidity}%</span>
          </div>
          <div>
            <span className="text-gray-500">Wind:</span>
            <span className="ml-2">{weather.windSpeed} mph</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
export const weatherWidgetConfig = {
  id: 'weather-widget',
  name: 'Weather Widget',
  description: 'Displays current weather conditions',
  component: WeatherWidget,
  defaultConfig: {
    city: 'San Francisco',
  },
  configSchema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        title: 'City',
        default: 'San Francisco',
      },
    },
  },
};

export default WeatherWidget;

export const weatherWidgetConfig = {
  id: 'weather-widget',
  name: 'Weather Widget',
  description: 'Displays current weather conditions',
  component: WeatherWidget,
  defaultConfig: {
    city: 'San Francisco',
  },
  configSchema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        title: 'City',
        default: 'San Francisco',
      },
    },
  },
};

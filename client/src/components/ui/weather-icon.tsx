import * as React from "react";
import { cn } from "@/lib/utils";

interface WeatherIconProps extends React.HTMLAttributes<HTMLDivElement> {
  condition: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const weatherConditions = {
  "01d": "clear-day",
  "01n": "clear-night",
  "02d": "partly-cloudy-day",
  "02n": "partly-cloudy-night",
  "03d": "cloudy",
  "03n": "cloudy",
  "04d": "cloudy",
  "04n": "cloudy",
  "09d": "rain",
  "09n": "rain",
  "10d": "rain",
  "10n": "rain",
  "11d": "thunderstorm",
  "11n": "thunderstorm",
  "13d": "snow",
  "13n": "snow",
  "50d": "mist",
  "50n": "mist",
} as const;

export const WeatherIcon = React.forwardRef<HTMLDivElement, WeatherIconProps>(
  ({ condition, size = "md", animated = true, className, ...props }, ref) => {
    const iconClass = weatherConditions[condition as keyof typeof weatherConditions] || "clear-day";
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative weather-icon",
          {
            "w-8 h-8": size === "sm",
            "w-16 h-16": size === "md",
            "w-24 h-24": size === "lg",
          },
          animated && "weather-icon-animated",
          `weather-${iconClass}`,
          className
        )}
        {...props}
      >
        <div className="weather-icon-layer primary" />
        <div className="weather-icon-layer secondary" />
        <div className="weather-icon-layer tertiary" />
      </div>
    );
  }
);

WeatherIcon.displayName = "WeatherIcon";

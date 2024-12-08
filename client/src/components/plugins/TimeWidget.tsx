import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';

interface TimeWidgetProps {
  config: {
    format?: string;
    showSeconds?: boolean;
    use24Hour?: boolean;
    showDate?: boolean;
    dateFormat?: string;
    timezone?: string;
    displayMode?: 'digital' | 'analog';
    showMinuteMarks?: boolean;
    showHourMarks?: boolean;
    clockSize?: number;
  };
}

const AnalogClock: React.FC<{ time: Date; config: TimeWidgetProps['config'] }> = ({ time, config }) => {
  const size = config.clockSize || 200;
  const center = size / 2;
  const hourHandLength = size * 0.25; // Slightly shorter for better proportion
  const minuteHandLength = size * 0.35;
  const secondHandLength = size * 0.4;
  const radius = size * 0.45; // Slightly smaller radius for better appearance

  // Calculate angles with smooth transitions
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const milliseconds = time.getMilliseconds();

  // Smooth transitions for all hands
  const hourAngle = ((hours + minutes / 60) * 30) - 90;
  const minuteAngle = ((minutes + seconds / 60) * 6) - 90;
  const secondAngle = ((seconds + milliseconds / 1000) * 6) - 90;

  return (
    <svg 
      width={size} 
      height={size} 
      className="transform transition-transform duration-300 ease-in-out"
      style={{ transform: 'rotate(-90deg)' }}
    >
      {/* Clock face with gradient background */}
      <defs>
        <radialGradient id="face-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          <stop offset="90%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Clock face background */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="url(#face-gradient)"
      />

      {/* Clock border */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        className="transition-colors duration-300"
      />

      {/* Hour marks - thicker and longer for better visibility */}
      {config.showHourMarks && [...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const length = i % 3 === 0 ? 0.08 : 0.06; // Longer marks for 12, 3, 6, 9
        const x1 = center + (radius - size * length) * Math.cos(angle);
        const y1 = center + (radius - size * length) * Math.sin(angle);
        const x2 = center + radius * Math.cos(angle);
        const y2 = center + radius * Math.sin(angle);
        return (
          <line
            key={`hour-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth={i % 3 === 0 ? 3 : 2}
            className="transition-colors duration-300"
          />
        );
      })}

      {/* Minute marks - thinner and shorter */}
      {config.showMinuteMarks && [...Array(60)].map((_, i) => {
        if (i % 5 !== 0) {
          const angle = (i * 6 * Math.PI) / 180;
          const x1 = center + (radius - size * 0.03) * Math.cos(angle);
          const y1 = center + (radius - size * 0.03) * Math.sin(angle);
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <line
              key={`minute-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1"
              className="transition-colors duration-300"
            />
          );
        }
        return null;
      })}

      {/* Hour hand with rounded end */}
      <line
        x1={center}
        y1={center}
        x2={center + hourHandLength * Math.cos((hourAngle * Math.PI) / 180)}
        y2={center + hourHandLength * Math.sin((hourAngle * Math.PI) / 180)}
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="transition-colors duration-300"
      />

      {/* Minute hand with rounded end */}
      <line
        x1={center}
        y1={center}
        x2={center + minuteHandLength * Math.cos((minuteAngle * Math.PI) / 180)}
        y2={center + minuteHandLength * Math.sin((minuteAngle * Math.PI) / 180)}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="transition-colors duration-300"
      />

      {/* Second hand with smooth movement */}
      {config.showSeconds && (
        <line
          x1={center}
          y1={center}
          x2={center + secondHandLength * Math.cos((secondAngle * Math.PI) / 180)}
          y2={center + secondHandLength * Math.sin((secondAngle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="transition-colors duration-300"
        />
      )}

      {/* Center dot with shadow effect */}
      <circle
        cx={center}
        cy={center}
        r="4"
        fill="currentColor"
        className="transition-colors duration-300"
      />
    </svg>
  );
};

export const TimeWidget: React.FC<TimeWidgetProps> = ({ config }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    // Update more frequently for smooth second hand movement in analog mode
    const interval = config.displayMode === 'analog' && config.showSeconds ? 50 : 1000;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, interval);

    return () => clearInterval(timer);
  }, [config.displayMode, config.showSeconds]);

  const timeFormat = config.use24Hour ? 'HH:mm' : 'hh:mm a';
  const fullTimeFormat = config.showSeconds ? `${timeFormat}:ss` : timeFormat;
  
  return (
    <Card className="w-full h-full relative overflow-hidden">
      <CardContent className="p-6 flex flex-col items-center justify-center h-full">
        {config.displayMode === 'analog' ? (
          <div className="relative group transition-all duration-300 hover:scale-105">
            <AnalogClock time={currentTime} config={config} />
          </div>
        ) : (
          <div className="text-4xl font-bold">
            {format(currentTime, fullTimeFormat)}
          </div>
        )}
        {config.showDate && (
          <div className={`text-lg text-muted-foreground mt-2 ${config.displayMode === 'analog' ? 'text-center' : ''}`}>
            {format(currentTime, config.dateFormat || 'PPP')}
            {config.dateFormat === 'do' && (
              <span className="ml-1">of {format(currentTime, 'MMMM')}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const timeWidgetConfig = {
  name: 'Clock',
  version: '1.0.0',
  defaultConfig: {
    format: 'HH:mm',
    showSeconds: false,
    use24Hour: false,
    showDate: true,
    dateFormat: 'PPP',
    timezone: 'local',
    displayMode: 'digital',
    showMinuteMarks: true,
    showHourMarks: true,
    clockSize: 200
  }
};

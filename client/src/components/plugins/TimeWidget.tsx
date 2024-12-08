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
  const hourHandLength = size * 0.3;
  const minuteHandLength = size * 0.4;
  const secondHandLength = size * 0.45;

  const hourAngle = (time.getHours() % 12 + time.getMinutes() / 60) * 30 - 90;
  const minuteAngle = (time.getMinutes() + time.getSeconds() / 60) * 6 - 90;
  const secondAngle = time.getSeconds() * 6 - 90;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Clock face */}
      <circle
        cx={center}
        cy={center}
        r={size * 0.48}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Hour marks */}
      {config.showHourMarks && [...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = center + (size * 0.45) * Math.cos(angle);
        const y1 = center + (size * 0.45) * Math.sin(angle);
        const x2 = center + (size * 0.48) * Math.cos(angle);
        const y2 = center + (size * 0.48) * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="2"
          />
        );
      })}

      {/* Minute marks */}
      {config.showMinuteMarks && [...Array(60)].map((_, i) => {
        if (i % 5 !== 0) { // Skip positions where hour marks are
          const angle = (i * 6 * Math.PI) / 180;
          const x1 = center + (size * 0.46) * Math.cos(angle);
          const y1 = center + (size * 0.46) * Math.sin(angle);
          const x2 = center + (size * 0.48) * Math.cos(angle);
          const y2 = center + (size * 0.48) * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1"
            />
          );
        }
        return null;
      })}

      {/* Hour hand */}
      <line
        x1={center}
        y1={center}
        x2={center + hourHandLength * Math.cos((hourAngle * Math.PI) / 180)}
        y2={center + hourHandLength * Math.sin((hourAngle * Math.PI) / 180)}
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Minute hand */}
      <line
        x1={center}
        y1={center}
        x2={center + minuteHandLength * Math.cos((minuteAngle * Math.PI) / 180)}
        y2={center + minuteHandLength * Math.sin((minuteAngle * Math.PI) / 180)}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Second hand */}
      {config.showSeconds && (
        <line
          x1={center}
          y1={center}
          x2={center + secondHandLength * Math.cos((secondAngle * Math.PI) / 180)}
          y2={center + secondHandLength * Math.sin((secondAngle * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      )}

      {/* Center dot */}
      <circle
        cx={center}
        cy={center}
        r="3"
        fill="currentColor"
      />
    </svg>
  );
};

export const TimeWidget: React.FC<TimeWidgetProps> = ({ config }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeFormat = config.use24Hour ? 'HH:mm' : 'hh:mm a';
  const fullTimeFormat = config.showSeconds ? `${timeFormat}:ss` : timeFormat;
  
  return (
    <Card className="w-full h-full">
      <CardContent className="p-6 flex flex-col items-center justify-center h-full">
        {config.displayMode === 'analog' ? (
          <AnalogClock time={currentTime} config={config} />
        ) : (
          <div className="text-4xl font-bold">
            {format(currentTime, fullTimeFormat)}
          </div>
        )}
        {config.showDate && (
          <div className="text-lg text-muted-foreground mt-2">
            {format(currentTime, config.dateFormat || 'PPP')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const timeWidgetConfig = {
  name: 'Time Widget',
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

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
  };
}

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
        <div className="text-4xl font-bold">
          {format(currentTime, fullTimeFormat)}
        </div>
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
    timezone: 'local'
  }
};

import { ReactNode } from 'react';

interface BackgroundZoneProps {
  children: ReactNode;
}

export default function BackgroundZone({ children }: BackgroundZoneProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
      <div className="relative pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

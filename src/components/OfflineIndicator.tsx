import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold shadow-lg">
      <WifiOff className="w-3 h-3" />
      <span>OFFLINE</span>
    </div>
  );
};

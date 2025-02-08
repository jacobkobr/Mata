'use client'

import React, { useEffect, useState } from 'react';
import { Minus, Square, Maximize2, X } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from './theme-toggle';
import { SettingsPanel } from './settings-panel';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    electron: {
      send: (channel: string) => Promise<boolean>;
      receive: (channel: string, func: (...args: any[]) => void) => void;
      removeListener: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if we're running in Electron
    setIsElectron(!!window.electron);

    if (window.electron) {
      const handleMaximized = (maximized: boolean) => {
        setIsMaximized(maximized);
      };

      window.electron.receive('window-maximized', handleMaximized);

      return () => {
        window.electron.removeListener('window-maximized', handleMaximized);
      };
    }
  }, []);

  const handleMinimize = () => {
    window.electron?.send('minimize-window');
  };

  const handleMaximize = async () => {
    const maximized = await window.electron?.send('maximize-window');
    setIsMaximized(maximized);
  };

  const handleClose = () => {
    window.electron?.send('close-window');
  };

  return (
    <div className={cn(
      "h-8 bg-background border-b flex items-center justify-between px-2 select-none",
      isElectron && "[&_*]:app-region-no-drag app-region-drag"
    )}>
      <div className="flex items-center space-x-2">
        <div className="relative w-4 h-4">
          <Image
            src="/icons/mata.ico"
            alt="Logo"
            width={16}
            height={16}
            className="dark:invert"
            priority
          />
        </div>
        <span className="text-sm font-medium">Mata AI</span>
      </div>
      {isElectron && (
        <div className="flex items-center">
          <button
            onClick={handleMinimize}
            className="p-2 hover:bg-muted rounded-sm"
            aria-label="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-2 hover:bg-muted rounded-sm"
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Square className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-sm"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
} 
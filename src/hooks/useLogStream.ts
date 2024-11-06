import { useState, useEffect } from 'react';
import { LogEntry } from '../types/api';

export const useLogStream = (file: string) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws');

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log' && data.payload.filename === file) {
        setLogs(prev => [data.payload, ...prev].slice(0, 1000)); // Keep last 1000 logs
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [file]);

  return { logs, isConnected };
};

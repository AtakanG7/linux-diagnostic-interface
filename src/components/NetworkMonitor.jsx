import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertCircle, Lock } from 'lucide-react';

const NetworkMonitor = () => {
  const [packets, setPackets] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastBatchTimestamp, setLastBatchTimestamp] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:8080/api/network/metrics');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (Array.isArray(data)) {
          setPackets(data);
          setLastBatchTimestamp(Date.now());
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8080/ws');

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'network' && Array.isArray(data.payload)) {
            setLastBatchTimestamp(Date.now());
            setPackets(prev => [...data.payload, ...prev].slice(0, 100));
          }
        } catch (error) {
          console.error('WebSocket message processing error:', error);
        }
      };

      return ws;
    };

    const ws = connectWebSocket();
    return () => ws.close();
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getConnectionStatus = (packet) => {
    const flags = packet.tcp_flags || '';
    if (flags.includes('RST:true')) return { status: 'error', message: 'Reset' };
    if (flags.includes('SYN:true')) return { status: 'info', message: 'New' };
    if (flags.includes('FIN:true')) return { status: 'warning', message: 'Closing' };
    return { status: 'success', message: 'Active' };
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading network data...</div>
      </div>
    );
  }

  const PacketRow = ({ packet, index, isNewBatch }) => {
    const status = getConnectionStatus(packet);
    
    return (
      <tr 
        className={`
          ${status.status === 'error' ? 'bg-red-50' : 
            status.status === 'warning' ? 'bg-yellow-50' : 
            'hover:bg-gray-50'}
          ${isNewBatch ? 'animate-slide-in' : ''}
        `}
      >
        <td className="px-4 py-2 text-sm text-gray-500">
          {new Date(packet.timestamp).toLocaleTimeString()}
        </td>
        <td className="px-4 py-2 text-sm">
          <div className="flex items-center space-x-2">
            {(packet.dst_port === 443 || packet.src_port === 443) && 
              <Lock size={14} className="text-green-500" />
            }
            <span>{`${packet.src_ip}:${packet.src_port} → ${packet.dst_ip}:${packet.dst_port}`}</span>
          </div>
        </td>
        <td className="px-4 py-2 text-sm">
          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            {packet.protocol}
          </span>
        </td>
        <td className="px-4 py-2 text-sm">
          <div className="flex flex-col">
            <span>{formatBytes(packet.length)}</span>
            {packet.payload_size > 0 && (
              <span className="text-xs text-gray-500">
                {formatBytes(packet.payload_size)} payload
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-2 text-sm">
          <div className="flex flex-wrap gap-1">
            {packet.tcp_flags?.split(' ').map((flag, i) => {
              const [name, value] = flag.split(':');
              if (value === 'true') {
                return (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-100">
                    {name}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </td>
        <td className="px-4 py-2 text-sm">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs
            ${status.status === 'error' ? 'bg-red-100 text-red-800' :
              status.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              status.status === 'info' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'}`}
          >
            {status.message}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4 bg-gray-50">
      <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className={isConnected ? 'text-green-500' : 'text-red-500'} />
          <span className={`font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? 'Live Monitoring' : 'Reconnecting...'}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {packets.length > 0 && `${packets.length} packets`}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden flex-1">
        <div className="overflow-auto h-full">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Source → Destination</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Protocol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Flags</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {packets.map((packet, index) => (
                <PacketRow 
                  key={`${packet.timestamp}-${index}`}
                  packet={packet}
                  index={index}
                  isNewBatch={index < 10 && Date.now() - lastBatchTimestamp < 1000}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default NetworkMonitor;
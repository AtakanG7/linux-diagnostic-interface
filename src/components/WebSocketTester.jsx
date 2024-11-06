import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WifiOff } from 'lucide-react';

const WebSocketTester = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef(null);

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket('ws://localhost:8080/ws');

      wsRef.current.onopen = () => {
        setIsConnected(true);
        addMessage('system', 'Connected to WebSocket server');
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        addMessage('system', 'Disconnected from WebSocket server');
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        addMessage('error', 'WebSocket error occurred');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage('received', data);
        } catch (e) {
          addMessage('received', event.data);
        }
      };
    } catch (error) {
      console.error('Connection error:', error);
      addMessage('error', `Connection error: ${error.message}`);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const addMessage = (type, content) => {
    const timestamp = new Date().toISOString();
    setMessages(prev => [...prev, { type, content, timestamp }]);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const renderMessage = (message) => {
    const { type, content, timestamp } = message;
    
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';
    
    switch (type) {
      case 'system':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'error':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
      case 'received':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
    }

    return (
      <div className={`p-3 rounded-lg mb-2 ${bgColor} ${textColor}`}>
        <div className="flex justify-between items-start">
          <div className="font-mono text-sm">
            <pre className="whitespace-pre-wrap">
              {typeof content === 'object' ? JSON.stringify(content, null, 2) : content}
            </pre>
          </div>
          <div className="text-xs text-gray-500 ml-4">
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">WebSocket Tester</h2>
          <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 
            ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
            {!isConnected && <WifiOff className="h-4 w-4" />}
          </div>
        </div>

        <div className="space-x-2 mb-4">
          <button
            onClick={connect}
            disabled={isConnected}
            className={`px-4 py-2 rounded-lg ${
              isConnected 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={!isConnected}
            className={`px-4 py-2 rounded-lg ${
              !isConnected 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            Disconnect
          </button>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-4 py-2 rounded-lg ${
              autoScroll 
                ? 'bg-gray-200 text-gray-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>

        <div 
          ref={scrollRef}
          className="h-[600px] border rounded-lg p-4 overflow-y-auto"
        >
          <div className="space-y-2">
            {messages.map((msg, index) => (
              <div key={index}>
                {renderMessage(msg)}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Connection Info:</h3>
          <p className="text-sm text-gray-600">
            URL: ws://localhost:8080/ws<br />
            Status: {isConnected ? 'Connected' : 'Disconnected'}<br />
            Messages Received: {messages.filter(m => m.type === 'received').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebSocketTester;
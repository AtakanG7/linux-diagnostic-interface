import React from 'react';

const getLogLevelColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'error':
      return 'text-red-600 bg-red-50';
    case 'warning':
      return 'text-amber-600 bg-amber-50';
    case 'info':
      return 'text-blue-600 bg-blue-50';
    case 'debug':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const Line = ({ line, timestamp, type }) => {
  // Parse log line
  const parts = line.split(': ');
  let header = '', message = '';
  
  if (parts.length > 1) {
    header = parts[0];
    message = parts.slice(1).join(': ');
    
    // Further parse header
    const headerParts = header.split(' ');
    const datetime = headerParts.slice(0, 3).join(' ');
    const source = headerParts[3];
    const component = headerParts[4];
    
    return (
      <div className="font-mono text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors p-2">
        <div className="flex items-center gap-2 mb-1">
          {/* Timestamp */}
          <span className="text-gray-500 text-xs">
            {datetime}
          </span>
          
          {/* Source */}
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
            {source}
          </span>
          
          {/* Component */}
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
            {component}
          </span>
          
          {/* Log Level Badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full ${getLogLevelColor(type)}`}>
            {type || 'LOG'}
          </span>
        </div>
        
        {/* Message */}
        <div className="pl-4 text-gray-700">
          {message}
        </div>
      </div>
    );
  }
  
  // Fallback for unparseable lines
  return (
    <div className="font-mono text-sm p-2 border-b border-gray-100 hover:bg-gray-50">
      <span className={`text-xs px-2 py-0.5 rounded-full ${getLogLevelColor(type)}`}>
        {type || 'LOG'}
      </span>
      <div className="mt-1 text-gray-700">
        {line}
      </div>
    </div>
  );
};

export default Line;
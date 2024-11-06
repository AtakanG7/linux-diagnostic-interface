import React, { useState, useEffect } from 'react';
import { 
  FolderIcon, SearchIcon, XIcon, ChevronRightIcon, 
  ChevronDownIcon, AlertCircleIcon, InfoIcon, 
  AlertTriangleIcon, LoaderIcon, ClockIcon 
} from 'lucide-react';

const parseLogLine = (line) => {
  // Common log patterns
  const patterns = {
    syslog: /^(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+([^:]+):\s*(?:\[(.*?)\])?\s*(.*)$/,
    xorg: /^\[(.*?)\]\s+(.*)$/,
    kernel: /^(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+kernel:\s*\[(.*?)\]\s+(.*)$/
  };

  // Try to match syslog format first
  let match = line.match(patterns.syslog);
  if (match) {
    return {
      timestamp: match[1],
      host: match[2],
      process: match[3],
      metadata: match[4],
      message: match[5],
      format: 'syslog'
    };
  }

  // Try Xorg format
  match = line.match(patterns.xorg);
  if (match) {
    return {
      timestamp: match[1],
      message: match[2],
      format: 'xorg'
    };
  }

  // Try kernel format
  match = line.match(patterns.kernel);
  if (match) {
    return {
      timestamp: match[1],
      host: match[2],
      metadata: match[3],
      message: match[4],
      format: 'kernel'
    };
  }

  // Fallback
  return { message: line, format: 'unknown' };
};

const getTypeColor = (type) => {
  switch(type?.toLowerCase()) {
    case 'error':
      return 'border-red-500 bg-red-50';
    case 'warning':
      return 'border-amber-500 bg-amber-50';
    case 'info':
      return 'border-blue-500 bg-blue-50';
    default:
      return 'border-gray-300 bg-gray-50';
  }
};

const getTypeIcon = (type) => {
  switch(type?.toLowerCase()) {
    case 'error':
      return <AlertCircleIcon className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangleIcon className="w-4 h-4 text-amber-500" />;
    case 'info':
      return <InfoIcon className="w-4 h-4 text-blue-500" />;
    default:
      return <InfoIcon className="w-4 h-4 text-gray-500" />;
  }
};

const LogViewer = () => {
  const [files, setFiles] = useState([]);
  const [expandedFiles, setExpandedFiles] = useState(new Set());
  const [fileLogs, setFileLogs] = useState({});
  const [loading, setLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/logs');
      const paths = await response.json();
      setFiles(paths);
      
      // Fetch initial logs for each file in parallel
      const initialLogs = await Promise.all(
        paths.map(path => fetchLogContent(path, false))
      );
      
      const logsMap = {};
      paths.forEach((path, index) => {
        logsMap[path] = initialLogs[index] || [];
      });
      setFileLogs(logsMap);
    } catch (err) {
      setError('Failed to fetch log files');
    }
  };

  const fetchLogContent = async (filePath, loadMore = false) => {
    const currentLogs = fileLogs[filePath] || [];
    setLoading(prev => ({ ...prev, [filePath]: true }));

    try {
      const params = new URLSearchParams({
        file_path: filePath,
        limit: loadMore ? '15' : '5'
      });

      if (loadMore && currentLogs.length > 0) {
        params.append('last_timestamp', currentLogs[currentLogs.length - 1].timestamp);
      }

      const response = await fetch(`http://localhost:8080/api/logs/content?${params}`);
      const newLogs = await response.json();

      setFileLogs(prev => ({
        ...prev,
        [filePath]: loadMore ? [...currentLogs, ...newLogs] : newLogs
      }));

      return newLogs;
    } catch (err) {
      setError(`Failed to fetch logs for ${filePath}`);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, [filePath]: false }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const results = {};
      await Promise.all(
        files.map(async (file) => {
          const params = new URLSearchParams({
            file_path: file,
            query: searchQuery,
            limit: '50'
          });
          const response = await fetch(`http://localhost:8080/api/logs/search?${params}`);
          const fileResults = await response.json();
          if (fileResults.length > 0) {
            results[file] = fileResults;
          }
        })
      );
      setSearchResults(results);
      // Expand all files with results
      setExpandedFiles(new Set(Object.keys(results)));
    } catch (err) {
      setError('Search failed');
    }
  };

  const toggleFile = (filePath) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  const renderLogEntry = (log) => {
    const parsedLog = parseLogLine(log.line);
    
    return (
      <div 
        key={log.id}
        className={`ml-6 p-3 mb-1 border-l-4 ${getTypeColor(log.notification_type)}`}
      >
        <div className="flex items-center gap-2 mb-1 text-sm">
          {getTypeIcon(log.notification_type)}
          <span className="font-medium">
            {parsedLog.process || parsedLog.format}
          </span>
          <span className="text-gray-500">
            <ClockIcon className="w-3 h-3 inline mr-1" />
            {new Date(log.timestamp).toLocaleString()}
          </span>
          <span className="text-gray-400 text-xs">
            Line {log.line_num}
          </span>
        </div>
        
        <div className="text-sm text-gray-700">
          {parsedLog.message}
        </div>
        
        {parsedLog.metadata && (
          <div className="mt-1 text-xs text-gray-500">
            {parsedLog.metadata}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Search Bar */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search logs across all files..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Search
        </button>
        {searchResults && (
          <button
            onClick={() => setSearchResults(null)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircleIcon className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Files and Logs */}
      <div className="space-y-2">
        {files.map(file => {
          const isExpanded = expandedFiles.has(file);
          const fileResults = searchResults?.[file];
          const logsToShow = searchResults ? fileResults : fileLogs[file];
          
          if (searchResults && !fileResults) return null;

          return (
            <div key={file} className="border rounded-lg">
              <div
                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleFile(file)}
              >
                <FolderIcon className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{file}</span>
                {searchResults && (
                  <span className="text-sm text-gray-500">
                    ({fileResults.length} results)
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 ml-auto" />
                )}
              </div>

              {isExpanded && (
                <div className="border-t">
                  {logsToShow?.map(renderLogEntry)}
                  
                  {loading[file] ? (
                    <div className="p-4 text-center text-gray-500">
                      <LoaderIcon className="w-5 h-5 animate-spin inline" />
                    </div>
                  ) : (
                    !searchResults && (
                      <button
                        onClick={() => fetchLogContent(file, true)}
                        className="w-full p-2 text-sm text-gray-500 hover:bg-gray-50 border-t"
                      >
                        Load More
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LogViewer;
import React, { useState, useEffect } from 'react';
import { ChevronRight, Folder, File, Loader2, Home, Search } from 'lucide-react';

const FileExplorer = () => {
  const [parentDirectories, setParentDirectories] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [keywords, setKeywords] = useState(['error', 'warning']); // Default keywords
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const hasExtension = (name) => {
    if (!name || typeof name !== 'string') return false;
    const lastDotIndex = name.lastIndexOf('.');
    return lastDotIndex > 0 && lastDotIndex < name.length - 1;
  };

  const formatPathToItem = (path) => {
    if (!path) return null;
    
    if (path === '/') {
      return {
        name: '/',
        path: '/',
        type: 'directory'
      };
    }

    const name = path.split('/').pop() || path;
    const type = hasExtension(name) ? 'file' : 'directory';
    
    return {
      name,
      path,
      type
    };
  };

  const fetchParentDirectories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/api/directory');
      if (!response.ok) throw new Error('Failed to fetch parent directories');
      const paths = await response.json();
      const formattedData = paths.map(formatPathToItem);
      setParentDirectories(formattedData);
    } catch (error) {
      setError('Failed to load directories. Please try again.');
      console.error('Error fetching parent directories:', error);
    }
    setLoading(false);
  };

  const fetchDirectoryContents = async (path) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/api/files?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('Failed to fetch directory contents');
      const paths = await response.json();
      
      const filteredPaths = paths.filter(p => p !== path);
      const items = filteredPaths.map(formatPathToItem);
      const sortedItems = items.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
      
      setCurrentItems(sortedItems);
    } catch (error) {
      setError('Failed to load directory contents. Please try again.');
      console.error('Error fetching directory contents:', error);
    }
    setLoading(false);
  };

  const handleSubmitAnalysis = async () => {
    if (selectedItems.size === 0) {
      setError('Please select at least one file or directory');
      return;
    }

    try {
      const requestData = {
        files: Array.from(selectedItems),
        keywords: keywords,
        ...(startTime && { start_time: new Date(startTime).toISOString() }),
        ...(endTime && { end_time: new Date(endTime).toISOString() })
      };

      const response = await fetch('http://localhost:8080/api/logs/search/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to start log analysis');
      }

      const result = await response.json();
      console.log('Analysis started:', result);
      
      // Clear selections after successful submission
      setSelectedItems(new Set());
      setError(null);
      alert('Log analysis started successfully');
    } catch (error) {
      setError('Failed to start log analysis. Please try again.');
      console.error('Error starting log analysis:', error);
    }
  };

  useEffect(() => {
    fetchParentDirectories();
  }, []);

  useEffect(() => {
    if (currentPath) {
      fetchDirectoryContents(currentPath);
    } else {
      setCurrentItems([]);
    }
  }, [currentPath]);

  const handleItemClick = (item) => {
    if (item.type === 'directory') {
      setCurrentPath(item.path);
    }
  };

  const handleItemSelect = (item, event) => {
    event.stopPropagation();
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(item.path)) {
      newSelectedItems.delete(item.path);
    } else {
      newSelectedItems.add(item.path);
    }
    setSelectedItems(newSelectedItems);
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.length ? '/' + pathParts.join('/') : '';
    setCurrentPath(newPath);
  };

  const Breadcrumbs = () => {
    if (!currentPath) return null;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    
    return (
      <div className="flex items-center space-x-2 text-sm">
        <button 
          onClick={() => setCurrentPath('')}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="Go to root"
        >
          <Home size={18} className="text-gray-600" />
        </button>
        {pathParts.length > 0 && <span className="text-gray-400">/</span>}
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <button
              className="hover:bg-gray-100 px-2 py-1 rounded transition-colors text-gray-600"
              onClick={() => {
                const newPath = '/' + pathParts.slice(0, index + 1).join('/');
                setCurrentPath(newPath);
              }}
            >
              {part}
            </button>
            {index < pathParts.length - 1 && (
              <span className="text-gray-400">/</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const FileItem = ({ item }) => {
    const isSelected = selectedItems.has(item.path);
    const isDirectory = item.type === 'directory';

    return (
      <div
        className={`
          flex items-center space-x-2 p-3 cursor-pointer
          ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
          transition-colors duration-150 group rounded-lg
        `}
        onClick={() => handleItemClick(item)}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {isDirectory ? (
            <Folder size={20} className="text-blue-500 flex-shrink-0" />
          ) : (
            <File size={20} className="text-gray-500 flex-shrink-0" />
          )}
          <span className="text-sm text-gray-700 font-medium truncate">
            {item.name}
          </span>
        </div>
        <div 
          className={`
            w-5 h-5 rounded-md border flex-shrink-0 group-hover:border-blue-400
            ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
            transition-colors duration-150
          `}
          onClick={(e) => handleItemSelect(item, e)}
        >
          {isSelected && (
            <svg
              className="w-5 h-5 text-white p-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
    );
  };

  const filteredItems = (currentPath === '' ? parentDirectories : currentItems)
    .filter(item => 
      item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.path?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Log File Explorer</h2>
          {currentPath && (
            <button
              onClick={handleNavigateUp}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100"
            >
              Up
            </button>
          )}
        </div>
        
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search in current directory..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Breadcrumbs />
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
        <span className="text-sm text-gray-600">
          Current location: {currentPath || 'Root'}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-1">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow-sm">
              {searchTerm 
                ? 'No matching files or folders found' 
                : currentPath === '' 
                  ? 'No parent directories found' 
                  : 'This folder is empty'}
            </div>
          ) : (
            filteredItems.map((item) => (
              <FileItem 
                key={item.path} 
                item={item}
              />
            ))
          )}
        </div>
      </div>

      {selectedItems.size > 0 && (
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
              <input
                type="text"
                value={keywords.join(', ')}
                onChange={(e) => setKeywords(e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                placeholder="error, warning, critical"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time (optional)</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time (optional)</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <div className="space-x-3">
              <button 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                onClick={() => {
                  setSelectedItems(new Set());
                  setStartTime('');
                  setEndTime('');
                }}
              >
                Clear Selection
              </button>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                onClick={handleSubmitAnalysis}
              >
                Start Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
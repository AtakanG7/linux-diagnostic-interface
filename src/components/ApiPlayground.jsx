import React, { useState } from 'react';
import axios from 'axios';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ApiPlayground = () => {
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState({});
  const [activeTab, setActiveTab] = useState('fileTree');
  const [inputs, setInputs] = useState({
    fileTree: {
      path: '/',
      depth: 1
    },
    logs: {
      file: '/var/log/syslog',
      before: '',
      limit: 100
    },
    searchLogs: {
      query: '',
      files: ['/var/log/syslog'],
      startTime: '',
      endTime: ''
    },
    networkMetrics: {
      start: '',
      end: '',
      protocol: '',
      src_ip: '',
      dst_ip: '',
      src_port: '',
      dst_port: '',
      length: '',
      payload_size: '',
      tcp_flags: ''
    },
    logAnalysis: {
      files: ['/var/log/syslog'],
      keywords: ['error', 'warning'],
      startTime: '',
      endTime: ''
    },
    // Add new section for log files
    logFiles: {
      path: '/'
    }
  });

  const handleInputChange = (section, field, value) => {
    setInputs(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const makeRequest = async (endpoint) => {
    setLoading(prev => ({ ...prev, [endpoint]: true }));
    try {
      let response;
      const baseUrl = 'http://localhost:8080';

      switch (endpoint) {
        case 'fileTree':
          response = await axios.get(`${baseUrl}/api/directory`);
          break;
        case 'logs':
          response = await axios.get(`${baseUrl}/api/logs`, {
            params: inputs.logs
          });
          break;
        case 'logFiles':
          response = await axios.get(`${baseUrl}/api/log/files`, {
            params: {
              path: inputs.logFiles.path
            }
          });
          break;
        case 'logAnalysis': {
          const requestData = {
            files: Array.isArray(inputs.logAnalysis.files) 
              ? inputs.logAnalysis.files 
              : [inputs.logAnalysis.files],
            keywords: Array.isArray(inputs.logAnalysis.keywords)
              ? inputs.logAnalysis.keywords
              : [inputs.logAnalysis.keywords]
          };
  
          if (inputs.logAnalysis.startTime) {
            requestData.start_time = inputs.logAnalysis.startTime;
          }
          if (inputs.logAnalysis.endTime) {
            requestData.end_time = inputs.logAnalysis.endTime;
          }
          
          response = await axios.post(
            `${baseUrl}/api/logs/search/stream`, 
            requestData,
            {
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );
          break;
        }
        case 'searchLogs':
          response = await axios.post(`${baseUrl}/api/logs/search`, inputs.searchLogs);
          break;
        case 'networkMetrics': {
          const params = Object.entries(inputs.networkMetrics)
            .reduce((acc, [key, value]) => {
              if (value !== '') {
                if (key === 'protocol') {
                  acc[key] = value.split(',').map(p => p.trim());
                } else {
                  acc[key] = value;
                }
              }
              return acc;
            }, {});

          response = await axios.get(`${baseUrl}/api/network/metrics`, { params });
          break;
        }
      }

      setResponses(prev => ({
        ...prev,
        [endpoint]: {
          data: response.data,
          status: response.status,
          headers: response.headers,
          timestamp: new Date().toISOString()
        }
      }));
      console.log('API Response:', response.data);
    } catch (error) {
      console.error('API Error:', error);
      setResponses(prev => ({
        ...prev,
        [endpoint]: {
          error: error.response?.data || error.message,
          status: error.response?.status,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [endpoint]: false }));
    }
  };

  const TabButton = ({ value, label }) => (
    <button
      className={`px-4 py-2 font-medium rounded-lg ${
        activeTab === value 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-100 hover:bg-gray-200'
      }`}
      onClick={() => setActiveTab(value)}
    >
      {label}
    </button>
  );

  const handleKeywordsChange = (value) => {
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    handleInputChange('logAnalysis', 'keywords', keywords);
  };

  const renderInput = (section, field, label, type = 'text', placeholder = '') => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={inputs[section][field]}
        onChange={(e) => handleInputChange(section, field, type === 'number' ? parseInt(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const renderResponse = (endpoint) => {
    const response = responses[endpoint];
    if (!response) return null;

    return (
      <div className="mt-4 border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className={`w-3 h-3 rounded-full ${
              response.status >= 200 && response.status < 300 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`} 
          />
          <span className="text-sm font-medium">
            Status: {response.status} • Time: {response.timestamp}
          </span>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(response.error || response.data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6">API Testing Playground</h2>
        
        <div className="flex gap-2 mb-6 flex-wrap">
          <TabButton value="fileTree" label="File Tree" />
          <TabButton value="logs" label="Logs" />
          <TabButton value="searchLogs" label="Search Logs" />
          <TabButton value="networkMetrics" label="Network Metrics" />
          <TabButton value="logAnalysis" label="Log Analysis" />
          <TabButton value="logFiles" label="Log Files" />
        </div>

        {/* Add new tab content for log files */}
        {activeTab === 'logFiles' && (
          <div>
            {renderInput('logFiles', 'path', 'Parent Path', 'text', '/')}
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
              onClick={() => makeRequest('logFiles')}
              disabled={loading.logFiles}
            >
              {loading.logFiles ? 'Loading...' : 'Send Request'}
            </button>
            {renderResponse('logFiles')}
          </div>
        )}

        {/* Existing tab contents... */}
        {/* ... (rest of the component remains the same) ... */}
      </div>
    </div>
  );
};

export default ApiPlayground;
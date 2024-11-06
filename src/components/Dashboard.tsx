import React from 'react';
import { FileText, Network, Files, Menu, X } from 'lucide-react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import FileExplorer from './FileExplorer';
import LogViewer from './LogViewer.jsx';
import NetworkMonitor from './NetworkMonitor.jsx';
import WebSocketTester from './WebSocketTester';
import ApiPlayground from './ApiPlayground.jsx';

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className={`
        fixed lg:relative
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        w-64 h-full bg-white border-r border-gray-200 
        transition-transform duration-200 ease-in-out
        z-30
      `}>
        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <h1 className="text-lg font-medium text-gray-800">Linux Diagnostic Agent</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigate('/files')}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Files size={20} />
            <span>File Explorer</span>
          </button>

          <button
            onClick={() => navigate('/logs')}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FileText size={20} />
            <span>Logs</span>
          </button>

          <button
            onClick={() => navigate('/network')}
            className="w-full flex items-center space-x-3 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Network size={20} />
            <span>Network</span>
          </button>
        </div>

        {/* API Playground */}
        <div className="p-4 border-t border-gray-200">
          <ApiPlayground />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-medium text-gray-800">Dashboard</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              {rightPanelOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Content Area with Right Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto p-4">
              <Routes>
                <Route path="/ws-test" element={<WebSocketTester />} />
                <Route path="/files" element={<FileExplorer />} />
                <Route path="/logs" element={<LogViewer />} />
                <Route path="/network" element={<NetworkMonitor />} />
                <Route path="/" element={<FileExplorer />} />
              </Routes>
            </div>
          </div>

          {/* Right Panel */}
          <div className={`
            fixed lg:relative right-0
            ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}
            lg:translate-x-0
            w-64 h-full bg-white border-l border-gray-200
            transition-transform duration-200 ease-in-out
            z-20
          `}>
            <div className="h-16 border-b border-gray-200 flex items-center px-4">
              <h3 className="text-lg font-medium text-gray-800">Details</h3>
            </div>
            <div className="p-4">
              {/* Right panel content */}
              <div className="text-sm text-gray-600">
                Additional information and details can go here
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
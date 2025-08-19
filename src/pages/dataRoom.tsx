import React, { useState, useEffect } from 'react';
import FilesView, { UploadedFile } from '../components/dataRoom/filesView';
import CategoriesView from '../components/dataRoom/categoriesView';
import { Database, FileText, BarChart3, RefreshCw } from 'lucide-react';

const EnhancedDataRoom: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'files' | 'categories' | 'analytics'>('files');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setUploadedFiles(newFiles);
  };

  const handleFileUpdate = (fileId: string, updates: Partial<UploadedFile>) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, ...updates } : file
      )
    );
  };

  const handleDatabaseStats = (stats: any) => {
    setDbStats(stats);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const AnalyticsView: React.FC = () => {
    if (!dbStats) {
      return (
        <div className="p-6 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">DataRoom Analytics</h2>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{dbStats.totalFiles}</div>
            <div className="text-gray-600">Total Files</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-green-600">{formatFileSize(dbStats.totalSize)}</div>
            <div className="text-gray-600">Total Storage</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(dbStats.categoryCounts).length}
            </div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {dbStats.oldestFile ? Math.ceil((new Date().getTime() - dbStats.oldestFile.getTime()) / (1000 * 60 * 60 * 24)) : 0}
            </div>
            <div className="text-gray-600">Days Active</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Files by Category</h3>
          <div className="space-y-3">
            {Object.entries(dbStats.categoryCounts).map(([category, count]) => {
              const percentage = (count as number / dbStats.totalFiles) * 100;
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{category}</span>
                    <span className="text-sm text-gray-500">({count} files)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Storage Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Storage Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Database Type:</span>
                <span className="font-medium">IndexedDB</span>
              </div>
              <div className="flex justify-between">
                <span>Total Size:</span>
                <span className="font-medium">{formatFileSize(dbStats.totalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Average File Size:</span>
                <span className="font-medium">
                  {dbStats.totalFiles > 0 ? formatFileSize(dbStats.totalSize / dbStats.totalFiles) : '0 Bytes'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Browser Storage:</span>
                <span className="font-medium">Local</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Timeline</h3>
            <div className="space-y-2">
              {dbStats.oldestFile && (
                <div className="flex justify-between">
                  <span>First Upload:</span>
                  <span className="font-medium">{dbStats.oldestFile.toLocaleDateString()}</span>
                </div>
              )}
              {dbStats.newestFile && (
                <div className="flex justify-between">
                  <span>Latest Upload:</span>
                  <span className="font-medium">{dbStats.newestFile.toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Data Persistence:</span>
                <span className="font-medium text-blue-600">Permanent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">IndexedDB Benefits</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Works offline</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Large storage capacity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Fast file access</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Persistent storage</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Structured queries</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Metadata indexing</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Enhanced DataRoom with IndexedDB</h1>
        <p className="text-gray-600 mt-1">
          Persistent file storage with offline capabilities
          {!isOnline && (
            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
              Offline Mode
            </span>
          )}
        </p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium flex items-center space-x-2 ${
            activeTab === 'files'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('files')}
        >
          <FileText className="w-4 h-4" />
          <span>Files ({uploadedFiles.length})</span>
        </button>
        <button
          className={`py-2 px-4 font-medium flex items-center space-x-2 ${
            activeTab === 'categories'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          <Database className="w-4 h-4" />
          <span>Categories</span>
        </button>
        <button
          className={`py-2 px-4 font-medium flex items-center space-x-2 ${
            activeTab === 'analytics'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'files' && (
          <FilesView 
            files={uploadedFiles}
            onFilesChange={handleFilesChange}
            onFileUpdate={handleFileUpdate}
            onDatabaseStats={handleDatabaseStats}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesView files={uploadedFiles} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}
      </div>
    </div>
  );
};

export default EnhancedDataRoom;
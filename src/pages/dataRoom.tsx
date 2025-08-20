import React, { useState, useEffect } from 'react';
import FilesView, { UploadedFile } from '../components/dataRoom/filesView';
import CategoriesView from '../components/dataRoom/categoriesView';
// import DocumentAwareChatBot from '../components/dataRoom';
import { dataRoomAPI } from '../service/api';
import { Database, FileText, MessageSquare, BarChart3, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import DocumentAwareChatBot from '@/components/documentResponse';

type ConnectionStatus = 'online' | 'offline' | 'local-only';

const EnhancedDataRoom: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'files' | 'categories' | 'chat' | 'analytics'>('files');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkConnectionStatus();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection check
    checkConnectionStatus();

    // Periodic connection checks
    const interval = setInterval(checkConnectionStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkConnectionStatus = async () => {
    if (!navigator.onLine) {
      setConnectionStatus('offline');
      return;
    }

    try {
      const isBackendHealthy = await dataRoomAPI.checkHealth();
      if (isBackendHealthy) {
        setConnectionStatus('online');
      } else {
        setConnectionStatus('local-only');
      }
    } catch {
      setConnectionStatus('local-only');
    }
  };

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

  // const getConnectionStatusDisplay = () => {
  //   switch (connectionStatus) {
  //     case 'online':
  //       return {
  //         icon: <Wifi className="w-4 h-4" />,
  //         color: 'text-green-600',
  //         bgColor: 'bg-green-50',
  //         borderColor: 'border-green-200',
  //         text: 'AI Backend Connected',
  //         description: 'Full functionality available including semantic search and document analysis'
  //       };
  //     case 'local-only':
  //       return {
  //         icon: <AlertTriangle className="w-4 h-4" />,
  //         color: 'text-yellow-600',
  //         bgColor: 'bg-yellow-50',
  //         borderColor: 'border-yellow-200',
  //         text: 'Local Storage Only',
  //         description: 'Backend unavailable. Files stored locally with basic search capabilities'
  //       };
  //     default:
  //       return {
  //         icon: <WifiOff className="w-4 h-4" />,
  //         color: 'text-red-600',
  //         bgColor: 'bg-red-50',
  //         borderColor: 'border-red-200',
  //         text: 'Offline Mode',
  //         description: 'No internet connection. Operating with local storage only'
  //       };
  //   }
  // };

  // const connectionDisplay = getConnectionStatusDisplay();
  const syncedCount = uploadedFiles.filter(f => f.isBackendSynced).length;
  const categorizedCount = uploadedFiles.filter(f => f.category && f.category !== 'general').length;

  // const AnalyticsView: React.FC = () => {
  //   if (!dbStats) {
  //     return (
  //       <div className="p-6 text-center">
  //         <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
  //         <p className="mt-2 text-gray-600">Loading analytics...</p>
  //       </div>
  //     );
  //   }

  //   return (
  //     <div className="p-6 space-y-6">
  //       <div>
  //         <h2 className="text-2xl font-bold text-gray-900 mb-6">DataRoom Analytics</h2>
  //       </div>

  //       {/* Connection Status Card */}
  //       {/* <div className={`p-4 rounded-lg border ${connectionDisplay.bgColor} ${connectionDisplay.borderColor}`}>
  //         <div className="flex items-center space-x-3">
  //           <span className={connectionDisplay.color}>{connectionDisplay.icon}</span>
  //           <div>
  //             <h3 className="font-semibold">{connectionDisplay.text}</h3>
  //             <p className="text-sm text-gray-600">{connectionDisplay.description}</p>
  //           </div>
  //         </div>
  //       </div> */}

  //       {/* Overview Stats */}
  //       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  //         <div className="bg-white p-4 rounded-lg border shadow-sm">
  //           <div className="text-2xl font-bold text-blue-600">{uploadedFiles.length}</div>
  //           <div className="text-gray-600">Total Files</div>
  //         </div>
  //         <div className="bg-white p-4 rounded-lg border shadow-sm">
  //           <div className="text-2xl font-bold text-green-600">{syncedCount}</div>
  //           <div className="text-gray-600">AI Processed</div>
  //         </div>
  //         <div className="bg-white p-4 rounded-lg border shadow-sm">
  //           <div className="text-2xl font-bold text-purple-600">{categorizedCount}</div>
  //           <div className="text-gray-600">Categorized</div>
  //         </div>
  //         <div className="bg-white p-4 rounded-lg border shadow-sm">
  //           <div className="text-2xl font-bold text-orange-600">
  //             {dbStats ? Object.keys(dbStats.categoryCounts || {}).length : 0}
  //           </div>
  //           <div className="text-gray-600">Categories</div>
  //         </div>
  //       </div>

  //       {/* File Status Breakdown */}
  //       <div className="bg-white p-6 rounded-lg border shadow-sm">
  //         <h3 className="text-lg font-semibold mb-4">File Processing Status</h3>
  //         <div className="space-y-3">
  //           <div className="flex items-center justify-between">
  //             <div className="flex items-center space-x-2">
  //               <div className="w-3 h-3 bg-green-500 rounded-full"></div>
  //               <span className="font-medium">AI Processed</span>
  //               <span className="text-sm text-gray-500">({syncedCount} files)</span>
  //             </div>
  //             <div className="flex items-center space-x-2">
  //               <div className="w-32 bg-gray-200 rounded-full h-2">
  //                 <div 
  //                   className="bg-green-500 h-2 rounded-full transition-all duration-300"
  //                   style={{ width: `${uploadedFiles.length > 0 ? (syncedCount / uploadedFiles.length) * 100 : 0}%` }}
  //                 ></div>
  //               </div>
  //               <span className="text-sm font-medium w-12 text-right">
  //                 {uploadedFiles.length > 0 ? ((syncedCount / uploadedFiles.length) * 100).toFixed(1) : 0}%
  //               </span>
  //             </div>
  //           </div>
            
  //           <div className="flex items-center justify-between">
  //             <div className="flex items-center space-x-2">
  //               <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
  //               <span className="font-medium">Local Only</span>
  //               <span className="text-sm text-gray-500">({uploadedFiles.length - syncedCount} files)</span>
  //             </div>
  //             <div className="flex items-center space-x-2">
  //               <div className="w-32 bg-gray-200 rounded-full h-2">
  //                 <div 
  //                   className="bg-orange-500 h-2 rounded-full transition-all duration-300"
  //                   style={{ width: `${uploadedFiles.length > 0 ? ((uploadedFiles.length - syncedCount) / uploadedFiles.length) * 100 : 0}%` }}
  //                 ></div>
  //               </div>
  //               <span className="text-sm font-medium w-12 text-right">
  //                 {uploadedFiles.length > 0 ? (((uploadedFiles.length - syncedCount) / uploadedFiles.length) * 100).toFixed(1) : 0}%
  //               </span>
  //             </div>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Category Breakdown */}
  //       {dbStats && dbStats.categoryCounts && (
  //         <div className="bg-white p-6 rounded-lg border shadow-sm">
  //           <h3 className="text-lg font-semibold mb-4">Files by Category</h3>
  //           <div className="space-y-3">
  //             {Object.entries(dbStats.categoryCounts).map(([category, count]) => {
  //               const percentage = (count as number / dbStats.totalFiles) * 100;
  //               return (
  //                 <div key={category} className="flex items-center justify-between">
  //                   <div className="flex items-center space-x-2">
  //                     <span className="font-medium capitalize">{category}</span>
  //                     <span className="text-sm text-gray-500">({String(count)} files)</span>
  //                   </div>
  //                   <div className="flex items-center space-x-2">
  //                     <div className="w-32 bg-gray-200 rounded-full h-2">
  //                       <div 
  //                         className="bg-blue-600 h-2 rounded-full transition-all duration-300"
  //                         style={{ width: `${percentage}%` }}
  //                       ></div>
  //                     </div>
  //                     <span className="text-sm font-medium w-12 text-right">
  //                       {percentage.toFixed(1)}%
  //                     </span>
  //                   </div>
  //                 </div>
  //               );
  //             })}
  //           </div>
  //         </div>
  //       )}

  //       {/* Storage Information */}
  //       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //         <div className="bg-white p-6 rounded-lg border shadow-sm">
  //           <h3 className="text-lg font-semibold mb-4">Storage Details</h3>
  //           <div className="space-y-2">
  //             <div className="flex justify-between">
  //               <span>Local Storage:</span>
  //               <span className="font-medium">IndexedDB</span>
  //             </div>
  //             <div className="flex justify-between">
  //               <span>Backend Storage:</span>
  //               <span className="font-medium">
  //                 {connectionStatus === 'online' ? 'Qdrant Vector DB' : 'Unavailable'}
  //               </span>
  //             </div>
  //             <div className="flex justify-between">
  //               <span>Total Size:</span>
  //               <span className="font-medium">
  //                 {dbStats ? formatFileSize(dbStats.totalSize) : '0 Bytes'}
  //               </span>
  //             </div>
  //             <div className="flex justify-between">
  //               <span>Sync Status:</span>
  //               <span className={`font-medium ${
  //                 connectionStatus === 'online' ? 'text-green-600' : 'text-orange-600'
  //               }`}>
  //                 {connectionStatus === 'online' ? 'Connected' : 'Offline'}
  //               </span>
  //             </div>
  //           </div>
  //         </div>

  //         <div className="bg-white p-6 rounded-lg border shadow-sm">
  //           <h3 className="text-lg font-semibold mb-4">Capabilities</h3>
  //           <div className="space-y-2">
  //             <div className="flex items-center space-x-2">
  //               <div className={`w-2 h-2 rounded-full ${
  //                 connectionStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'
  //               }`}></div>
  //               <span className={connectionStatus === 'online' ? '' : 'text-gray-500'}>
  //                 Semantic Search
  //               </span>
  //             </div>
  //             <div className="flex items-center space-x-2">
  //               <div className={`w-2 h-2 rounded-full ${
  //                 connectionStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'
  //               }`}></div>
  //               <span className={connectionStatus === 'online' ? '' : 'text-gray-500'}>
  //                 AI Document Analysis
  //               </span>
  //             </div>
  //             <div className="flex items-center space-x-2">
  //               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  //               <span>Local File Storage</span>
  //             </div>
  //             <div className="flex items-center space-x-2">
  //               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  //               <span>Offline Access</span>
  //             </div>
  //             <div className="flex items-center space-x-2">
  //               <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  //               <span>Category Organization</span>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">DataRoom</h1>
            <p className="text-gray-600 mt-1">
              Intelligent document management with AI capabilities
            </p>
          </div>
          {/* <div className="flex items-center space-x-2">
            <span className={connectionDisplay.color}>{connectionDisplay.icon}</span>
            <span className="text-sm font-medium">{connectionDisplay.text}</span>
            <button
              onClick={checkConnectionStatus}
              className="p-1 hover:bg-gray-100 rounded"
              title="Check connection"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div> */}
        </div>
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
            activeTab === 'chat'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI Chat</span>
          {connectionStatus === 'online' && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">AI</span>
          )}
        </button>
        {/* <button
          className={`py-2 px-4 font-medium flex items-center space-x-2 ${
            activeTab === 'analytics'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button> */}
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
        {activeTab === 'chat' && (
          <DocumentAwareChatBot />
        )}
      
        {/* {activeTab === 'analytics' && (
          <AnalyticsView />
        )} */}
      </div>
    </div>
  );
};

export default EnhancedDataRoom;
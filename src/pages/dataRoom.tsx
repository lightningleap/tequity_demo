import React, { useState, useEffect } from 'react';
import FilesView, { UploadedFile } from '../components/dataRoom/filesView';
import CategoriesView from '../components/dataRoom/categoriesView'; // Import the component
import { dataRoomAPI } from '../service/api';
import { FileText, MessageSquare, Database, RefreshCw } from 'lucide-react';
import DocumentChatBot from '@/components/documentResponse';

const DataRoom: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'files' | 'categories' | 'chat'>('files');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

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

  const aiProcessedCount = uploadedFiles.filter(f => f.aiProcessed).length;
  const categorizedCount = uploadedFiles.filter(f => f.category && f.category !== 'general').length;

  return (
    <div className="container mx-auto p-2 mt-16 ">
      {/* Tab Navigation */}
      <div className="sticky top-16 bg-white z-40 -mx-2  ">
        <div className="flex flex-wrap items-center border-b border-gray-200 mb-6 ">
          <div className="flex items-center space-x-4 mb-2 sm:mb-0">
            <h1 className="text-2xl font-bold"> DataRoom</h1>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-0">
            <button
              className={`py-2 px-3 sm:px-4 font-medium flex items-center space-x-2 ${
                activeTab === 'files'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('files')}
            >
              <FileText className="w-4 h-4" />
              <span className="whitespace-nowrap">Files ({uploadedFiles.length})</span>
            </button>
            <button
              className={`py-2 px-3 sm:px-4 font-medium flex items-center space-x-2 ${
                activeTab === 'categories'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('categories')}
            >
              <Database className="w-4 h-4" />
              <span className="whitespace-nowrap">Categories</span>
            </button>
            <button
              className={`py-2 px-3 sm:px-4 font-medium flex items-center space-x-2 ${
                activeTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="whitespace-nowrap">AI Chat</span>
              <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow min-h-96">
        {activeTab === 'files' && (
          <FilesView 
            files={uploadedFiles}
            onFilesChange={handleFilesChange}
            onFileUpdate={handleFileUpdate}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesView files={uploadedFiles} />
        )}
        {activeTab === 'chat' && (
          <DocumentChatBot />
        )}
      </div>
    </div>
  );
};

export default DataRoom;
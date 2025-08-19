import React, { useState } from 'react';
import FilesView, { UploadedFile } from '../components/dataRoom/filesView';
import CategoriesView from '../components/dataRoom/categoriesView';

const DataRoom: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'files' | 'categories'>('files');
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Data Room</h1>
      
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'files'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('files')}
        >
          Files ({uploadedFiles.length})
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'categories'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {activeTab === 'files' ? (
          <FilesView 
            files={uploadedFiles}
            onFilesChange={handleFilesChange}
            onFileUpdate={handleFileUpdate}
          />
        ) : (
          <CategoriesView files={uploadedFiles} />
        )}
      </div>
    </div>
  );
};

export default DataRoom;
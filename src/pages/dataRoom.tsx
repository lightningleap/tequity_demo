import React, { useState } from 'react';
import FilesView from '../components/dataRoom/filesView';
import CategoriesView from '../components/dataRoom/categoriesView';

function DataRoom() {
  const [activeTab, setActiveTab] = useState<'files' | 'categories'>('files');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Data Room</h1>
      
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'files'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'categories'
              ? 'text-pink-600 border-b-2 border-pink-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        {activeTab === 'files' ? <FilesView /> : <CategoriesView />}
      </div>
    </div>
  );
}

export default DataRoom;
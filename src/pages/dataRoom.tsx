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

  // const ChatView: React.FC = () => {
  //   const [question, setQuestion] = useState('');
  //   const [isAsking, setIsAsking] = useState(false);
  //   const [chatHistory, setChatHistory] = useState<Array<{
  //     question: string;
  //     answer: string;
  //     timestamp: Date;
  //     sources?: Array<{
  //       file_id: string;
  //       file_name: string;
  //       category: string;
  //     }>;
  //   }>>([]);

  //   const handleAskQuestion = async () => {
  //     if (!question.trim()) return;

  //     setIsAsking(true);
  //     try {
  //       const response = await dataRoomAPI.askQuestion(question);
        
  //       setChatHistory(prev => [...prev, {
  //         question,
  //         answer: response.answer,
  //         timestamp: new Date(),
  //         sources: response.sources
  //       }]);
        
  //       setQuestion('');
  //     } catch (error) {
  //       console.error('Failed to ask question:', error);
  //       setChatHistory(prev => [...prev, {
  //         question,
  //         answer: 'Sorry, I encountered an error while processing your question. Please try again.',
  //         timestamp: new Date()
  //       }]);
  //     } finally {
  //       setIsAsking(false);
  //     }
  //   };

  //   return (
  //     <div className="p-6 h-full flex flex-col">
  //       <div className="mb-6">
  //         <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Document Chat</h2>
  //         <p className="text-gray-600">
  //           Ask questions about your uploaded documents. The AI will search through your files to provide answers.
  //         </p>
  //       </div>

  //       {uploadedFiles.length === 0 && (
  //         <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  //           <div className="flex items-center space-x-2">
  //             <MessageSquare className="w-5 h-5 text-blue-600" />
  //             <span className="text-blue-800 font-medium">No Documents Available</span>
  //           </div>
  //           <p className="text-blue-700 text-sm mt-1">
  //             Upload some documents first to start asking questions about them.
  //           </p>
  //         </div>
  //       )}

  //       {/* Chat History */}
  //       <div className="flex-1 overflow-y-auto mb-4 space-y-4">
  //         {chatHistory.length === 0 ? (
  //           <div className="text-center py-8">
  //             <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
  //             <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
  //             <p className="text-gray-500">Ask questions about your uploaded documents</p>
  //           </div>
  //         ) : (
  //           chatHistory.map((chat, index) => (
  //             <div key={index} className="space-y-3">
  //               {/* User Question */}
  //               <div className="flex justify-end">
  //                 <div className="bg-blue-600 text-white p-3 rounded-lg max-w-2xl">
  //                   <p>{chat.question}</p>
  //                   <p className="text-xs text-blue-100 mt-1">
  //                     {chat.timestamp.toLocaleTimeString()}
  //                   </p>
  //                 </div>
  //               </div>
                
  //               {/* AI Answer */}
  //               <div className="flex justify-start">
  //                 <div className="bg-gray-100 p-3 rounded-lg max-w-2xl">
  //                   <p className="whitespace-pre-wrap">{chat.answer}</p>
  //                   {chat.sources && chat.sources.length > 0 && (
  //                     <div className="mt-3 pt-3 border-t border-gray-200">
  //                       <p className="text-xs text-gray-600 mb-2">Sources:</p>
  //                       <div className="space-y-1">
  //                         {chat.sources.map((source, sourceIndex) => (
  //                           <div key={sourceIndex} className="text-xs text-blue-600">
  //                             {source.file_name} ({source.category})
  //                           </div>
  //                         ))}
  //                       </div>
  //                     </div>
  //                   )}
  //                   <p className="text-xs text-gray-500 mt-2">
  //                     {chat.timestamp.toLocaleTimeString()}
  //                   </p>
  //                 </div>
  //               </div>
  //             </div>
  //           ))
  //         )}
  //       </div>

  //       {/* Question Input */}
  //       <div className="border-t pt-4">
  //         <div className="flex space-x-2">
  //           <input
  //             type="text"
  //             value={question}
  //             onChange={(e) => setQuestion(e.target.value)}
  //             onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
  //             placeholder="Ask a question about your documents..."
  //             disabled={isAsking}
  //             className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
  //           />
  //           <button
  //             onClick={handleAskQuestion}
  //             disabled={!question.trim() || isAsking}
  //             className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
  //           >
  //             {isAsking ? (
  //               <>
  //                 <RefreshCw className="w-4 h-4 animate-spin" />
  //                 <span>Asking...</span>
  //               </>
  //             ) : (
  //               <span>Ask</span>
  //             )}
  //           </button>
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
          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">AI</span>
        </button>
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
          // <ChatView />
          <DocumentChatBot />
        )}
      </div>
    </div>
  );
};

export default DataRoom;
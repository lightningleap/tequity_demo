import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataRoomAPI, APIFileResponse } from '../../service/api';
import { Upload, File, Download, AlertCircle, Cloud, Trash2, Tag, Eye, RefreshCw } from 'lucide-react';

import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  category?: string;
  subcategory?: string;
  metadata?: Record<string, any>;
  fileId: string;
  aiProcessed: boolean;
}

interface FilesViewProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onFileUpdate: (fileId: string, updates: Partial<UploadedFile>) => void;
}

const FilesView: React.FC<FilesViewProps> = ({ 
  files, 
  onFilesChange, 
  onFileUpdate
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [expandedMetadata, setExpandedMetadata] = useState<Record<string, boolean>>({});
  const [refreshingFiles, setRefreshingFiles] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{id: string, name: string} | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const loaderMessages = [
    {
      title: "File Drop, Auto-Organized",
      description: "Just drag and drop – AI handles the structure.",
    },
    {
      title: "Activity Tracking",
      description: "Know who's looking, when, and at what.",
    },
    {
      title: "AI-Powered Search and Retrieval",
      description: "Investors ask. Tequity finds it instantly.",
    },
    {
      title: "Secure & Always Deal-Ready",
      description: "Your data room stays clean, current, and locked down.",
    },
  ];

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % loaderMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading, loaderMessages.length]);

  useEffect(() => {
    console.log('FilesView: Component mounted, loading initial data...');
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadFilesFromBackend(),
      loadAvailableCategories()
    ]);
  };

  const loadAvailableCategories = async () => {
    try {
      const categories = await dataRoomAPI.getCategories();
      setAvailableCategories(categories);
      console.log('FilesView: Loaded categories:', categories);
    } catch (error) {
      console.error('FilesView: Failed to load categories:', error);
      // Fallback categories
      setAvailableCategories(['financial', 'sales', 'inventory', 'hr', 'marketing', 'legal', 'operations', 'general']);
    }
  };

  const loadFilesFromBackend = async () => {
    try {
      console.log('FilesView: Loading files from backend...');
      setIsLoading(true);
      
      const backendFiles = await dataRoomAPI.getFiles();
      console.log(`FilesView: Loaded ${backendFiles.length} files from backend`);
      
      const uploadedFiles = backendFiles.map((apiFile: APIFileResponse) => {
        const uploadedFile: UploadedFile = {
          id: apiFile.file_id,
          name: apiFile.file_name,
          size: apiFile.file_size_bytes,
          type: 'application/octet-stream',
          uploadDate: new Date(apiFile.ingestion_timestamp),
          category: apiFile.category,
          metadata: {
            file_id: apiFile.file_id,
            original_name: apiFile.original_name,
            safe_name: apiFile.safe_name,
            num_records: apiFile.num_records,
            num_sheets: apiFile.num_sheets,
            point_ids: apiFile.point_ids,
            category: apiFile.category,
            processed_by_ai: true,
            semantic_search_enabled: true,
            ingestion_timestamp: apiFile.ingestion_timestamp,
            download_url: apiFile.download_url,
            last_accessed: apiFile.last_accessed,
            status: apiFile.status,
            file_size_bytes: apiFile.file_size_bytes,
            points_count: apiFile.point_ids ? apiFile.point_ids.length : 0
          },
          fileId: apiFile.file_id,
          aiProcessed: true
        };

        return uploadedFile;
      });
      
      onFilesChange(uploadedFiles);
    } catch (error) {
      console.error('FilesView: Failed to load files from backend:', error);
      toast.error('Failed to load files. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFiles = async () => {
    setRefreshingFiles(true);
    await loadFilesFromBackend();
    setRefreshingFiles(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (fileList: FileList | null) => {
    if (!fileList) {
      console.log('FilesView: No files provided');
      return;
    }

    console.log(`FilesView: Starting upload of ${fileList.length} files...`);
    setIsLoading(true);
    
    try {
      const newUploadedFiles: UploadedFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setCurrentProcessingFile(file.name);
        
        try {
          console.log(`FilesView: Uploading ${file.name} to backend...`);
          const apiResponse = await dataRoomAPI.uploadFile(file);
          
          const uploadedFile: UploadedFile = {
            id: apiResponse.file_id,
            name: apiResponse.file_name,
            size: apiResponse.file_size_bytes,
            type: file.type,
            uploadDate: new Date(apiResponse.ingestion_timestamp),
            category: apiResponse.category,
            metadata: {
              file_id: apiResponse.file_id,
              original_name: apiResponse.original_name,
              safe_name: apiResponse.safe_name,
              num_records: apiResponse.num_records,
              num_sheets: apiResponse.num_sheets,
              point_ids: apiResponse.point_ids,
              download_url: apiResponse.download_url,
              ingestion_timestamp: apiResponse.ingestion_timestamp,
              status: apiResponse.status,
              file_size_bytes: apiResponse.file_size_bytes
            },
            fileId: apiResponse.file_id,
            aiProcessed: apiResponse.status === 'active'
          };
          
          newUploadedFiles.push(uploadedFile);
          toast.success(`Successfully uploaded ${file.name}`);

        } catch (uploadError: any) {
          console.error(`FilesView: Upload failed for ${file.name}:`, uploadError);
          toast.error(`Upload failed: ${uploadError.message}`, {
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }

        setCurrentProcessingFile(null);
      }

      if (newUploadedFiles.length > 0) {
        onFilesChange([...newUploadedFiles, ...files]);
        console.log(`FilesView: Successfully uploaded ${newUploadedFiles.length} files`);
      }
    } catch (error) {
      console.error('FilesView: File upload failed:', error);
      toast.error('An unexpected error occurred during file upload');
    } finally {
      setIsLoading(false);
      setCurrentProcessingFile(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const downloadFile = async (uploadedFile: UploadedFile) => {
    try {
      console.log(`FilesView: Downloading file: ${uploadedFile.name}`);
      
      const blob = await dataRoomAPI.downloadFile(uploadedFile.fileId);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = uploadedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`FilesView: Successfully downloaded ${uploadedFile.name}`);
    } catch (error) {
      console.error('FilesView: Failed to download file:', error);
      toast.error('Failed to download file. Please try again.');
    }
  };

  const deleteFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    setFileToDelete({ id: fileId, name: file.name });
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      await dataRoomAPI.deleteFile(fileToDelete.id);
      onFilesChange(files.filter(file => file.id !== fileToDelete.id));
      console.log(`FilesView: File ${fileToDelete.id} deleted successfully`);
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('FilesView: Failed to delete file:', error);
      toast.error('Failed to delete file. Please try again.');
      
    } finally {
      setFileToDelete(null);
    }
  };

  const assignCategory = (fileId: string, category: string) => {
    onFileUpdate(fileId, { category });
    console.log(`FilesView: Updated file ${fileId} category to ${category}`);
  };

  const toggleMetadata = (fileId: string) => {
    setExpandedMetadata(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  const renderMetadataValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className={value ? 'text-green-600' : 'text-red-600'}>{value.toString()}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-blue-600">{value.toLocaleString()}</span>;
    }
    
    if (typeof value === 'string') {
      if (value.length > 50) {
        return <span className="text-gray-700">{value.substring(0, 50)}...</span>;
      }
      return <span className="text-gray-700">{value}</span>;
    }
    
    if (Array.isArray(value)) {
      return <span className="text-purple-600">Array ({value.length} items)</span>;
    }
    
    if (typeof value === 'object') {
      return <span className="text-indigo-600">Object ({Object.keys(value).length} properties)</span>;
    }
    
    return <span className="text-gray-500">{String(value)}</span>;
  };

  const getStatusIcon = (file: UploadedFile) => {
    return <Cloud className="h-3 w-3 text-green-500" />;
  };

  const categorizedCount = files.filter(f => f.category && f.category !== 'general').length;
  const uncategorizedCount = files.length - categorizedCount;

  return (
    <div className="flex flex-col h-full p-4">
    
      {/* Header with Refresh */}
      <div className="flex justify-between items-center ">
        <div>
          <h2 className="text-xl font-semibold">Upload Files</h2>
          <p className="text-gray-600 text-sm mt-1">
            Upload and manage your documents for AI processing
          </p>
        </div>
        <button
          onClick={refreshFiles}
          disabled={refreshingFiles || isLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${refreshingFiles ? 'animate-spin' : ''}`} />
          <span>{refreshingFiles ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
            : 'border-gray-300 hover:border-blue-400 hover:shadow-sm'
        } ${isLoading ? 'pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className="w-10 h-10 text-blue-500" />
            <div className="text-base text-gray-700 font-medium">
              Drag & Drop your files here
            </div>
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow transition"
            >
              Browse Files
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                multiple
                disabled={isLoading}
                onChange={(e) => handleFileChange(e.target.files)}
              />
            </label>
            <p className="text-xs text-gray-500">
              Supported formats: Excel, CSV, PDF, Word documents
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-6 py-6 bg-white rounded-xl p-6 shadow-sm">
            {/* Carousel Highlights */}
            <div className="relative h-20 w-full max-w-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={carouselIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute w-full text-center"
                >
                  <h3 className="text-lg font-semibold text-gray-800">
                    {loaderMessages[carouselIndex].title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {loaderMessages[carouselIndex].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Animated Progress Bar */}
            <div className="w-full max-w-md">
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-blue-500 animate-pulse rounded-full"></div>
              </div>
            </div>

            {/* Current File Name */}
            {currentProcessingFile && (
              <p className="text-sm text-gray-600">
                Processing: <span className="font-semibold">{currentProcessingFile}</span>
              </p>
            )}
            <p className="text-sm text-gray-500">
              {currentProcessingFile
                ? 'Uploading and processing with AI...'
                : 'Loading your files...'}
            </p>

          </div>
        )}
      </div>

      {/* Stats */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{files.length}</div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-green-600">{files.filter(f => f.aiProcessed).length}</div>
            <div className="text-sm text-gray-600">AI Processed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{categorizedCount}</div>
            <div className="text-sm text-gray-600">Categorized</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{uncategorizedCount}</div>
            <div className="text-sm text-gray-600">Uncategorized</div>
          </div>
        </div>
      )}

         {/* Loading State */}
         {/* {isLoading && (
        <div className="text-center py-8">
          <div className="max-w-md mx-auto w-full">
            <div className="animate-pulse">
              <div className="h-2 bg-blue-200 rounded-full"></div>
            </div>
          </div>
          {currentProcessingFile && (
            <p className="text-sm text-gray-600 mt-2">Processing: {currentProcessingFile}</p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            {currentProcessingFile ? 'Uploading and processing with AI...' : 'Loading files...'}
          </p>
        </div>
      )} */}


      {/* Files List */}
      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Uploaded Files ({files.length})</h3>
            {uncategorizedCount > 0 && (
              <div className="flex items-center text-orange-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {uncategorizedCount} files need categorization
              </div>
            )}
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {files.map((file) => (
                <li key={file.id} className="px-6 py-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <File className="flex-shrink-0 h-8 w-8 text-gray-400" />
                          <div className="absolute -bottom-1 -right-1">
                            {getStatusIcon(file)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • {file.type}
                          </p>
                          {file.category && (
                            <p className="text-xs text-blue-600 mt-1">
                              {file.category}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                            <span>Uploaded: {file.uploadDate.toLocaleDateString()}</span>
                            {file.aiProcessed && (
                              <span className="text-green-600">• AI Processed</span>
                            )}
                            {file.metadata?.num_records && (
                              <span>• {file.metadata.num_records} records</span>
                            )}
                            {file.metadata?.num_sheets && (
                              <span>• {file.metadata.num_sheets} sheets</span>
                            )}
                            {file.metadata?.point_ids && (
                              <span>• {file.metadata.point_ids.length} search points</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleMetadata(file.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View metadata"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Download file"
                          disabled={isLoading}
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete file"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Category Assignment */}
                    <div className="flex items-center space-x-2 text-sm">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Category:</span>
                      <select
                        value={file.category || ''}
                        onChange={(e) => assignCategory(file.id, e.target.value)}
                        disabled={isLoading}
                        className={`text-xs border rounded px-2 py-1 ${
                          !file.category || file.category === 'general' 
                            ? 'border-orange-300 bg-orange-50 text-orange-800' 
                            : 'border-green-300 bg-green-50 text-green-800'
                        }`}
                      >
                        <option value="">Select Category</option>
                        {availableCategories.map(category => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                      
                      {(!file.category || file.category === 'general') && (
                        <span className="text-xs text-orange-600">
                          Assign a category to improve organization
                        </span>
                      )}
                    </div>

                    {/* Metadata Display */}
                    {expandedMetadata[file.id] && file.metadata && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">File Metadata</h4>
                        <div className="space-y-1">
                          {Object.entries(file.metadata)
                            .filter(([key]) => ![
                              'file_id',
                              'safe_name',
                              'processed_by_ai',
                              'semantic_search_enabled',
                              'ingestion_timestamp',
                              'download_url',
                              'file_size_bytes',
                              'points_count',
                              'point_ids',
                              'last_accessed'
                            ].includes(key))
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between items-start text-xs">
                                <span className="font-medium text-gray-600 mr-2">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                </span>
                                <span className="text-right flex-1 min-w-0">
                                  {renderMetadataValue(key, value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

   
      {/* Empty State */}
      {files.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded</h3>
          <p className="text-gray-500 mb-4">
            Upload your first file to get started with AI document processing
          </p>
          <button
            onClick={() => document.getElementById('file-upload')?.click()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </button>
        </div>
      )}

      {fileToDelete && (
       <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold">Delete File</h3>
            </div>
            <p className="mb-6">
              Are you sure you want to delete <span className="font-medium">{fileToDelete.name}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesView;
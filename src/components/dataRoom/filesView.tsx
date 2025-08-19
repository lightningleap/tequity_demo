import React, { useState, useCallback } from 'react';
import { Upload, File, X, Download, Trash2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
}

const FilesView: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type || file.name.split('.').pop()?.toUpperCase() || 'File',
      uploadDate: new Date(),
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
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

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const downloadFile = (file: UploadedFile) => {
    const url = URL.createObjectURL(file.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 hover:border-pink-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer text-pink-600 hover:text-pink-500"
              >
                <span>Drag and drop files here or click to browse</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">Supports all file types</p>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Uploaded Files</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {uploadedFiles.map((file) => (
                <li key={file.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <File className="flex-shrink-0 h-8 w-8 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => downloadFile(file)}
                        className="p-2 text-gray-400 hover:text-pink-600"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesView;
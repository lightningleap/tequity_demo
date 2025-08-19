import React, { useState, useEffect } from 'react';
import { dataRoomDB, StoredFile } from '../../services/indexedDb';
import { Upload, File, Download, Trash2, Edit3, Tag, AlertCircle, Database, RefreshCw, HardDrive } from 'lucide-react';

// Convert StoredFile to UploadedFile format for compatibility
export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  category?: string;
  subcategory?: string;
  metadata?: Record<string, any>;
}

interface FilesViewProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onFileUpdate: (fileId: string, updates: Partial<UploadedFile>) => void;
  onDatabaseStats: (stats: any) => void;
}

const FilesView: React.FC<FilesViewProps> = ({ 
  files, 
  onFilesChange, 
  onFileUpdate,
  onDatabaseStats 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState<string | null>(null);
  const [metadataInput, setMetadataInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);

  // Load files from IndexedDB on component mount
  useEffect(() => {
    loadFilesFromDB();
    loadDatabaseStats();
  }, []);

  const loadFilesFromDB = async () => {
    try {
      setIsLoading(true);
      const storedFiles = await dataRoomDB.getAllFiles();
      const uploadedFiles = await Promise.all(
        storedFiles.map(async (storedFile) => ({
          id: storedFile.id,
          file: dataRoomDB.createFileFromStored(storedFile),
          name: storedFile.name,
          size: storedFile.size,
          type: storedFile.type,
          uploadDate: storedFile.uploadDate,
          category: storedFile.category,
          subcategory: storedFile.subcategory,
          metadata: storedFile.metadata
        }))
      );
      onFilesChange(uploadedFiles);
    } catch (error) {
      console.error('Failed to load files from database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const stats = await dataRoomDB.getStats();
      setDbStats(stats);
      onDatabaseStats(stats);
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (fileList: FileList | null) => {
    console.log('handleFileChange triggered', { fileListLength: fileList?.length || 0 });
    if (!fileList) {
      console.log('No files selected');
      return;
    }
  
    setIsLoading(true);
    console.log('Starting file upload process...');
    
    try {
      const newUploadedFiles: UploadedFile[] = [];
      console.log(`Processing ${fileList.length} file(s)`);
  
      for (const [index, file] of Array.from(fileList).entries()) {
        console.log(`Processing file ${index + 1}/${fileList.length}:`, {
          name: file.name,
          size: file.size,
          type: file.type
        });
  
        const generatedMetadata = generateSampleMetadata(file);
        console.log('Generated metadata:', JSON.stringify(generatedMetadata, null, 2));
  
        const autoCategory = getAutoCategoryFromFilename(file.name);
        console.log('Auto-categorized as:', autoCategory);
        
        const uploadedFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          type: file.type || file.name.split('.').pop()?.toUpperCase() || 'File',
          uploadDate: new Date(),
          metadata: generatedMetadata,
          category: autoCategory.category,
          subcategory: autoCategory.subcategory
        };
  
        console.log('Created uploadedFile object:', {
          id: uploadedFile.id,
          name: uploadedFile.name,
          type: uploadedFile.type,
          category: uploadedFile.category,
          subcategory: uploadedFile.subcategory
        });
  
        try {
          // Save to IndexedDB
          console.log('Converting file to ArrayBuffer...');
          const fileData = await file.arrayBuffer();
          console.log('File converted to ArrayBuffer, size:', fileData.byteLength, 'bytes');
  
          const storedFile: StoredFile = {
            id: uploadedFile.id,
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type,
            uploadDate: uploadedFile.uploadDate,
            category: uploadedFile.category,
            subcategory: uploadedFile.subcategory,
            metadata: uploadedFile.metadata,
            fileData: fileData
          };
  
          console.log('Saving to IndexedDB...', {
            id: storedFile.id,
            name: storedFile.name,
            size: storedFile.size,
            type: storedFile.type
          });
  
          await dataRoomDB.saveFile(file, storedFile);
          console.log('Successfully saved to IndexedDB');
          
          newUploadedFiles.push(uploadedFile);
          console.log('Added to newUploadedFiles array');
        } catch (saveError) {
          console.error('Error saving file to IndexedDB:', {
            fileName: file.name,
            error: saveError
          });
          throw saveError; // Re-throw to be caught by the outer catch
        }
      }
  
      console.log('All files processed. Updating parent component...');
      onFilesChange([...files, ...newUploadedFiles]);
      console.log('Parent component updated. Loading database stats...');
      
      await loadDatabaseStats();
      console.log('Database stats loaded successfully');
    } catch (error) {
      console.error('Failed to save files:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      alert('Failed to save files to database. Check console for details.');
    } finally {
      console.log('File upload process completed');
      setIsLoading(false);
    }
  };

  const getAutoCategoryFromFilename = (filename: string): { category: string; subcategory: string } => {
    const name = filename.toLowerCase();
    
    if (name.includes('financial') || name.includes('revenue') || name.includes('income') || name.includes('budget')) {
      return { category: 'Financial', subcategory: 'Financial Statements' };
    }
    if (name.includes('customer') || name.includes('client') || name.includes('sales')) {
      return { category: 'Customers', subcategory: 'Customer Data' };
    }
    if (name.includes('contract') || name.includes('agreement') || name.includes('legal')) {
      return { category: 'Legal', subcategory: 'Contracts' };
    }
    if (name.includes('employee') || name.includes('hr') || name.includes('payroll')) {
      return { category: 'Corporate', subcategory: 'HR Documents' };
    }
    if (name.includes('vendor') || name.includes('supplier') || name.includes('procurement')) {
      return { category: 'Operations', subcategory: 'Vendor Management' };
    }
    if (name.includes('cap') && name.includes('table') || name.includes('equity') || name.includes('shares')) {
      return { category: 'Corporate', subcategory: 'Cap Table' };
    }
    
    return { category: 'General', subcategory: 'Miscellaneous' };
  };

  const generateSampleMetadata = (file: File): Record<string, any> => {
    const baseMetadata = {
      file_size: file.size,
      upload_date: new Date().toISOString().split('T')[0],
      file_type: file.type || 'unknown',
      last_modified: file.lastModified ? new Date(file.lastModified).toISOString().split('T')[0] : null,
      stored_in_indexeddb: true
    };

    const name = file.name.toLowerCase();

    if (name.includes('financial') || name.includes('revenue')) {
      return {
        ...baseMetadata,
        period: "2024-Q4",
        total_revenue: Math.floor(Math.random() * 10000000) + 1000000,
        net_income: Math.floor(Math.random() * 2000000) + 500000,
        gross_margin: Math.random() * 0.3 + 0.6,
        regions: ["North America", "Europe", "Asia"],
        currency: "USD",
        year_over_year_growth: Math.random() * 0.5 + 0.1
      };
    }

    if (name.includes('customer') || name.includes('client')) {
      return {
        ...baseMetadata,
        total_customers: Math.floor(Math.random() * 500) + 50,
        active_customers: Math.floor(Math.random() * 400) + 40,
        churn_rate: Math.random() * 0.1 + 0.05,
        avg_contract_value: Math.floor(Math.random() * 100000) + 10000,
        top_industries: ["Technology", "Healthcare", "Finance", "Retail"],
        satisfaction_score: Math.random() * 2 + 8,
        customer_acquisition_cost: Math.floor(Math.random() * 5000) + 1000
      };
    }

    if (name.includes('contract') || name.includes('legal')) {
      return {
        ...baseMetadata,
        contract_count: Math.floor(Math.random() * 100) + 10,
        total_value: Math.floor(Math.random() * 50000000) + 5000000,
        expiring_soon: Math.floor(Math.random() * 10) + 1,
        auto_renewal: Math.random() > 0.5,
        avg_duration_months: Math.floor(Math.random() * 24) + 12,
        compliance_status: "Compliant"
      };
    }

    if (name.includes('employee') || name.includes('hr')) {
      return {
        ...baseMetadata,
        total_employees: Math.floor(Math.random() * 200) + 50,
        departments: ["Engineering", "Sales", "Marketing", "Operations"],
        avg_salary: Math.floor(Math.random() * 50000) + 70000,
        retention_rate: Math.random() * 0.1 + 0.85,
        remote_percentage: Math.random() * 0.5 + 0.3,
        diversity_metrics: {
          gender_ratio: 0.45,
          age_distribution: "25-45 years average"
        }
      };
    }

    return {
      ...baseMetadata,
      description: "Business document",
      status: "Active",
      version: "1.0",
      tags: ["business", "document"],
      importance_level: "Medium"
    };
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

  const removeFile = async (id: string) => {
    try {
      setIsLoading(true);
      await dataRoomDB.deleteFile(id);
      onFilesChange(files.filter(file => file.id !== id));
      await loadDatabaseStats();
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file from database');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (uploadedFile: UploadedFile) => {
    try {
      // Get fresh file data from IndexedDB
      const storedFile = await dataRoomDB.getFile(uploadedFile.id);
      if (storedFile) {
        const file = dataRoomDB.createFileFromStored(storedFile);
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
  };

  const startEditingMetadata = (fileId: string, currentMetadata: any) => {
    setEditingMetadata(fileId);
    setMetadataInput(JSON.stringify(currentMetadata, null, 2));
  };

  const saveMetadata = async (fileId: string) => {
    try {
      const parsedMetadata = JSON.parse(metadataInput);
      
      // Update IndexedDB
      await dataRoomDB.updateFile(fileId, { metadata: parsedMetadata });
      
      // Update local state
      onFileUpdate(fileId, { metadata: parsedMetadata });
      
      setEditingMetadata(null);
      setMetadataInput('');
    } catch (error) {
      alert('Invalid JSON format or database error');
      console.error('Failed to save metadata:', error);
    }
  };

  const assignToCategory = async (fileId: string, category: string) => {
    let subcategory = 'General';
    switch (category) {
      case 'Financial': subcategory = 'Financial Statements'; break;
      case 'Legal': subcategory = 'Contracts'; break;
      case 'Customers': subcategory = 'Customer Data'; break;
      case 'Corporate': subcategory = 'Corporate Documents'; break;
      case 'Operations': subcategory = 'Operational Data'; break;
      default: subcategory = 'Miscellaneous';
    }
    
    try {
      // Update IndexedDB
      await dataRoomDB.updateFile(fileId, { category, subcategory });
      
      // Update local state
      onFileUpdate(fileId, { category, subcategory });
      
      await loadDatabaseStats();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category in database');
    }
  };

  const clearAllFiles = async () => {
    if (confirm('Are you sure you want to delete all files? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        await dataRoomDB.clearAll();
        onFilesChange([]);
        await loadDatabaseStats();
      } catch (error) {
        console.error('Failed to clear database:', error);
        alert('Failed to clear database');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const exportData = async () => {
    try {
      const allFiles = await dataRoomDB.exportData();
      const dataStr = JSON.stringify(allFiles, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataroom-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data');
    }
  };

  const categorizedCount = files.filter(f => f.category && f.category !== 'General').length;
  const uncategorizedCount = files.length - categorizedCount;

  return (
    <div className="space-y-6 p-4">
      {/* Database Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">IndexedDB Storage</span>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportData}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Export Data
            </button>
            <button
              onClick={clearAllFiles}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Clear All
            </button>
          </div>
        </div>
        {dbStats && (
          <div className="mt-2 text-sm text-blue-700">
            <div className="grid grid-cols-2 gap-4">
              <div>Total Storage: {formatFileSize(dbStats.totalSize)}</div>
              <div>Files: {dbStats.totalFiles}</div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
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
                className="relative cursor-pointer text-blue-600 hover:text-blue-500"
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
            <p className="text-xs text-gray-500">
              Files are automatically saved to IndexedDB and categorized
            </p>
          </div>
        </div>
      </div>

      {/* Stats and Info */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-lg font-bold text-blue-600">{files.length}</div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-lg font-bold text-green-600">{categorizedCount}</div>
            <div className="text-sm text-gray-600">Categorized</div>
          </div>
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-lg font-bold text-orange-600">{uncategorizedCount}</div>
            <div className="text-sm text-gray-600">Uncategorized</div>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
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
                <li key={file.id} className="px-4 py-4 sm:px-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <File className="flex-shrink-0 h-8 w-8 text-gray-400" />
                          <HardDrive className="absolute -bottom-1 -right-1 h-3 w-3 text-blue-500" title="Stored in IndexedDB" />
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
                              📁 {file.category} → {file.subcategory}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Uploaded: {file.uploadDate.toLocaleDateString()} • Stored in IndexedDB
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditingMetadata(file.id, file.metadata)}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="Edit Metadata"
                          disabled={isLoading}
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          className="p-2 text-gray-400 hover:text-green-600"
                          title="Download from IndexedDB"
                          disabled={isLoading}
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete from IndexedDB"
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
                        onChange={(e) => {
                          const category = e.target.value;
                          assignToCategory(file.id, category);
                        }}
                        disabled={isLoading}
                        className={`text-xs border rounded px-2 py-1 ${
                          !file.category || file.category === 'General' 
                            ? 'border-orange-300 bg-orange-50' 
                            : 'border-green-300 bg-green-50'
                        }`}
                      >
                        <option value="">Select Category</option>
                        <option value="Financial">💰 Financial</option>
                        <option value="Legal">⚖️ Legal</option>
                        <option value="Customers">👥 Customers</option>
                        <option value="Corporate">🏢 Corporate</option>
                        <option value="Operations">⚙️ Operations</option>
                        <option value="General">📁 General</option>
                      </select>
                      
                      {(!file.category || file.category === 'General') && (
                        <span className="text-xs text-orange-600">
                          ⚠️ Assign a category to view in Categories tab
                        </span>
                      )}
                    </div>

                    {/* Metadata Editing */}
                    {editingMetadata === file.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={metadataInput}
                          onChange={(e) => setMetadataInput(e.target.value)}
                          className="w-full h-32 text-xs font-mono border rounded p-2"
                          placeholder="Edit metadata as JSON..."
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => saveMetadata(file.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            disabled={isLoading}
                          >
                            Save to IndexedDB
                          </button>
                          <button
                            onClick={() => setEditingMetadata(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      file.metadata && (
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <div className="text-gray-600 font-medium mb-1">
                            Metadata Preview (Stored in IndexedDB):
                          </div>
                          <div className="text-gray-800 font-mono">
                            {JSON.stringify(file.metadata, null, 2).substring(0, 200)}
                            {JSON.stringify(file.metadata).length > 200 && '...'}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-gray-600 mt-2">Processing files with IndexedDB...</p>
        </div>
      )}
    </div>
  );
};

export default FilesView;
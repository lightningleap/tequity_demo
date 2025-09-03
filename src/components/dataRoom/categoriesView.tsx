import React, { useState, useEffect, JSX } from 'react';
import {
  ChevronDown, ChevronRight, File, Folder, FileText, Search, Hash, Calendar,
  DollarSign, Users, Percent, Eye, EyeOff, Upload, Cloud, Loader,
  Check, X, AlertCircle, Plus, Trash2, Download, Copy, MoreVertical, Filter,
  ArrowDownToLine, ArrowUpToLine, ArrowUpDown, ChevronsUpDown, ChevronUp, ChevronLeft,
  BarChart, PieChart, LineChart, BarChart2,
  Settings, Shield, ShoppingBag, Package, Megaphone, Code, Presentation, ExternalLink
} from 'lucide-react';
import { UploadedFile } from './filesView';
import { dataRoomAPI } from '../../service/api';

interface CategoryStructure {
  [category: string]: UploadedFile[];
}

interface CategoriesViewProps {
  files: UploadedFile[];
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ files }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedObjects, setExpandedObjects] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<Record<string, any>>({});
  const [loadingMetadata, setLoadingMetadata] = useState<Record<string, boolean>>({});

  // Fetch available categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categories = await dataRoomAPI.getCategories();
        setAvailableCategories(categories);
        console.log('CategoriesView: Fetched categories:', categories);
      } catch (error) {
        console.error('CategoriesView: Failed to fetch categories:', error);
        // Fallback to default categories if API fails
        setAvailableCategories(['financial', 'sales', 'inventory', 'hr', 'marketing', 'legal', 'operations', 'general']);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Auto-expand categories if files exist
  useEffect(() => {
    if (files.length > 0) {
      const categoriesWithFiles = files.reduce((acc, file) => {
        const category = file.category || 'uncategorized';
        acc[category] = true;
        return acc;
      }, {} as Record<string, boolean>);

      setExpandedCategories(prev => ({ ...prev, ...categoriesWithFiles }));
    }
  }, [files]);

  // Convert uploaded files to category structure based on backend categories
  const organizeByCategoryStructure = (uploadedFiles: UploadedFile[]): CategoryStructure => {
    const result: CategoryStructure = {};

    uploadedFiles.forEach(file => {
      // Use the exact category from backend, or 'uncategorized' if none
      const category = file.category || 'uncategorized';

      if (!result[category]) {
        result[category] = [];
      }

      result[category].push(file);
    });

    return result;
  };

  const categorizedFiles = organizeByCategoryStructure(files);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Fetch metadata for a specific file with error handling
  const fetchFileMetadata = async (fileId: string) => {
    if (fileMetadata[fileId] || loadingMetadata[fileId]) {
      return; // Already loaded or loading
    }

    setLoadingMetadata(prev => ({ ...prev, [fileId]: true }));

    try {
      console.log(`CategoriesView: Fetching metadata for file ${fileId}`);
      const metadata = await dataRoomAPI.getFileMetadata(fileId);

      // Store the complete metadata response
      setFileMetadata(prev => ({ 
        ...prev, 
        [fileId]: {
          ...metadata,
          // Add computed fields for display
          file_size_formatted: formatFileSize(metadata.file_size_bytes || 0),
          ingestion_date: metadata.ingestion_timestamp ? new Date(metadata.ingestion_timestamp).toLocaleDateString() : 'N/A',
          last_accessed_date: metadata.last_accessed ? new Date(metadata.last_accessed).toLocaleDateString() : 'Never'
        }
      }));
      console.log(`CategoriesView: Metadata loaded for ${fileId}:`, metadata);
    } catch (error) {
      console.error(`CategoriesView: Failed to fetch metadata for file ${fileId}:`, error);
      setFileMetadata(prev => ({ ...prev, [fileId]: { error: 'Failed to load metadata' } }));
    } finally {
      setLoadingMetadata(prev => ({ ...prev, [fileId]: false }));
    }
  };

  // Batch load metadata for all files in a category when expanded
  const handleCategoryExpand = async (category: string) => {
    toggleCategory(category);

    if (!expandedCategories[category]) { // If expanding
      const categoryFiles = categorizedFiles[category] || [];

      // Batch load metadata with some delay to avoid overwhelming the API
      for (const file of categoryFiles) {
        if (!fileMetadata[file.fileId] && !loadingMetadata[file.fileId]) {
          await fetchFileMetadata(file.fileId);
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
  };

  const toggleObject = (path: string) => {
    setExpandedObjects((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Helper function to get a meaningful preview of an object
  const getObjectPreview = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return '';
    
    // Common fields that might give meaningful context
    const meaningfulFields = ['name', 'vendor_name', 'customer_name', 'title', 'description', 'type', 'id'];
    
    for (const field of meaningfulFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return obj[field];
      }
    }
    
    // If no meaningful field found, try to get the first string value
    const firstStringValue = Object.values(obj).find(v => typeof v === 'string' && String(v).length < 50);
    return firstStringValue ? String(firstStringValue) : '';
  };

  // Get user-friendly label for arrays based on context
  const getArrayLabel = (key: string, length: number): string => {
    const keyLower = key.toLowerCase();
    
    // Map common field names to user-friendly labels
    const labelMappings: Record<string, string> = {
      'vendors': 'vendors',
      'customers': 'customers',
      'employees': 'employees',
      'transactions': 'transactions',
      'invoices': 'invoices',
      'contracts': 'contracts',
      'payments': 'payments',
      'aging_buckets': 'aging buckets',
      'buckets': 'buckets',
      'categories': 'categories',
      'items': 'items',
      'records': 'records',
      'entries': 'entries',
      'data': 'data points',
    };

    // Check if key contains any of our known patterns
    for (const [pattern, label] of Object.entries(labelMappings)) {
      if (keyLower.includes(pattern)) {
        return `${length} ${label}`;
      }
    }

    // Default fallback
    return `${length} items`;
  };

  // Recursive function to render any type of data structure
  const renderDataValue = (value: any, key: string, path: string, depth: number = 0): React.ReactNode => {
    const maxDepth = 5; // Prevent infinite recursion
    if (depth > maxDepth) {
      return <span className="text-red-500 text-xs">Max depth reached</span>;
    }

    if (value === null) {
      return <span className="text-gray-400 italic">null</span>;
    }

    if (value === undefined) {
      return <span className="text-gray-400 italic">undefined</span>;
    }

    if (typeof value === 'string') {
      // Handle URLs
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono text-indigo-600 break-all">{value}</span>
            <button
              onClick={() => window.open(value, '_blank')}
              className="text-xs px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 rounded text-indigo-700 flex items-center space-x-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open</span>
            </button>
          </div>
        );
      }
      return <span className="text-sm font-mono text-gray-700">"{value}"</span>;
    }

    if (typeof value === 'number') {
      // Format numbers nicely
      const formattedNumber = typeof value === 'number' && value > 1000 
        ? value.toLocaleString() 
        : value.toString();
      return <span className="text-sm font-mono text-blue-600">{formattedNumber}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className={`text-sm font-mono ${value ? 'text-green-600' : 'text-red-600'}`}>{value.toString()}</span>;
    }

    if (Array.isArray(value)) {
      const expandKey = `${path}_${key}_array`;
      const isExpanded = expandedObjects[expandKey];
      const userFriendlyLabel = getArrayLabel(key, value.length);
      
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-purple-600 font-medium">
              {userFriendlyLabel}
            </span>
            {value.length > 0 && (
              <button
                onClick={() => toggleObject(expandKey)}
                className="text-xs px-2 py-0.5 bg-purple-100 hover:bg-purple-200 rounded text-purple-700"
              >
                {isExpanded ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
          {isExpanded && value.length > 0 && (
            <div className="mt-2 p-3 bg-purple-50 rounded border max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {value.slice(0, 50).map((item, index) => {
                  // For objects in arrays, show a preview
                  if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    const preview = getObjectPreview(item);
                    return (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-xs text-purple-500 font-mono min-w-[2rem]">[{index + 1}]:</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {preview && (
                              <span className="text-xs text-gray-600 font-medium">"{preview}"</span>
                            )}
                            <button
                              onClick={() => toggleObject(`${path}_${key}_${index}_item`)}
                              className="text-xs px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                            >
                              {expandedObjects[`${path}_${key}_${index}_item`] ? 'Hide Details' : 'Show Details'}
                            </button>
                          </div>
                          {expandedObjects[`${path}_${key}_${index}_item`] && (
                            <div className="pl-3 border-l-2 border-purple-200">
                              {renderDataValue(item, index.toString(), `${path}_${key}_${index}`, depth + 1)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-xs text-purple-500 font-mono min-w-[2rem]">[{index + 1}]:</span>
                        <div className="flex-1 min-w-0">
                          {renderDataValue(item, index.toString(), `${path}_${key}_${index}`, depth + 1)}
                        </div>
                      </div>
                    );
                  }
                })}
                {value.length > 50 && (
                  <div className="text-xs text-purple-500 text-center py-2 border-t border-purple-200">
                    ... and {value.length - 50} more items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      const expandKey = `${path}_${key}_object`;
      const isExpanded = expandedObjects[expandKey];
      const preview = getObjectPreview(value);

      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {preview && (
              <span className="text-sm text-gray-700 font-medium">"{preview}"</span>
            )}
            {entries.length > 0 && (
              <button
                onClick={() => toggleObject(expandKey)}
                className="text-xs px-2 py-0.5 bg-orange-100 hover:bg-orange-200 rounded text-orange-700"
              >
                {isExpanded ? 'Hide Details' : 'Show Details'}
              </button>
            )}
            <span className="text-xs text-gray-500">({entries.length} fields)</span>
          </div>
          {isExpanded && entries.length > 0 && (
            <div className="mt-2 p-3 bg-orange-50 rounded border max-h-60 overflow-y-auto">
              <div className="space-y-3">
                {entries.slice(0, 20).map(([objKey, objValue]) => (
                  <div key={objKey} className="border-b border-orange-200 pb-2 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <span className="text-xs font-medium text-orange-700 min-w-0 break-all">
                        {objKey}:
                      </span>
                      <div className="flex-1 min-w-0">
                        {renderDataValue(objValue, objKey, `${path}_${key}_${objKey}`, depth + 1)}
                      </div>
                    </div>
                  </div>
                ))}
                {entries.length > 20 && (
                  <div className="text-xs text-orange-500 text-center py-2 border-t border-orange-200">
                    ... and {entries.length - 20} more fields
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <span className="text-sm text-gray-500">{String(value)}</span>;
  };

  // Helper function to determine if a metadata value should be hidden
  const shouldHideValue = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  };

  // Render category metadata with proper structure
  const renderCategoryMetadata = (metadata: any): React.ReactNode => {
    if (!metadata || metadata.error) {
      return (
        <div className="text-red-600 text-sm">
          {metadata?.error || 'No metadata available'}
        </div>
      );
    }

    const categoryMetadata = metadata.category_metadata;

    if (!categoryMetadata) {
      return (
        <div className="text-gray-500 text-sm italic">
          No category metadata available
        </div>
      );
    }

    // Keys to hide from category metadata since they're already shown in file info
    const hiddenKeys = [
      'file_path',
      'file_name', 
      'category',
      'extraction_timestamp',
      'file_size_bytes'
    ];

    // Show basic file info first
    const basicInfo = [
      { key: 'file_name', label: 'File Name', value: metadata.file_name },
      { key: 'category', label: 'Category', value: metadata.category },
      { key: 'file_size_formatted', label: 'File Size', value: metadata.file_size_formatted },
      { key: 'ingestion_date', label: 'Ingested', value: metadata.ingestion_date },
    ].filter(item => item.value);

    return (
      <div className="space-y-4">
        {/* Basic File Information */}
        {basicInfo.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1">
              File Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {basicInfo.map(({ key, label, value }) => (
                <div key={key} className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-gray-800 text-sm">{label}:</span>
                  <span className="text-sm text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Metadata */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1">
            Category Metadata
          </h4>
          <div className="space-y-3">
            {typeof categoryMetadata === 'object' && !Array.isArray(categoryMetadata) ? (
              Object.entries(categoryMetadata)
                .filter(([key]) => !hiddenKeys.includes(key)) // Filter out general keys
                .map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded border">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <Hash className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="font-medium text-gray-800 text-sm break-all">{key}:</span>
                      </div>
                      <div className="flex-2 min-w-0">
                        {renderDataValue(value, key, `categoryMeta_${metadata.file_id}`)}
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="bg-gray-50 p-3 rounded border">
                {renderDataValue(categoryMetadata, 'root', `categoryMeta_${metadata.file_id}`)}
              </div>
            )}
            
            {/* Show message if no meaningful metadata after filtering */}
            {typeof categoryMetadata === 'object' && 
             !Array.isArray(categoryMetadata) && 
             Object.entries(categoryMetadata).filter(([key, value]) => 
               !hiddenKeys.includes(key) && !shouldHideValue(value)
             ).length === 0 && (
              <div className="text-gray-500 text-sm italic text-center py-4">
                No additional category-specific metadata available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced search filter
  const filterCategories = (data: CategoryStructure, query: string): CategoryStructure => {
    if (!query.trim()) return data;

    const searchLower = query.toLowerCase();
    const result: CategoryStructure = {};

    const searchInValue = (value: any): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.toLowerCase().includes(searchLower);
      if (typeof value === 'number') return value.toString().includes(searchLower);
      if (typeof value === 'boolean') return value.toString().includes(searchLower);
      if (Array.isArray(value)) return value.some(item => searchInValue(item));
      if (typeof value === 'object') {
        return Object.values(value).some(val => searchInValue(val));
      }
      return false;
    };

    Object.entries(data).forEach(([category, categoryFiles]) => {
      const matchingFiles = categoryFiles.filter(
        (file) => {
          const fileMatches = file.name.toLowerCase().includes(searchLower) ||
            category.toLowerCase().includes(searchLower);

          const metadata = fileMetadata[file.fileId];
          const metadataMatches = metadata ? searchInValue(metadata) : false;

          return fileMatches || metadataMatches;
        }
      );

      if (matchingFiles.length > 0) {
        result[category] = matchingFiles;
      }
    });

    return result;
  };

  const filteredCategorizedFiles = filterCategories(categorizedFiles, searchQuery);

  const getFileStatusIcon = (file: UploadedFile) => {
    if (file.aiProcessed) {
      return <Cloud className="h-3 w-3 text-green-500" />;
    } else {
      return <Cloud className="h-3 w-3 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const normalizedCategory = category?.toString().trim() || 'Uncategorized';
    
    // Direct mapping of categories to their respective icons
    const categoryIcons: Record<string, JSX.Element> = {
      'Accounts Payable': <DollarSign className="w-5 h-5 text-green-600" />,
      'Accounts Receivable': <DollarSign className="w-5 h-5 text-green-500" />,
      'Cap Table': <Users className="w-5 h-5 text-indigo-600" />,
      'Customer Contracts': <FileText className="w-5 h-5 text-blue-600" />,
      'Financial Projections': <LineChart className="w-5 h-5 text-purple-600" />,
      'Monthly Financials': <BarChart2 className="w-5 h-5 text-teal-600" />,
      'Revenue By Customer': <PieChart className="w-5 h-5 text-pink-600" />,
      'Stock Option Grants': <FileText className="w-5 h-5 text-amber-600" />,
      'Vendor Contracts': <FileText className="w-5 h-5 text-orange-600" />,
      'YTD Financials': <DollarSign className="w-5 h-5 text-emerald-600" />
    };
    
    // Return the matching icon or default folder icon
    return categoryIcons[normalizedCategory] || <Folder className="w-5 h-5 text-gray-400" />;
  };

  // Early return for no files
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
        <p className="mt-1 text-sm text-gray-500">
          Go to the Files tab to upload documents first.
        </p>
      </div>
    );
  }

  const totalCategories = Object.keys(categorizedFiles).length;
  const aiProcessedCount = files.filter(f => f.aiProcessed).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Search */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Files by Categories</h2>
          <p className="text-gray-600 mt-1">
            Browse and explore your documents organized by backend categories
            {isLoadingCategories && (
              <span className="inline-flex items-center ml-2">
                <Loader className="w-4 h-4 animate-spin mr-1" />
                Loading categories...
              </span>
            )}
          </p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files and metadata..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{totalCategories}</div>
          <div className="text-gray-600">Categories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{files.length}</div>
          <div className="text-gray-600">Total Files</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">{aiProcessedCount}</div>
          <div className="text-gray-600">AI Processed</div>
        </div>
      </div>

      {/* Available Categories Info */}
      {availableCategories.length > 0 && !isLoadingCategories && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Available Categories</h4>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map(category => (
              <span
                key={category}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Categories Tree */}
      <div className="space-y-2">
        {Object.entries(filteredCategorizedFiles).map(([category, categoryFiles]) => (
          <div key={category} className="border rounded-lg overflow-hidden shadow-sm bg-white">
            {/* Category Header */}
            <button
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-left font-medium flex items-center transition-all duration-200"
              onClick={() => handleCategoryExpand(category)}
            >
              {expandedCategories[category] ? (
                <ChevronDown className="w-5 h-5 mr-2 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 mr-2 text-gray-600" />
              )}
              {getCategoryIcon(category)}
              <span className="text-gray-900 ml-2 capitalize">
                {category.toLowerCase()}
              </span>
              <span className="ml-auto text-sm text-gray-500">
                {categoryFiles.length} files
              </span>
            </button>

            {/* Files in Category */}
            {expandedCategories[category] && (
              <div className="px-4 py-2 bg-gray-50">
                <div className="space-y-3">
                  {categoryFiles.map((file) => {
                    const metadata = fileMetadata[file.fileId];
                    const isLoadingMeta = loadingMetadata[file.fileId];

                    return (
                      <div key={file.id} className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center mb-3">
                          <div className="relative mr-2">
                            <File className="w-4 h-4 text-gray-500" />
                            <div className="absolute -bottom-1 -right-1">
                              {getFileStatusIcon(file)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • {file.type} • Uploaded {file.uploadDate.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 flex items-center space-x-2">
                              <span>{file.aiProcessed ? 'AI Processed & Searchable' : 'Backend Stored'}</span>
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
                          {!metadata && !isLoadingMeta && (
                            <button
                              onClick={() => fetchFileMetadata(file.fileId)}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              Load Metadata
                            </button>
                          )}
                        </div>

                        {/* Loading indicator */}
                        {isLoadingMeta && (
                          <div className="pl-6 border-t border-gray-200 pt-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Loader className="w-4 h-4 animate-spin" />
                              <span>Loading detailed metadata...</span>
                            </div>
                          </div>
                        )}

                        {/* Category metadata display */}
                        {metadata && !isLoadingMeta && (
                          <div className="pl-6 border-t border-gray-200 pt-3">
                            {renderCategoryMetadata(metadata)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {searchQuery && Object.keys(filteredCategorizedFiles).length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No results found for "{searchQuery}"</div>
          <div className="text-gray-500 mt-2">Try adjusting your search terms</div>
        </div>
      )}

      {/* No Categories */}
      {Object.keys(categorizedFiles).length === 0 && !searchQuery && (
        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categorized files</h3>
          <p className="mt-1 text-sm text-gray-500">
            Files will appear here once they are processed and categorized by AI.
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoriesView;
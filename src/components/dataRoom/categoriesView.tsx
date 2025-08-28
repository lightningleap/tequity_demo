import React, { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, File, Folder, FileText, Search, Hash, Calendar,
  DollarSign, Users, Percent, Eye, EyeOff, Upload, Cloud, Loader,
  ShoppingBag, Package, Megaphone, Shield, Settings,
  Code,
  Presentation
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

      // Extract detailed metadata from the API response
      const enrichedMetadata = {
        file_id: metadata.file_id,
        file_name: metadata.file_name,
        original_name: metadata.original_name,
        safe_name: metadata.safe_name,
        category: metadata.category,
        num_records: metadata.num_records,
        num_sheets: metadata.num_sheets,
        file_size_bytes: metadata.file_size_bytes,
        download_url: metadata.download_url,
        point_ids: metadata.point_ids,
        ingestion_timestamp: metadata.ingestion_timestamp,
        last_accessed: metadata.last_accessed,
        status: metadata.status,
        // Additional computed fields
        file_size_formatted: formatFileSize(metadata.file_size_bytes),
        ingestion_date: new Date(metadata.ingestion_timestamp).toLocaleDateString(),
        last_accessed_date: metadata.last_accessed ? new Date(metadata.last_accessed).toLocaleDateString() : 'Never',
        points_count: metadata.point_ids ? metadata.point_ids.length : 0,
        processing_status: metadata.status === 'active' ? 'Active' : metadata.status,
        searchable: metadata.point_ids && metadata.point_ids.length > 0
      };

      setFileMetadata(prev => ({ ...prev, [fileId]: enrichedMetadata }));
      console.log(`CategoriesView: Metadata loaded for ${fileId}:`, enrichedMetadata);
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

  // Enhanced value type detection
  const getValueType = (value: any): { type: string; icon: React.ReactNode; color: string } => {
    if (value === null || value === undefined) {
      return { type: 'null', icon: <Hash className="w-3 h-3" />, color: 'text-gray-400' };
    }

    if (typeof value === 'boolean') {
      return { type: 'boolean', icon: <Hash className="w-3 h-3" />, color: 'text-purple-600' };
    }

    if (typeof value === 'number') {
      if (value > 1000000) {
        return { type: 'currency', icon: <DollarSign className="w-3 h-3" />, color: 'text-green-600' };
      }
      if (value < 1 && value > 0) {
        return { type: 'percentage', icon: <Percent className="w-3 h-3" />, color: 'text-blue-600' };
      }
      return { type: 'number', icon: <Hash className="w-3 h-3" />, color: 'text-blue-600' };
    }

    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        return { type: 'date', icon: <Calendar className="w-3 h-3" />, color: 'text-orange-600' };
      }
      if (value.includes('@')) {
        return { type: 'email', icon: <Users className="w-3 h-3" />, color: 'text-indigo-600' };
      }
      return { type: 'string', icon: <FileText className="w-3 h-3" />, color: 'text-gray-700' };
    }

    if (Array.isArray(value)) {
      return { type: 'array', icon: <Hash className="w-3 h-3" />, color: 'text-red-600' };
    }

    if (typeof value === 'object') {
      return { type: 'object', icon: <Folder className="w-3 h-3" />, color: 'text-blue-500' };
    }

    return { type: 'unknown', icon: <Hash className="w-3 h-3" />, color: 'text-gray-500' };
  };

  // Enhanced value formatting
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      if (value > 1000000) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      }
      if (value < 1 && value > 0) {
        return `${(value * 100).toFixed(1)}%`;
      }
      if (Number.isInteger(value)) {
        return new Intl.NumberFormat('en-US').format(value);
      }
      return value.toFixed(2);
    }

    if (typeof value === 'string') {
      return `"${value}"`;
    }

    return String(value);
  };

  // Enhanced metadata renderer with better performance
  const renderMetadata = (metadata: any, path: string = '', level: number = 0): React.ReactNode => {
    // Limit recursion depth to prevent performance issues
    if (level > 5) {
      return <span className="text-gray-400 text-xs">[Max depth reached]</span>;
    }

    if (metadata === null || metadata === undefined) {
      const { icon, color } = getValueType(metadata);
      return (
        <div className="flex items-center space-x-1">
          <span className={color}>{icon}</span>
          <span className="text-gray-400 font-mono text-xs">null</span>
        </div>
      );
    }

    // Handle arrays
    if (Array.isArray(metadata)) {
      if (metadata.length === 0) {
        return (
          <div className="flex items-center space-x-1">
            <Hash className="w-3 h-3 text-red-600" />
            <span className="text-gray-500 font-mono text-xs">[]</span>
          </div>
        );
      }

      const arrayPath = `${path}_array`;
      const isExpanded = expandedObjects[arrayPath];

      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => toggleObject(arrayPath)}
              className="flex items-center space-x-1 hover:bg-gray-100 rounded px-1 py-0.5"
            >
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <Hash className="w-3 h-3 text-red-600" />
              <span className="text-xs font-medium text-gray-600">
                Array ({metadata.length} items)
              </span>
            </button>
          </div>

          {isExpanded && (
            <div className="ml-4 border-l-2 border-red-200 pl-3 space-y-2">
              {metadata.slice(0, 5).map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-mono text-gray-400">[{index}]</span>
                  </div>
                  <div className="ml-4">
                    {renderMetadata(item, `${arrayPath}_${index}`, level + 1)}
                  </div>
                </div>
              ))}
              {metadata.length > 5 && (
                <div className="text-xs text-gray-500 ml-4">
                  ... and {metadata.length - 5} more items
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Handle objects
    if (typeof metadata === 'object') {
      const entries = Object.entries(metadata);
      if (entries.length === 0) {
        return (
          <div className="flex items-center space-x-1">
            <Folder className="w-3 h-3 text-blue-500" />
            <span className="text-gray-500 font-mono text-xs">{'{}'}</span>
          </div>
        );
      }

      const objPath = `${path}_obj`;
      const isExpanded = expandedObjects[objPath];

      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => toggleObject(objPath)}
              className="flex items-center space-x-1 hover:bg-gray-100 rounded px-1 py-0.5"
            >
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <Folder className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-medium text-gray-600">
                Object ({entries.length} properties)
              </span>
            </button>
          </div>

          {isExpanded && (
            <div className="ml-4 border-l-2 border-blue-200 pl-3 space-y-2">
              {entries.slice(0, 10).map(([key, value]) => {
                const { icon, color } = getValueType(value);
                const keyPath = `${objPath}_${key}`;

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-start space-x-2">
                      <div className="flex items-center space-x-1 min-w-0">
                        <span className={color}>{icon}</span>
                        <span className="font-medium text-gray-800 text-xs">
                          {key.replace(/_/g, ' ')}:
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {(typeof value === 'object' && value !== null) || Array.isArray(value) ? (
                          renderMetadata(value, keyPath, level + 1)
                        ) : (
                          <span className={`${color} font-mono text-xs break-all`}>
                            {formatValue(value)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {entries.length > 10 && (
                <div className="text-xs text-gray-500">
                  ... and {entries.length - 10} more properties
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Handle primitive values
    const { icon, color } = getValueType(metadata);
    return (
      <div className="flex items-center space-x-1">
        <span className={color}>{icon}</span>
        <span className={`${color} font-mono text-xs`}>
          {formatValue(metadata)}
        </span>
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
    const normalizedCategory = category?.toString().trim().toLowerCase() || 'uncategorized';
    
    // Icon mapping for better maintainability
    const iconMap = [
      {
        keywords: ['financial', 'revenue', 'account', 'ytd', 'finance', 'tax', 'balance sheet'],
        icon: <DollarSign className="w-5 h-5 text-green-600" />
      },
      {
        keywords: ['contract', 'agreement', 'nda', 'mou'],
        icon: <FileText className={`w-5 h-5 ${
          normalizedCategory.includes('customer') ? 'text-blue-600' : 
          normalizedCategory.includes('vendor') ? 'text-orange-600' : 
          'text-gray-600'
        }`} />
      },
      {
        keywords: ['cap table', 'stock', 'option', 'grant', 'equity', 'shares'],
        icon: <Users className="w-5 h-5 text-indigo-600" />
      },
      {
        keywords: ['sales', 'customer', 'client', 'deal'],
        icon: <ShoppingBag className="w-5 h-5 text-blue-600" />
      },
      {
        keywords: ['inventory', 'stock', 'supply chain', 'warehouse'],
        icon: <Package className="w-5 h-5 text-orange-600" />
      },
      {
        keywords: ['hr', 'human resource', 'employee', 'staff', 'payroll', 'benefits'],
        icon: <Users className="w-5 h-5 text-purple-600" />
      },
      {
        keywords: ['marketing', 'campaign', 'advertising', 'brand', 'social media'],
        icon: <Megaphone className="w-5 h-5 text-pink-600" />
      },
      {
        keywords: ['legal', 'compliance', 'regulatory', 'policy'],
        icon: <Shield className="w-5 h-5 text-gray-600" />
      },
      {
        keywords: ['operations', 'ops', 'logistics', 'facilities'],
        icon: <Settings className="w-5 h-5 text-teal-600" />
      },
      {
        keywords: ['product', 'development', 'r&d', 'research'],
        icon: <Code className="w-5 h-5 text-blue-400" />
      },
      {
        keywords: ['meeting', 'minutes', 'presentation', 'deck'],
        icon: <Presentation className="w-5 h-5 text-amber-600" />
      }
    ];
  
    // Find the first matching category
    const matchedIcon = iconMap.find(item => 
      item.keywords.some(keyword => normalizedCategory.includes(keyword))
    );
  
    return matchedIcon?.icon || <Folder className="w-5 h-5 text-gray-400" />;
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

                        {/* Fetched metadata display */}
                        {metadata && !isLoadingMeta && (
                          <div className="pl-6 border-t border-gray-200 pt-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Detailed Metadata:
                            </div>
                            {metadata.error ? (
                              <div className="text-red-600 text-sm">
                                Error loading metadata: {metadata.error}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {/* Basic file info */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-600">Backend File ID:</span>
                                    <span className="ml-2 font-mono text-blue-600">{metadata.file_id}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Status:</span>
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${metadata.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                      {metadata.processing_status}
                                    </span>
                                  </div>
                                </div>

                                {/* Processing details */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-600">Processed:</span>
                                    <span className="ml-2">{metadata.ingestion_date}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Last Accessed:</span>
                                    <span className="ml-2">{metadata.last_accessed_date}</span>
                                  </div>
                                </div>

                                {/* Full metadata object */}
                                <div className="mt-3">
                                  <div className="text-sm font-medium text-gray-600 mb-2">
                                    Complete Metadata Structure:
                                  </div>
                                  {renderMetadata(metadata, `${category}-${file.id}`)}
                                </div>
                              </div>
                            )}
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
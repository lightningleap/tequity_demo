import React, { useState } from 'react';
import { ChevronDown, ChevronRight, File, Folder, FileText, Search, Hash, Calendar, DollarSign, Users, Percent, Eye, EyeOff, Upload, Cloud, HardDrive } from 'lucide-react';
import { UploadedFile } from './filesView';

interface CategoryStructure {
  [category: string]: {
    [subcategory: string]: UploadedFile[];
  };
}

interface CategoriesViewProps {
  files: UploadedFile[];
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ files }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});
  const [expandedObjects, setExpandedObjects] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Convert uploaded files to category structure
  const organizeByCategoryStructure = (uploadedFiles: UploadedFile[]): CategoryStructure => {
    const result: CategoryStructure = {};

    uploadedFiles.forEach(file => {
      const category = file.category || 'Uncategorized';
      const subcategory = file.subcategory || 'General';

      if (!result[category]) {
        result[category] = {};
      }
      if (!result[category][subcategory]) {
        result[category][subcategory] = [];
      }
      
      result[category][subcategory].push(file);
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

  const toggleSubcategory = (category: string, subcategory: string) => {
    const key = `${category}-${subcategory}`;
    setExpandedSubcategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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

  // Enhanced metadata renderer
  const renderMetadata = (metadata: any, path: string = '', level: number = 0): React.ReactNode => {
    if (metadata === null || metadata === undefined) {
      const { icon, color } = getValueType(metadata);
      return (
        <div className="flex items-center space-x-1">
          <span className={color}>{icon}</span>
          <span className="text-gray-400 font-mono">null</span>
        </div>
      );
    }

    // Handle arrays
    if (Array.isArray(metadata)) {
      if (metadata.length === 0) {
        return (
          <div className="flex items-center space-x-1">
            <Hash className="w-3 h-3 text-red-600" />
            <span className="text-gray-500 font-mono">[]</span>
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
              <span className="text-sm font-medium text-gray-600">
                Array ({metadata.length} items)
              </span>
            </button>
          </div>
          
          {isExpanded && (
            <div className="ml-4 border-l-2 border-red-200 pl-3 space-y-2">
              {metadata.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-mono text-gray-400">[{index}]</span>
                  </div>
                  <div className="ml-4">
                    {renderMetadata(item, `${arrayPath}_${index}`, level + 1)}
                  </div>
                </div>
              ))}
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
            <span className="text-gray-500 font-mono">{'{}'}</span>
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
              <span className="text-sm font-medium text-gray-600">
                Object ({entries.length} properties)
              </span>
            </button>
          </div>
          
          {isExpanded && (
            <div className="ml-4 border-l-2 border-blue-200 pl-3 space-y-2">
              {entries.map(([key, value]) => {
                const { icon, color } = getValueType(value);
                const keyPath = `${objPath}_${key}`;
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-start space-x-2">
                      <div className="flex items-center space-x-1 min-w-0">
                        <span className={color}>{icon}</span>
                        <span className="font-medium text-gray-800 text-sm">
                          {key.replace(/_/g, ' ')}:
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {(typeof value === 'object' && value !== null) || Array.isArray(value) ? (
                          renderMetadata(value, keyPath, level + 1)
                        ) : (
                          <span className={`${color} font-mono text-sm break-all`}>
                            {formatValue(value)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
        <span className={`${color} font-mono text-sm`}>
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

    Object.entries(data).forEach(([category, subcategories]) => {
      const filteredSubcategories: { [subcategory: string]: UploadedFile[] } = {};

      Object.entries(subcategories).forEach(([subcategory, subcategoryFiles]) => {
        const matchingFiles = subcategoryFiles.filter(
          (file) =>
            file.name.toLowerCase().includes(searchLower) ||
            searchInValue(file.metadata)
        );

        if (matchingFiles.length > 0) {
          filteredSubcategories[subcategory] = matchingFiles;
        }
      });

      if (Object.keys(filteredSubcategories).length > 0) {
        result[category] = filteredSubcategories;
      } else if (category.toLowerCase().includes(searchLower)) {
        result[category] = subcategories;
      }
    });

    return result;
  };

  const filteredCategorizedFiles = filterCategories(categorizedFiles, searchQuery);

  const getFileStatusIcon = (file: UploadedFile) => {
    if (file.isBackendSynced && file.aiProcessed) {
      return <Cloud className="h-3 w-3 text-green-500" />;
    } else if (file.isBackendSynced) {
      return <Cloud className="h-3 w-3 text-blue-500" />;
    } else {
      return <HardDrive className="h-3 w-3 text-orange-500" />;
    }
  };

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

  const syncedCount = files.filter(f => f.isBackendSynced).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Search */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Files by Categories</h2>
          <p className="text-gray-600 mt-1">
            Browse and explore your documents organized by category
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
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{Object.keys(categorizedFiles).length}</div>
          <div className="text-gray-600">Categories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {Object.values(categorizedFiles).reduce((acc, cat) => acc + Object.keys(cat).length, 0)}
          </div>
          <div className="text-gray-600">Subcategories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {files.length}
          </div>
          <div className="text-gray-600">Total Files</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {syncedCount}
          </div>
          <div className="text-gray-600">AI Processed</div>
        </div>
      </div>

      {/* Categories Tree */}
      <div className="space-y-2">
        {Object.entries(filteredCategorizedFiles).map(([category, subcategories]) => (
          <div key={category} className="border rounded-lg overflow-hidden shadow-sm bg-white">
            {/* Category Header */}
            <button
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-left font-medium flex items-center transition-all duration-200"
              onClick={() => toggleCategory(category)}
            >
              {expandedCategories[category] ? (
                <ChevronDown className="w-5 h-5 mr-2 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 mr-2 text-gray-600" />
              )}
              <Folder className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-gray-900 capitalize">{category}</span>
              <span className="ml-auto text-sm text-gray-500">
                {Object.keys(subcategories).length} subcategories
              </span>
            </button>

            {/* Subcategories */}
            {expandedCategories[category] && (
              <div className="px-4 py-2 bg-gray-50">
                <div className="space-y-2">
                  {Object.entries(subcategories).map(([subcategory, subcategoryFiles]) => (
                    <div key={subcategory} className="bg-white rounded-lg border">
                      <button
                        className="w-full px-4 py-3 text-left font-medium flex items-center hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => toggleSubcategory(category, subcategory)}
                      >
                        {expandedSubcategories[`${category}-${subcategory}`] ? (
                          <ChevronDown className="w-4 h-4 mr-2 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 mr-2 text-gray-600" />
                        )}
                        <FileText className="w-4 h-4 mr-2 text-blue-400" />
                        <span className="text-gray-800">{subcategory}</span>
                        <span className="ml-auto text-sm text-gray-500">
                          {subcategoryFiles.length} files
                        </span>
                      </button>

                      {/* Files */}
                      {expandedSubcategories[`${category}-${subcategory}`] && (
                        <div className="px-4 pb-4 space-y-3">
                          {subcategoryFiles.map((file) => (
                            <div key={file.id} className="bg-gray-50 p-4 rounded-lg border">
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
                                  <div className="text-xs text-gray-400 mt-1">
                                    {file.isBackendSynced ? 'AI Processed & Searchable' : 'Local Storage Only'}
                                  </div>
                                </div>
                              </div>
                              {file.metadata && (
                                <div className="pl-6">
                                  {renderMetadata(file.metadata, `${category}-${subcategory}-${file.id}`)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
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
    </div>
  );
};

export default CategoriesView;
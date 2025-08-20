import React, { useState, useEffect } from 'react';
import { dataRoomDB, StoredFile } from '../../services/indexedDb';
import { dataRoomAPI, APIFileResponse } from '../../service/api';
import { Upload, File, Download, Trash2, Tag, AlertCircle, Database, RefreshCw, HardDrive, Wifi, WifiOff, Cloud } from 'lucide-react';

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
  // New fields for hybrid storage
  isBackendSynced?: boolean;
  backendFileId?: string;
  aiProcessed?: boolean;
}

interface FilesViewProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onFileUpdate: (fileId: string, updates: Partial<UploadedFile>) => void;
  onDatabaseStats: (stats: any) => void;
}

type ConnectionStatus = 'online' | 'offline' | 'backend-only' | 'local-only';

const FilesView: React.FC<FilesViewProps> = ({ 
  files, 
  onFilesChange, 
  onFileUpdate,
  onDatabaseStats 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null);

  // Load files from both sources on component mount
  useEffect(() => {
    console.log('🔄 FilesView: Component mounted, loading files from both sources...');
    loadFilesFromBothSources();
    loadDatabaseStats();
    checkConnectionStatus();
    
    // Check connection status periodically
    const interval = setInterval(checkConnectionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    console.log('🌐 FilesView: Checking connection status...');
    const isOnline = navigator.onLine;
    console.log('📶 Navigator online status:', isOnline);
    
    if (!isOnline) {
      console.log('❌ FilesView: Device is offline');
      setConnectionStatus('offline');
      return;
    }
    
    try {
      console.log('🔍 FilesView: Testing backend health...');
      const isBackendHealthy = await dataRoomAPI.checkHealth();
      console.log('🏥 Backend health check result:', isBackendHealthy);
      
      if (isBackendHealthy) {
        console.log('✅ FilesView: Backend is healthy, setting status to online');
        setConnectionStatus('online');
      } else {
        console.log('⚠️ FilesView: Backend unhealthy, local-only mode');
        setConnectionStatus('local-only');
      }
    } catch (error) {
      console.error('❌ FilesView: Backend health check failed:', error);
      setConnectionStatus('local-only');
    }
  };

  const loadFilesFromBothSources = async () => {
    try {
      console.log('📂 FilesView: Starting to load files from both sources...');
      setIsLoading(true);
      
      // Always load from IndexedDB first (offline capability)
      console.log('💾 FilesView: Loading files from IndexedDB...');
      const localFiles = await loadFilesFromIndexedDB();
      console.log(`📊 FilesView: Loaded ${localFiles.length} files from IndexedDB`);
      onFilesChange(localFiles);
      
      // Try to sync with backend if available
      if (connectionStatus === 'online') {
        console.log('🔄 FilesView: Connection online, attempting backend sync...');
        await syncWithBackend();
      } else {
        console.log('📴 FilesView: Connection not online, skipping backend sync');
      }
    } catch (error) {
      console.error('❌ FilesView: Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilesFromIndexedDB = async (): Promise<UploadedFile[]> => {
    console.log('💾 FilesView: Fetching stored files from IndexedDB...');
    const storedFiles = await dataRoomDB.getAllFiles();
    console.log(`📁 FilesView: Retrieved ${storedFiles.length} stored files from IndexedDB`);
    
    const uploadedFiles = storedFiles.map((storedFile, index) => {
      console.log(`📄 FilesView: Processing stored file ${index + 1}/${storedFiles.length}:`, {
        id: storedFile.id,
        name: storedFile.name,
        size: storedFile.size,
        category: storedFile.category,
        subcategory: storedFile.subcategory,
        uploadDate: storedFile.uploadDate,
        metadata: storedFile.metadata
      });

      const uploadedFile: UploadedFile = {
        id: storedFile.id,
        file: dataRoomDB.createFileFromStored(storedFile),
        name: storedFile.name,
        size: storedFile.size,
        type: storedFile.type,
        uploadDate: storedFile.uploadDate,
        category: storedFile.category,
        subcategory: storedFile.subcategory,
        metadata: storedFile.metadata,
        isBackendSynced: storedFile.metadata?.isBackendSynced || false,
        backendFileId: storedFile.metadata?.backendFileId,
        aiProcessed: storedFile.metadata?.aiProcessed || false
      };

      console.log(`✅ FilesView: Converted stored file to uploaded file:`, {
        id: uploadedFile.id,
        name: uploadedFile.name,
        isBackendSynced: uploadedFile.isBackendSynced,
        backendFileId: uploadedFile.backendFileId,
        aiProcessed: uploadedFile.aiProcessed,
        metadataKeys: Object.keys(uploadedFile.metadata || {})
      });

      return uploadedFile;
    });
    
    console.log(`🔄 FilesView: Converted ${uploadedFiles.length} stored files to uploaded files`);
    return uploadedFiles;
  };

  const syncWithBackend = async () => {
    if (connectionStatus !== 'online') {
      console.log('📴 FilesView: Cannot sync - not online');
      return;
    }
    
    try {
      console.log('🔄 FilesView: Starting backend sync...');
      setSyncStatus('syncing');
      
      console.log('📡 FilesView: Fetching files from backend...');
      const backendFiles = await dataRoomAPI.getFiles();
      console.log(`📊 FilesView: Retrieved ${backendFiles.length} files from backend:`, backendFiles);
      
      // Update local files with backend sync status
      console.log('🔄 FilesView: Updating local files with backend status...');
      const updatedFiles = await Promise.all(
        files.map(async (file, index) => {
          console.log(`🔍 FilesView: Processing file ${index + 1}/${files.length} for sync:`, {
            localFileId: file.id,
            localBackendFileId: file.backendFileId,
            localIsBackendSynced: file.isBackendSynced
          });

          const backendFile = backendFiles.find(bf => bf.file_id === file.backendFileId);
          
          if (backendFile) {
            console.log(`✅ FilesView: Found matching backend file:`, {
              backendFileId: backendFile.file_id,
              backendFileName: backendFile.file_name,
              backendCategory: backendFile.category,
              backendNumRecords: backendFile.num_records
            });

            const updatedFile = {
              ...file,
              isBackendSynced: true,
              aiProcessed: true
            };

            console.log(`🔄 FilesView: Updated file sync status:`, {
              fileId: updatedFile.id,
              isBackendSynced: updatedFile.isBackendSynced,
              aiProcessed: updatedFile.aiProcessed
            });

            return updatedFile;
          } else {
            console.log(`❌ FilesView: No matching backend file found for local file ${file.id}`);
            return file;
          }
        })
      );
      
      console.log('✅ FilesView: Sync completed successfully');
      onFilesChange(updatedFiles);
      setSyncStatus('idle');
    } catch (error) {
      console.error('❌ FilesView: Sync failed:', error);
      setSyncStatus('error');
    }
  };

  const loadDatabaseStats = async () => {
    try {
      console.log('📊 FilesView: Loading database stats...');
      const stats = await dataRoomDB.getStats();
      console.log('📈 FilesView: Database stats loaded:', stats);
      setDbStats(stats);
      onDatabaseStats(stats);
    } catch (error) {
      console.error('❌ FilesView: Failed to load database stats:', error);
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
    if (!fileList) {
      console.log('❌ FilesView: No files provided');
      return;
    }

    console.log(`📤 FilesView: Starting upload of ${fileList.length} files...`);
    setIsLoading(true);
    
    try {
      const newUploadedFiles: UploadedFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setCurrentProcessingFile(file.name);
        console.log(`📁 FilesView: Processing file ${i + 1}/${fileList.length}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified)
        });

        let uploadedFile: UploadedFile;
        let isBackendSynced = false;
        let backendFileId: string | undefined;
        let aiProcessed = false;

        try {
          // Try backend upload first if online
          if (connectionStatus === 'online') {
            console.log(`☁️ FilesView: Attempting backend upload for ${file.name}...`);
            const apiResponse = await dataRoomAPI.uploadFile(file);
            console.log(`✅ FilesView: Backend upload successful:`, {
              fileId: apiResponse.file_id,
              fileName: apiResponse.file_name,
              category: apiResponse.category,
              numRecords: apiResponse.num_records,
              numSheets: apiResponse.num_sheets,
              fileSizeBytes: apiResponse.file_size_bytes
            });
            
            const enhancedMetadata = {
              // Only backend metadata when backend provides data
              backend_file_id: apiResponse.file_id,
              num_records: apiResponse.num_records,
              num_sheets: apiResponse.num_sheets,
              point_ids: apiResponse.point_ids,
              backend_category: apiResponse.category,
              processed_by_ai: true,
              semantic_search_enabled: true,
              ingestion_timestamp: apiResponse.ingestion_timestamp,
              isBackendSynced: true,
              aiProcessed: true,
              file_size: apiResponse.file_size_bytes,
              upload_date: new Date(apiResponse.ingestion_timestamp).toISOString().split('T')[0],
              file_type: file.type || 'unknown',
              stored_in_indexeddb: true,
              backend_processed: true
            };

            console.log(`📊 FilesView: Enhanced metadata created:`, {
              backendFileId: enhancedMetadata.backend_file_id,
              numRecords: enhancedMetadata.num_records,
              backendCategory: enhancedMetadata.backend_category,
              processedByAI: enhancedMetadata.processed_by_ai,
              localMetadataKeys: Object.keys(enhancedMetadata).filter(k => !k.startsWith('backend_') && !k.startsWith('processed_'))
            });
            
            uploadedFile = {
              id: apiResponse.file_id,
              file,
              name: apiResponse.file_name,
              size: apiResponse.file_size_bytes,
              type: file.type,
              uploadDate: new Date(apiResponse.ingestion_timestamp),
              metadata: enhancedMetadata,
              category: apiResponse.category,
              subcategory: dataRoomAPI.getSubcategoryFromCategory(apiResponse.category),
              isBackendSynced: true,
              backendFileId: apiResponse.file_id,
              aiProcessed: true
            };

            console.log(`✅ FilesView: Backend uploaded file object created:`, {
              id: uploadedFile.id,
              name: uploadedFile.name,
              category: uploadedFile.category,
              subcategory: uploadedFile.subcategory,
              isBackendSynced: uploadedFile.isBackendSynced,
              aiProcessed: uploadedFile.aiProcessed
            });

            isBackendSynced = true;
            backendFileId = apiResponse.file_id;
            aiProcessed = true;
          } else {
            // Fallback to local-only storage
            console.log(`💾 FilesView: Backend not available, using local-only storage for ${file.name}`);
            const localId = Math.random().toString(36).substr(2, 9);
            const autoCategory = getAutoCategoryFromFilename(file.name);
            
            console.log(`🏷️ FilesView: Auto-categorized file:`, {
              fileName: file.name,
              autoCategory: autoCategory.category,
              autoSubcategory: autoCategory.subcategory
            });
            
            const localMetadata = generateLocalMetadata(file);
            console.log(`📊 FilesView: Generated local metadata:`, localMetadata);
            
            uploadedFile = {
              id: localId,
              file,
              name: file.name,
              size: file.size,
              type: file.type,
              uploadDate: new Date(),
              metadata: localMetadata,
              category: autoCategory.category,
              subcategory: autoCategory.subcategory,
              isBackendSynced: false,
              aiProcessed: false
            };

            console.log(`💾 FilesView: Local-only uploaded file object created:`, {
              id: uploadedFile.id,
              name: uploadedFile.name,
              category: uploadedFile.category,
              subcategory: uploadedFile.subcategory,
              isBackendSynced: uploadedFile.isBackendSynced,
              aiProcessed: uploadedFile.aiProcessed
            });
          }

          // Always save to IndexedDB for offline access
          console.log(`💾 FilesView: Saving to IndexedDB...`);
          const fileBuffer = await file.arrayBuffer();
          console.log(`📊 FilesView: File converted to buffer, size: ${fileBuffer.byteLength} bytes`);

          const storedFile: StoredFile = {
            id: uploadedFile.id,
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type,
            uploadDate: uploadedFile.uploadDate,
            category: uploadedFile.category,
            subcategory: uploadedFile.subcategory,
            metadata: {
              ...uploadedFile.metadata,
              isBackendSynced,
              backendFileId,
              aiProcessed
            },
            fileData: fileBuffer
          };
          
          console.log(`💾 FilesView: Storing file in IndexedDB:`, {
            id: storedFile.id,
            name: storedFile.name,
            category: storedFile.category,
            subcategory: storedFile.subcategory,
            metadataKeys: Object.keys(storedFile.metadata || {}),
            fileDataSize: storedFile.fileData.byteLength
          });

          await dataRoomDB.saveFile(file, storedFile);
          console.log(`✅ FilesView: File saved to IndexedDB successfully`);
          
          newUploadedFiles.push(uploadedFile);

        } catch (backendError) {
          console.error(`❌ FilesView: Backend upload failed for ${file.name}, using local storage only:`, backendError);
          
          // Fallback: Local storage only
          const localId = Math.random().toString(36).substr(2, 9);
          const autoCategory = getAutoCategoryFromFilename(file.name);
          
          console.log(`🔄 FilesView: Creating fallback local file:`, {
            localId,
            fileName: file.name,
            autoCategory: autoCategory.category,
            autoSubcategory: autoCategory.subcategory
          });

          const localMetadata = {
            ...generateLocalMetadata(file),
            isBackendSynced: false,
            aiProcessed: false,
            sync_pending: true
          };

          console.log(`📊 FilesView: Fallback metadata created:`, localMetadata);
          
          const fallbackFile: UploadedFile = {
            id: localId,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date(),
            metadata: localMetadata,
            category: autoCategory.category,
            subcategory: autoCategory.subcategory,
            isBackendSynced: false,
            aiProcessed: false
          };

          const fileBuffer = await file.arrayBuffer();
          const storedFile: StoredFile = {
            id: fallbackFile.id,
            name: fallbackFile.name,
            size: fallbackFile.size,
            type: fallbackFile.type,
            uploadDate: fallbackFile.uploadDate,
            category: fallbackFile.category,
            subcategory: fallbackFile.subcategory,
            metadata: fallbackFile.metadata,
            fileData: fileBuffer
          };
          
          console.log(`💾 FilesView: Storing fallback file in IndexedDB:`, {
            id: storedFile.id,
            name: storedFile.name,
            syncPending: storedFile.metadata?.sync_pending
          });

          await dataRoomDB.saveFile(file, storedFile);
          console.log(`✅ FilesView: Fallback file saved to IndexedDB`);
          
          newUploadedFiles.push(fallbackFile);
        }

        // After each file completes, clear the name if next loop won't set immediately
        setCurrentProcessingFile(null);
      }

      console.log(`✅ FilesView: Upload process completed. ${newUploadedFiles.length} files processed`);
      onFilesChange([...files, ...newUploadedFiles]);
      await loadDatabaseStats();
    } catch (error) {
      console.error('❌ FilesView: File upload failed:', error);
      alert('Failed to upload files. Check console for details.');
    } finally {
      setIsLoading(false);
      setCurrentProcessingFile(null);
    }
  };

  const getAutoCategoryFromFilename = (filename: string): { category: string; subcategory: string } => {
    console.log(`🏷️ FilesView: Auto-categorizing filename: ${filename}`);
    const name = filename.toLowerCase();
    
    let result = { category: 'general', subcategory: 'Miscellaneous' };
    
    if (name.includes('financial') || name.includes('revenue') || name.includes('income') || name.includes('budget')) {
      result = { category: 'financial', subcategory: 'Financial Statements' };
    } else if (name.includes('customer') || name.includes('client') || name.includes('sales')) {
      result = { category: 'sales', subcategory: 'Customer Data' };
    } else if (name.includes('contract') || name.includes('agreement') || name.includes('legal')) {
      result = { category: 'legal', subcategory: 'Contracts' };
    } else if (name.includes('employee') || name.includes('hr') || name.includes('payroll')) {
      result = { category: 'hr', subcategory: 'HR Documents' };
    } else if (name.includes('inventory') || name.includes('stock') || name.includes('warehouse')) {
      result = { category: 'inventory', subcategory: 'Inventory Management' };
    } else if (name.includes('marketing') || name.includes('campaign') || name.includes('promotion')) {
      result = { category: 'marketing', subcategory: 'Marketing Materials' };
    }
    
    console.log(`🏷️ FilesView: Auto-categorization result:`, result);
    return result;
  };

  const generateLocalMetadata = (file: File): Record<string, any> => {
    console.log(`📊 FilesView: Generating local metadata for: ${file.name}`);
    
    const baseMetadata = {
      file_size: file.size,
      upload_date: new Date().toISOString().split('T')[0],
      file_type: file.type || 'unknown',
      last_modified: file.lastModified ? new Date(file.lastModified).toISOString().split('T')[0] : null,
      stored_in_indexeddb: true,
      local_generation: true
    };

    console.log(`📊 FilesView: Base metadata:`, baseMetadata);

    const name = file.name.toLowerCase();
    let enhancedMetadata = { ...baseMetadata };

    if (name.includes('financial') || name.includes('revenue')) {
      const financialData = {
        period: "2024-Q4",
        total_revenue: Math.floor(Math.random() * 10000000) + 1000000,
        net_income: Math.floor(Math.random() * 2000000) + 500000,
        gross_margin: Math.random() * 0.3 + 0.6,
        regions: ["North America", "Europe", "Asia"],
        currency: "USD"
      };
      enhancedMetadata = { ...baseMetadata, ...financialData };
      console.log(`💰 FilesView: Added financial metadata:`, financialData);
    } else if (name.includes('customer') || name.includes('client')) {
      const customerData = {
        total_customers: Math.floor(Math.random() * 500) + 50,
        active_customers: Math.floor(Math.random() * 400) + 40,
        churn_rate: Math.random() * 0.1 + 0.05,
        avg_contract_value: Math.floor(Math.random() * 100000) + 10000,
        top_industries: ["Technology", "Healthcare", "Finance", "Retail"]
      };
      enhancedMetadata = { ...baseMetadata, ...customerData };
      console.log(`👥 FilesView: Added customer metadata:`, customerData);
    } else {
      const genericData = {
        description: "Business document",
        status: "Active",
        version: "1.0",
        tags: ["business", "document"]
      };
      enhancedMetadata = { ...baseMetadata, ...genericData };
      console.log(`📄 FilesView: Added generic metadata:`, genericData);
    }

    console.log(`✅ FilesView: Final metadata generated:`, enhancedMetadata);
    return enhancedMetadata;
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
    console.log(`🎯 FilesView: Files dropped, processing ${e.dataTransfer.files.length} files`);
    handleFileChange(e.dataTransfer.files);
  };

  const removeFile = async (id: string) => {
    try {
      console.log(`🗑️ FilesView: Removing file with ID: ${id}`);
      setIsLoading(true);
      const file = files.find(f => f.id === id);
      console.log(`📁 FilesView: Found file to remove:`, {
        id: file?.id,
        name: file?.name,
        isBackendSynced: file?.isBackendSynced,
        backendFileId: file?.backendFileId
      });
      
      // Remove from IndexedDB
      console.log(`💾 FilesView: Removing from IndexedDB...`);
      await dataRoomDB.deleteFile(id);
      console.log(`✅ FilesView: File removed from IndexedDB`);
      
      // Note: Backend doesn't have delete endpoint in the provided API
      // Would need to add delete functionality to backend
      
      onFilesChange(files.filter(file => file.id !== id));
      await loadDatabaseStats();
      console.log(`✅ FilesView: File removal completed`);
    } catch (error) {
      console.error('❌ FilesView: Failed to delete file:', error);
      alert('Failed to delete file');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (uploadedFile: UploadedFile) => {
    try {
      console.log(`⬇️ FilesView: Downloading file:`, {
        id: uploadedFile.id,
        name: uploadedFile.name,
        isBackendSynced: uploadedFile.isBackendSynced,
        backendFileId: uploadedFile.backendFileId,
        connectionStatus
      });

      if (uploadedFile.isBackendSynced && uploadedFile.backendFileId && connectionStatus === 'online') {
        console.log(`☁️ FilesView: Attempting backend download...`);
        try {
          const blob = await dataRoomAPI.downloadFile(uploadedFile.backendFileId);
          console.log(`✅ FilesView: Backend download successful, blob size: ${blob.size}`);
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = uploadedFile.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log(`✅ FilesView: Backend download completed`);
          return;
        } catch (backendError) {
          console.warn('⚠️ FilesView: Backend download failed, falling back to local:', backendError);
        }
      }
      
      // Fallback to IndexedDB
      console.log(`💾 FilesView: Attempting IndexedDB download...`);
      const storedFile = await dataRoomDB.getFile(uploadedFile.id);
      
      if (storedFile) {
        console.log(`✅ FilesView: Retrieved file from IndexedDB:`, {
          id: storedFile.id,
          name: storedFile.name,
          size: storedFile.size,
          fileDataSize: storedFile.fileData.byteLength
        });

        const file = dataRoomDB.createFileFromStored(storedFile);
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`✅ FilesView: IndexedDB download completed`);
      } else {
        console.error(`❌ FilesView: File not found in IndexedDB`);
      }
    } catch (error) {
      console.error('❌ FilesView: Failed to download file:', error);
      alert('Failed to download file');
    }
  };

  const assignToCategory = async (fileId: string, category: string) => {
    console.log(`🏷️ FilesView: Assigning category to file:`, { fileId, category });
    const subcategory = dataRoomAPI.getSubcategoryFromCategory(category);
    console.log(`🏷️ FilesView: Subcategory determined:`, subcategory);
    
    try {
      // Update IndexedDB
      console.log(`💾 FilesView: Updating category in IndexedDB...`);
      await dataRoomDB.updateFile(fileId, { category, subcategory });
      console.log(`✅ FilesView: Category updated in IndexedDB`);
      
      // Update local state
      onFileUpdate(fileId, { category, subcategory });
      
      await loadDatabaseStats();
      console.log(`✅ FilesView: Category assignment completed`);
    } catch (error) {
      console.error('❌ FilesView: Failed to update category:', error);
      alert('Failed to update category');
    }
  };

  const retryBackendSync = async (fileId: string) => {
    console.log(`🔄 FilesView: Retrying backend sync for file: ${fileId}`);
    const file = files.find(f => f.id === fileId);
    
    if (!file) {
      console.error(`❌ FilesView: File not found for retry sync: ${fileId}`);
      return;
    }
    
    if (connectionStatus !== 'online') {
      console.log(`📴 FilesView: Cannot retry sync - not online`);
      return;
    }

    try {
      setIsLoading(true);
      if (file) setCurrentProcessingFile(file.name);
      console.log(`☁️ FilesView: Attempting backend upload for retry...`);
      const apiResponse = await dataRoomAPI.uploadFile(file.file);
      console.log(`✅ FilesView: Retry backend upload successful:`, apiResponse);
      
      // Update file with backend info
      const updates = {
        id: apiResponse.file_id,
        backendFileId: apiResponse.file_id,
        isBackendSynced: true,
        aiProcessed: true,
        metadata: {
          ...file.metadata,
          backend_file_id: apiResponse.file_id,
          isBackendSynced: true,
          aiProcessed: true
        }
      };
      
      console.log(`🔄 FilesView: Updating file with backend info:`, updates);
      await dataRoomDB.updateFile(fileId, updates);
      onFileUpdate(fileId, updates);
      console.log(`✅ FilesView: Retry sync completed successfully`);
      
    } catch (error) {
      console.error('❌ FilesView: Retry sync failed:', error);
    } finally {
      setIsLoading(false);
      setCurrentProcessingFile(null);
    }
  };

  const getStatusIcon = (file: UploadedFile) => {
    if (file.isBackendSynced && file.aiProcessed) {
      return <Cloud className="h-3 w-3 text-green-500" />;
    } else if (file.isBackendSynced) {
      return <Wifi className="h-3 w-3 text-blue-500" />;
    } else {
      return <HardDrive className="h-3 w-3 text-orange-500" />;
    }
  };

  const categorizedCount = files.filter(f => f.category && f.category !== 'general').length;
  const uncategorizedCount = files.length - categorizedCount;
  const syncedCount = files.filter(f => f.isBackendSynced).length;

  return (
    <div className="space-y-6 p-4">
   

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
              {connectionStatus === 'online' ? 
                'Files will be processed by AI and stored locally' :
                'Files will be stored locally and synced when connection is restored'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-lg font-bold text-blue-600">{files.length}</div>
            <div className="text-sm text-gray-600">Total Files</div>
          </div>
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-lg font-bold text-green-600">{syncedCount}</div>
            <div className="text-sm text-gray-600">AI Processed</div>
          </div>
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-lg font-bold text-green-600">{categorizedCount}</div>
            <div className="text-sm text-gray-600">Categorized</div>
          </div>
          <div className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="text-lg font-bold text-orange-600">{files.length - syncedCount}</div>
            <div className="text-sm text-gray-600">Pending Sync</div>
          </div>
        </div>
      )}

      {/* Files List */}
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
              {files.map((file, index) => {
                console.log(`🎨 FilesView: Rendering file ${index + 1}/${files.length}:`, {
                  id: file.id,
                  name: file.name,
                  category: file.category,
                  isBackendSynced: file.isBackendSynced,
                  aiProcessed: file.aiProcessed,
                  metadataKeys: Object.keys(file.metadata || {})
                });

                return (
                  <li key={file.id} className="px-4 py-4 sm:px-6">
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
                                📁 {file.category} → {file.subcategory}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                              <span>Uploaded: {file.uploadDate.toLocaleDateString()}</span>
                              {file.isBackendSynced ? (
                                <span className="text-green-600">• AI Processed</span>
                              ) : (
                                <span className="text-orange-600">• Local Only</span>
                              )}
                              <button
                                onClick={() => {
                                  console.log(`📋 METADATA FOR ${file.name}:`, file.metadata);
                                  console.log(`📊 FILE DETAILS:`, {
                                    id: file.id,
                                    backendFileId: file.backendFileId,
                                    isBackendSynced: file.isBackendSynced,
                                    aiProcessed: file.aiProcessed,
                                    category: file.category,
                                    subcategory: file.subcategory
                                  });
                                }}
                                className="text-blue-500 hover:text-blue-700 underline"
                              >
                                View Metadata
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!file.isBackendSynced && connectionStatus === 'online' && (
                            <button
                              onClick={() => retryBackendSync(file.id)}
                              className="p-2 text-gray-400 hover:text-blue-600"
                              title="Sync with AI backend"
                              disabled={isLoading}
                            >
                              <RefreshCw className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => downloadFile(file)}
                            className="p-2 text-gray-400 hover:text-green-600"
                            title="Download file"
                            disabled={isLoading}
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-2 text-gray-400 hover:text-red-600"
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
                          onChange={(e) => {
                            const category = e.target.value;
                            console.log(`🏷️ FilesView: Category change requested:`, {
                              fileId: file.id,
                              fileName: file.name,
                              oldCategory: file.category,
                              newCategory: category
                            });
                            assignToCategory(file.id, category);
                          }}
                          disabled={isLoading}
                          className={`text-xs border rounded px-2 py-1 ${
                            !file.category || file.category === 'general' 
                              ? 'border-orange-300 bg-orange-50' 
                              : 'border-green-300 bg-green-50'
                          }`}
                        >
                          <option value="">Select Category</option>
                          <option value="financial">💰 Financial</option>
                          <option value="sales">📊 Sales</option>
                          <option value="inventory">📦 Inventory</option>
                          <option value="hr">👥 HR</option>
                          <option value="marketing">📢 Marketing</option>
                          <option value="legal">⚖️ Legal</option>
                          <option value="general">📁 General</option>
                        </select>
                        
                        {(!file.category || file.category === 'general') && (
                          <span className="text-xs text-orange-600">
                            ⚠️ Assign a category to view in Categories tab
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
          <div className="max-w-md mx-auto w-full mt-3">
            <div className="indeterminate-bar"></div>
          </div>
          {currentProcessingFile && (
            <p className="text-xs text-gray-500 mt-1">Current file: {currentProcessingFile}</p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            {connectionStatus === 'online' ? 'Processing files with AI...' : 'Processing files locally...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FilesView;
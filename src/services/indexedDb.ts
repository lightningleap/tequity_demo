// IndexedDB Service for DataRoom
export interface StoredFile {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadDate: Date;
    category?: string;
    subcategory?: string;
    metadata?: Record<string, any>;
    fileData: ArrayBuffer; // Store the actual file data
  }
  
  class DataRoomDB {
    private dbName = 'DataRoomDB';
    private version = 1;
    private db: IDBDatabase | null = null;
  
    async init(): Promise<void> {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);
  
        request.onerror = () => {
          reject(new Error('Failed to open database'));
        };
  
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };
  
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create files store
          if (!db.objectStoreNames.contains('files')) {
            const filesStore = db.createObjectStore('files', { keyPath: 'id' });
            filesStore.createIndex('category', 'category', { unique: false });
            filesStore.createIndex('uploadDate', 'uploadDate', { unique: false });
            filesStore.createIndex('name', 'name', { unique: false });
          }
  
          // Create metadata store for search indexing
          if (!db.objectStoreNames.contains('metadata')) {
            const metadataStore = db.createObjectStore('metadata', { keyPath: ['fileId', 'key'] });
            metadataStore.createIndex('value', 'value', { unique: false });
            metadataStore.createIndex('fileId', 'fileId', { unique: false });
          }
        };
      });
    }
  
    async saveFile(file: File, metadata: StoredFile): Promise<void> {
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise(async (resolve, reject) => {
        console.log('Starting transaction for file:', metadata.name);
        
        try {
          // Convert file to ArrayBuffer first (outside transaction)
          console.log('Converting file to ArrayBuffer...');
          const fileData = await file.arrayBuffer();
          console.log('File converted to ArrayBuffer, size:', fileData.byteLength, 'bytes');
          
          const storedFile: StoredFile = {
            ...metadata,
            fileData
          };
  
          // Now start the transaction with the data ready
          const transaction = this.db!.transaction(['files', 'metadata'], 'readwrite');
          const filesStore = transaction.objectStore('files');
          const metadataStore = transaction.objectStore('metadata');
  
          // Set up transaction event handlers
          transaction.onerror = (event) => {
            console.error('Transaction error:', (event.target as IDBRequest).error);
            reject(new Error('Transaction failed'));
          };
  
          transaction.oncomplete = () => {
            console.log('Transaction completed successfully');
            resolve();
          };
  
          transaction.onabort = () => {
            console.error('Transaction aborted');
            reject(new Error('Transaction aborted'));
          };
  
          // Save file to store
          console.log('Saving file to store...');
          const fileRequest = filesStore.put(storedFile);
          
          fileRequest.onsuccess = () => {
            console.log('File saved to store, now indexing metadata...');
            if (metadata.metadata) {
              try {
                this.indexMetadata(metadataStore, metadata.id, metadata.metadata);
                console.log('Metadata indexing completed');
              } catch (indexError) {
                console.error('Error indexing metadata:', indexError);
                // Don't reject here as the file was saved successfully
              }
            }
          };
  
          fileRequest.onerror = (event) => {
            console.error('Error saving file:', (event.target as IDBRequest).error);
            reject(new Error('Failed to save file'));
          };
  
        } catch (error) {
          console.error('Error in saveFile:', error);
          reject(error);
        }
      });
    }
  
    private indexMetadata(store: IDBObjectStore, fileId: string, metadata: Record<string, any>, prefix = ''): void {
      try {
        Object.entries(metadata).forEach(([key, value]) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Recursively index nested objects
            this.indexMetadata(store, fileId, value, fullKey);
          } else {
            try {
              // Index primitive values and arrays
              store.put({
                fileId,
                key: fullKey,
                value: Array.isArray(value) ? JSON.stringify(value) : String(value)
              });
            } catch (putError) {
              console.error(`Error indexing metadata key ${fullKey}:`, putError);
            }
          }
        });
      } catch (error) {
        console.error('Error in indexMetadata:', error);
        throw error;
      }
    }
  
    async getAllFiles(): Promise<StoredFile[]> {
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.getAll();
  
        request.onsuccess = () => {
          const files = request.result.map(file => ({
            ...file,
            uploadDate: new Date(file.uploadDate) // Convert back to Date object
          }));
          resolve(files);
        };
  
        request.onerror = () => {
          reject(new Error('Failed to retrieve files'));
        };
      });
    }
  
    async getFile(id: string): Promise<StoredFile | null> {
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.get(id);
  
        request.onsuccess = () => {
          const file = request.result;
          if (file) {
            file.uploadDate = new Date(file.uploadDate);
          }
          resolve(file || null);
        };
  
        request.onerror = () => {
          reject(new Error('Failed to retrieve file'));
        };
      });
    }
  
    async updateFile(id: string, updates: Partial<StoredFile>): Promise<void> {
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise(async (resolve, reject) => {
        try {
          const existingFile = await this.getFile(id);
          if (!existingFile) {
            reject(new Error('File not found'));
            return;
          }
  
          const updatedFile = { ...existingFile, ...updates };
          
          const transaction = this.db!.transaction(['files', 'metadata'], 'readwrite');
          const filesStore = transaction.objectStore('files');
          const metadataStore = transaction.objectStore('metadata');
  
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(new Error('Failed to update file'));
  
          // Update file
          const fileRequest = filesStore.put(updatedFile);
  
          fileRequest.onsuccess = () => {
            // Re-index metadata if it was updated
            if (updates.metadata) {
              // Clear old metadata indices first
              const metadataIndex = metadataStore.index('fileId');
              const metadataRequest = metadataIndex.getAll(id);
              
              metadataRequest.onsuccess = () => {
                const oldMetadata = metadataRequest.result;
                
                // Delete old metadata entries
                oldMetadata.forEach(item => {
                  metadataStore.delete([item.fileId, item.key]);
                });
                
                // Add new metadata indices
                try {
                  this.indexMetadata(metadataStore, id, updates.metadata!);
                } catch (indexError) {
                  console.error('Error re-indexing metadata:', indexError);
                }
              };
            }
          };
  
          fileRequest.onerror = () => reject(new Error('Failed to update file'));
  
        } catch (error) {
          reject(error);
        }
      });
    }
  
    async deleteFile(id: string): Promise<void> {
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['files', 'metadata'], 'readwrite');
        const filesStore = transaction.objectStore('files');
        const metadataStore = transaction.objectStore('metadata');
  
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Failed to delete file'));
  
        // Delete file
        const fileRequest = filesStore.delete(id);
  
        fileRequest.onsuccess = () => {
          // Delete metadata indices
          const metadataIndex = metadataStore.index('fileId');
          const metadataRequest = metadataIndex.getAll(id);
          
          metadataRequest.onsuccess = () => {
            const metadata = metadataRequest.result;
            metadata.forEach(item => {
              metadataStore.delete([item.fileId, item.key]);
            });
          };
        };
  
        fileRequest.onerror = () => reject(new Error('Failed to delete file'));
      });
    }
  
    async searchFiles(query: string): Promise<StoredFile[]> {
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['files', 'metadata'], 'readonly');
        const filesStore = transaction.objectStore('files');
        const metadataStore = transaction.objectStore('metadata');
        
        const matchingFileIds = new Set<string>();
        const searchLower = query.toLowerCase();
  
        // Search in file names
        const nameIndex = filesStore.index('name');
        const nameRequest = nameIndex.getAll();
        
        nameRequest.onsuccess = () => {
          const files = nameRequest.result;
          files.forEach(file => {
            if (file.name.toLowerCase().includes(searchLower)) {
              matchingFileIds.add(file.id);
            }
          });
  
          // Search in metadata
          const metadataIndex = metadataStore.index('value');
          const metadataRequest = metadataIndex.getAll();
          
          metadataRequest.onsuccess = () => {
            const metadata = metadataRequest.result;
            metadata.forEach(item => {
              if (item.value.toLowerCase().includes(searchLower)) {
                matchingFileIds.add(item.fileId);
              }
            });
  
            // Get all matching files
            const filePromises = Array.from(matchingFileIds).map(id => this.getFile(id));
            Promise.all(filePromises).then(files => {
              resolve(files.filter(file => file !== null) as StoredFile[]);
            }).catch(reject);
          };
  
          metadataRequest.onerror = () => reject(new Error('Search failed'));
        };
  
        nameRequest.onerror = () => reject(new Error('Search failed'));
      });
    }
  
    async getFilesByCategory(category: string): Promise<StoredFile[]> {
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const index = store.index('category');
        const request = index.getAll(category);
  
        request.onsuccess = () => {
          const files = request.result.map(file => ({
            ...file,
            uploadDate: new Date(file.uploadDate)
          }));
          resolve(files);
        };
  
        request.onerror = () => {
          reject(new Error('Failed to retrieve files by category'));
        };
      });
    }
  
    async exportData(): Promise<StoredFile[]> {
      return this.getAllFiles();
    }
  
    async importData(files: StoredFile[]): Promise<void> {
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['files', 'metadata'], 'readwrite');
        const filesStore = transaction.objectStore('files');
        const metadataStore = transaction.objectStore('metadata');
  
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Import failed'));
  
        let processedCount = 0;
        const totalFiles = files.length;
  
        if (totalFiles === 0) {
          resolve();
          return;
        }
  
        files.forEach((file, index) => {
          const fileRequest = filesStore.put(file);
          
          fileRequest.onsuccess = () => {
            if (file.metadata) {
              try {
                this.indexMetadata(metadataStore, file.id, file.metadata);
              } catch (indexError) {
                console.error('Error indexing metadata during import:', indexError);
              }
            }
            
            processedCount++;
            if (processedCount === totalFiles) {
              console.log('All files imported successfully');
            }
          };
  
          fileRequest.onerror = () => {
            console.error(`Failed to import file: ${file.name}`);
            processedCount++;
            if (processedCount === totalFiles) {
              console.log('Import completed with some errors');
            }
          };
        });
      });
    }
  
    async clearAll(): Promise<void> {
      if (!this.db) throw new Error('Database not initialized');
  
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['files', 'metadata'], 'readwrite');
        const filesStore = transaction.objectStore('files');
        const metadataStore = transaction.objectStore('metadata');
  
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Failed to clear database'));
  
        filesStore.clear();
        metadataStore.clear();
      });
    }
  
    // Convert StoredFile back to File object for download
    createFileFromStored(storedFile: StoredFile): File {
      const blob = new Blob([storedFile.fileData], { type: storedFile.type });
      return new File([blob], storedFile.name, {
        type: storedFile.type,
        lastModified: storedFile.uploadDate.getTime()
      });
    }
  
    // Get database statistics
    async getStats(): Promise<{
      totalFiles: number;
      totalSize: number;
      categoryCounts: Record<string, number>;
      oldestFile: Date | null;
      newestFile: Date | null;
    }> {
      const files = await this.getAllFiles();
      
      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        categoryCounts: {} as Record<string, number>,
        oldestFile: null as Date | null,
        newestFile: null as Date | null
      };
  
      if (files.length > 0) {
        // Calculate category counts
        files.forEach(file => {
          const category = file.category || 'Uncategorized';
          stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
        });
  
        // Find oldest and newest files
        const sortedByDate = files.sort((a, b) => a.uploadDate.getTime() - b.uploadDate.getTime());
        stats.oldestFile = sortedByDate[0].uploadDate;
        stats.newestFile = sortedByDate[sortedByDate.length - 1].uploadDate;
      }
  
      return stats;
    }
  }
  
  // Create singleton instance
  export const dataRoomDB = new DataRoomDB();
  
  // Initialize database when module loads
  dataRoomDB.init().catch(console.error);
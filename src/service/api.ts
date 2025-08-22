// services/dataRoomAPI.ts
export interface APIFileResponse {
  file_id: string;
  file_name: string;
  original_name: string;
  safe_name: string;
  category: string;
  num_records: number;
  num_sheets: number;
  file_size_bytes: number;
  download_url: string;
  point_ids: string[];
  ingestion_timestamp: string;
  last_accessed: string;
  status: string;
}

// Add this interface at the top with other interfaces
export interface APIDeleteResponse {
  message: string;
  file_id: string;
  file_name: string;
  deleted_records: number;
  timestamp: string;
}

export interface APIQuestionResponse {
  category: string;
  sources: Array<{
    file_id: string;
    file_name: string;
    download_url: string;
    category: string;
    chunk_point_id: string;
  }>;
  context: Array<{
    id: string;
    text: string;
    category: string;
    source_file: string;
    row_number: number;
    sheet_name?: string;
    score: number;
  }>;
  answer: string;
  timestamp: string;
}

export interface APIHealthResponse {
  status: string;
  directories: boolean;
  environment: boolean;
  files_count: number;
  timestamp: string;
}

class DataRoomAPIService {
  private baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  private isConnected = false;
  private lastHealthCheck = 0;
  private healthCheckInterval = 30000; // 30 seconds

  private log(action: string, details?: unknown, error = false) {
    const prefix = `[DataRoomAPI] ${action}`;
    if (error) {
      console.error(prefix, details);
    } else {
      console.log(prefix, details ?? '');
    }
  }

  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval && this.isConnected) {
      this.log('Health check skipped (cached)', { isConnected: this.isConnected });
      return this.isConnected;
    }

    try {
      this.log('Performing health check', { url: `${this.baseURL}/health` });
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { accept: 'application/json' }
      });

      this.isConnected = response.ok;
      this.lastHealthCheck = now;

      if (this.isConnected) {
        const healthData: APIHealthResponse = await response.json();
        this.log('Health check success', healthData);
      } else {
        this.log('Health check failed (bad response)', { status: response.status }, true);
      }

      return this.isConnected;
    } catch (error) {
      this.log('Health check failed (exception)', error, true);
      this.isConnected = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  async uploadFile(file: File): Promise<APIFileResponse> {
    this.log('Uploading file', { fileName: file.name, size: file.size });
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      throw new Error('Backend service is unavailable');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: { accept: 'application/json' },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.log('Upload failed', { status: response.status, errorText }, true);
      
      if (response.status === 409) {
        throw new Error(`A file with the name "${file.name}" already exists.`);
      } else if (response.status === 400) {
        throw new Error('Invalid file type or file too large (max 10MB)');
      } else {
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    this.log('Upload success', data);
    return data;
  }

  async askQuestion(question: string): Promise<APIQuestionResponse> {
    this.log('Asking question', { question });
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      throw new Error('Backend service is unavailable');
    }

    const response = await fetch(`${this.baseURL}/question`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.log('Question failed', { status: response.status, errorText }, true);
      throw new Error(`Question failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    this.log('Question answered', data);
    return data;
  }

  async getFiles(): Promise<APIFileResponse[]> {
    this.log('Fetching all files');
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      throw new Error('Backend service is unavailable');
    }

    const response = await fetch(`${this.baseURL}/files`, {
      method: 'GET',
      headers: { accept: 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.log('Get files failed', { status: response.status, errorText }, true);
      throw new Error(`Get files failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    this.log('Files fetched', { count: data.length });
    return data;
  }

  async getFileMetadata(fileId: string): Promise<APIFileResponse> {
    this.log('Fetching file metadata', { fileId });
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      throw new Error('Backend service is unavailable');
    }

    const response = await fetch(`${this.baseURL}/file/${fileId}`, {
      method: 'GET',
      headers: { accept: 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.log('Get file metadata failed', { status: response.status, errorText }, true);
      throw new Error(`Get file metadata failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    this.log('File metadata retrieved', data);
    return data;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    this.log('Downloading file', { fileId });
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      throw new Error('Backend service is unavailable');
    }

    const response = await fetch(`${this.baseURL}/download/${fileId}`, {
      method: 'GET',
      headers: { accept: 'application/octet-stream' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.log('Download failed', { status: response.status, errorText }, true);
      throw new Error(`Download failed: ${response.status} - ${errorText}`);
    }

    this.log('Download success', { fileId });
    return response.blob();
  }

  async getCategories(): Promise<string[]> {
    this.log('Fetching categories');
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      throw new Error('Backend service is unavailable');
    }

    const response = await fetch(`${this.baseURL}/categories`, {
      method: 'GET',
      headers: { accept: 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.log('Get categories failed', { status: response.status, errorText }, true);
      throw new Error(`Get categories failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    this.log('Categories fetched', { count: data.length });
    return data;
  }

  getConnectionStatus(): boolean {
    this.log('Connection status checked', { isConnected: this.isConnected });
    return this.isConnected;
  }

  // getSubcategoryFromCategory(category: string): string {
  //   const categoryMap: Record<string, string> = {
  //     financial: 'Financial Statements',
  //     sales: 'Sales Data',
  //     inventory: 'Inventory Management',
  //     hr: 'HR Documents',
  //     marketing: 'Marketing Materials',
  //     legal: 'Legal Documents',
  //     operations: 'Operational Data'
  //   };

  //   const subcategory = categoryMap[category.toLowerCase()] || 'General';
  //   this.log('Mapping category to subcategory', { category, subcategory });
  //   return subcategory;
  // }

  async deleteFile(fileId: string): Promise<APIDeleteResponse> {
    this.log('Deleting file', { fileId });
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      throw new Error('Backend service is unavailable');
    }
  
    const response = await fetch(`${this.baseURL}/delete/${fileId}`, {
      method: 'DELETE',
      headers: { accept: 'application/json' }
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      this.log('Delete failed', { status: response.status, errorText }, true);
      throw new Error(`Delete failed: ${response.status} - ${errorText}`);
    }
  
    const data = await response.json();
    this.log('File deleted', data);
    return data;
  }
}

export const dataRoomAPI = new DataRoomAPIService();

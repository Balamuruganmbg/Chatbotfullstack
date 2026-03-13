import { apiClient } from './api';
import { Document } from '../types';

export const documentService = {
  async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getDocuments(): Promise<Document[]> {
    return apiClient.get<Document[]>('/documents');
  },

  async deleteDocument(documentId: string): Promise<void> {
    return apiClient.delete(`/documents/${documentId}`);
  },
};

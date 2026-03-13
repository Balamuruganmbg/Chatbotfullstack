import { Response, NextFunction } from 'express';
import { documentService } from '../services/document.service';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class DocumentController {
  async uploadDocument(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }

      const document = await documentService.uploadDocument(userId, req.file);
      sendCreated(res, document, 'Document uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  async getDocuments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const documents = await documentService.getUserDocuments(userId);
      sendSuccess(res, documents, 'Documents retrieved');
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { documentId } = req.params;
      await documentService.deleteDocument(documentId, userId);
      sendSuccess(res, null, 'Document deleted');
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();

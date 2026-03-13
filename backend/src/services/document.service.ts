import path from 'path';
import fs from 'fs';
import { documentRepository } from '../repositories/document.repository';
import { IDocumentDocument } from '../models/Document';
import { extractText } from '../utils/documentParser';
import { logger } from '../utils/logger';

export class DocumentService {
  async uploadDocument(
    userId: string,
    file: Express.Multer.File
  ): Promise<IDocumentDocument> {
    // 1. Persist document record immediately (extractionStatus = 'pending')
    const document = await documentRepository.create({
      userId,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    // 2. Run text extraction in the background — do NOT block the HTTP response
    this._extractAndStore(document._id.toString(), file.path, file.mimetype, file.originalname);

    logger.info(`Document uploaded: ${file.originalname} by user ${userId}`);
    return document;
  }

  /**
   * Fire-and-forget extraction pipeline.
   * On success: saves extracted text + sets status = 'completed'.
   * On failure: logs error + sets status = 'failed'.
   */
  private async _extractAndStore(
    documentId: string,
    filePath: string,
    mimeType: string,
    originalName: string
  ): Promise<void> {
    try {
      const result = await extractText(filePath, mimeType);
      await documentRepository.updateExtractionResult(
        documentId,
        'completed',
        result.content,
        result.charCount
      );
      logger.info(`Extraction complete for "${originalName}": ${result.charCount} chars`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await documentRepository.updateExtractionResult(
        documentId,
        'failed',
        undefined,
        undefined,
        msg
      );
      logger.error(`Extraction failed for "${originalName}": ${msg}`);
    }
  }

  async getUserDocuments(userId: string): Promise<IDocumentDocument[]> {
    return documentRepository.findAllByUserId(userId);
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Verify ownership
    if (document.userId.toString() !== userId) {
      throw new Error('Unauthorized to delete this document');
    }

    // Remove physical file
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await documentRepository.deleteById(documentId);
    logger.info(`Document deleted: ${documentId}`);
  }
}

export const documentService = new DocumentService();

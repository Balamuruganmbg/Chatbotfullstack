import { DocumentModel, IDocumentDocument, ExtractionStatus } from '../models/Document';

export class DocumentRepository {
  async findById(documentId: string): Promise<IDocumentDocument | null> {
    return DocumentModel.findById(documentId).exec();
  }

  async findAllByUserId(userId: string): Promise<IDocumentDocument[]> {
    // Exclude raw content from list queries — content can be large
    return DocumentModel.find({ userId })
      .sort({ uploadedAt: -1 })
      .select('-__v -content')
      .exec();
  }

  /**
   * Fetch only the fields needed to build document context for chat.
   * Only returns documents with completed extraction.
   */
  async findContextByUserId(
    userId: string
  ): Promise<Array<{ originalName: string; content: string; extractionStatus: ExtractionStatus }>> {
    return DocumentModel.find({ userId, extractionStatus: 'completed' })
      .sort({ uploadedAt: -1 })
      .select('originalName content extractionStatus')
      .lean()
      .exec() as Promise<Array<{ originalName: string; content: string; extractionStatus: ExtractionStatus }>>;
  }

  async create(data: {
    userId: string;
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }): Promise<IDocumentDocument> {
    const doc = new DocumentModel(data);
    return doc.save();
  }

  async updateExtractionResult(
    documentId: string,
    status: ExtractionStatus,
    content?: string,
    charCount?: number,
    error?: string
  ): Promise<void> {
    await DocumentModel.updateOne(
      { _id: documentId },
      {
        extractionStatus: status,
        ...(content !== undefined && { content }),
        ...(charCount !== undefined && { charCount }),
        ...(error !== undefined && { extractionError: error }),
      }
    ).exec();
  }

  async deleteById(documentId: string): Promise<boolean> {
    const result = await DocumentModel.deleteOne({ _id: documentId });
    return result.deletedCount > 0;
  }
}

export const documentRepository = new DocumentRepository();

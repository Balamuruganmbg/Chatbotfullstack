import mongoose, { Document, Schema, Types } from 'mongoose';

export type ExtractionStatus = 'pending' | 'completed' | 'failed';

export interface IDocumentDocument extends Document {
  userId: Types.ObjectId;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  // RAG / document-aware chat fields
  content: string;
  charCount: number;
  extractionStatus: ExtractionStatus;
  extractionError?: string;
  uploadedAt: Date;
}

const DocumentSchema = new Schema<IDocumentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    // RAG fields ──────────────────────────────────────────────────────────────
    content: {
      type: String,
      default: '',
    },
    charCount: {
      type: Number,
      default: 0,
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    extractionError: {
      type: String,
    },
    // ─────────────────────────────────────────────────────────────────────────
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
  }
);

DocumentSchema.index({ userId: 1, uploadedAt: -1 });

export const DocumentModel = mongoose.model<IDocumentDocument>('Document', DocumentSchema);

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../../services/document.service';
import { formatFileSize, formatRelativeTime, getFileIcon } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';
import { ExtractionStatus } from '../../types';

const ACCEPTED_TYPES = '.pdf,.txt,.docx';

// Poll interval for pending documents (2 s) — refetch until extraction is done
const POLL_INTERVAL_MS = 2000;

const ExtractionBadge = ({ status, charCount }: { status: ExtractionStatus; charCount?: number }) => {
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-0.5 text-[9px] text-green-400 font-medium">
        <CheckCircle2 className="w-2.5 h-2.5" />
        {charCount ? `${(charCount / 1000).toFixed(1)}k chars` : 'Ready'}
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="flex items-center gap-0.5 text-[9px] text-destructive font-medium">
        <AlertCircle className="w-2.5 h-2.5" />
        Extract failed
      </span>
    );
  }
  // pending
  return (
    <span className="flex items-center gap-0.5 text-[9px] text-yellow-400 font-medium">
      <Clock className="w-2.5 h-2.5 animate-pulse" />
      Extracting…
    </span>
  );
};

export function DocumentUploader() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch documents — poll while any are still pending
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.getDocuments(),
    refetchInterval: (query) => {
      const hasPending = query.state.data?.some((d) => d.extractionStatus === 'pending');
      return hasPending ? POLL_INTERVAL_MS : false;
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentService.uploadDocument(file),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      showToast({
        title: 'Uploaded!',
        description: `${doc.originalName} uploaded successfully.`,
        variant: 'success',
      });
      setUploadError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      setUploadError(msg);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: () => {
      showToast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' });
    },
  });

  const handleFile = useCallback(
    (file: File) => {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError('File size must be under 10 MB');
        return;
      }
      setUploadError(null);
      uploadMutation.mutate(file);
    },
    [uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="px-1 pt-1 pb-2 space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-primary/60 bg-primary/10'
            : 'border-border/50 hover:border-primary/30 hover:bg-accent/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileInput}
          className="hidden"
        />
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Drop a file or <span className="text-primary">browse</span>
            </p>
            <p className="text-[10px] text-muted-foreground/60">PDF, TXT, DOCX · max 10 MB</p>
          </div>
        )}
      </div>

      {/* Error */}
      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 rounded-md px-2.5 py-1.5">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Document list */}
      {isLoading ? (
        <div className="space-y-1.5">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-8 rounded-md" />
          ))}
        </div>
      ) : (
        <AnimatePresence>
          {documents.map((doc) => (
            <motion.div
              key={doc._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8, height: 0 }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md group transition-colors ${
                doc.extractionStatus === 'completed'
                  ? 'bg-green-500/5 border border-green-500/10'
                  : doc.extractionStatus === 'failed'
                  ? 'bg-destructive/5 border border-destructive/10'
                  : 'bg-accent/30 border border-transparent'
              }`}
            >
              <span className="text-base leading-none flex-shrink-0">
                {getFileIcon(doc.mimeType)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{doc.originalName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(doc.fileSize)} · {formatRelativeTime(doc.uploadedAt)}
                  </p>
                  <ExtractionBadge
                    status={doc.extractionStatus || 'pending'}
                    charCount={doc.charCount}
                  />
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate(doc._id)}
                disabled={deleteMutation.isPending}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {!isLoading && documents.length === 0 && (
        <p className="text-[10px] text-muted-foreground/50 text-center py-1">
          No documents uploaded yet
        </p>
      )}
    </div>
  );
}

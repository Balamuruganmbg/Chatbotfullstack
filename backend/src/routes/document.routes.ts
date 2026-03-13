import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { validateMongoId } from '../middlewares/validation.middleware';

const router = Router();

router.use(authenticate);

// POST /documents/upload
router.post('/upload', uploadMiddleware.single('file'), (req, res, next) =>
  documentController.uploadDocument(req as any, res, next)
);

// GET /documents
router.get('/', (req, res, next) =>
  documentController.getDocuments(req as any, res, next)
);

// DELETE /documents/:documentId
router.delete('/:documentId', validateMongoId('documentId'), (req, res, next) =>
  documentController.deleteDocument(req as any, res, next)
);

export default router;

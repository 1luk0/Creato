import { Router } from 'express';
import { rag, search, searchByImage, searchMultimodal } from '../controllers/ragController.js';

const router = Router();

router.post('/rag',               rag);
router.post('/search',            search);
router.post('/search/image',      searchByImage);
router.post('/search/multimodal', searchMultimodal);

export default router;

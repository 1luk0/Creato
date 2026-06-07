import { Router } from 'express';
import { searchTranscripciones } from '../controllers/vectorTranscripcionesController.js';

const router = Router();
router.get('/search', searchTranscripciones);
export default router;

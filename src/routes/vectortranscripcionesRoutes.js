import { Router } from 'express';
import { searchTranscripciones, crearChunk } from '../controllers/vectorTranscripcionesController.js';

const router = Router();

router.get('/search', searchTranscripciones);
router.post('/',      crearChunk);

export default router;

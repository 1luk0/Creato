import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  searchTranscripciones,
  crearChunk,
  listarChunks,
  obtenerChunk,
  eliminarChunk
} from '../controllers/vectorTranscripcionesController.js';

const router = Router();

// /search debe declararse antes que /:id para no ser capturado como id.
router.get('/search', asyncHandler(searchTranscripciones));
router.get('/',       asyncHandler(listarChunks));
router.post('/',      asyncHandler(crearChunk));
router.get('/:id',    asyncHandler(obtenerChunk));
router.delete('/:id', asyncHandler(eliminarChunk));

export default router;

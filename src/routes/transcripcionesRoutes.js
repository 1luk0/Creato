import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  crearTranscripcion,
  listarTranscripciones,
  obtenerTranscripcion,
  actualizarTranscripcion,
  eliminarTranscripcion,
  agregarLinea
} from '../controllers/transcripcionesController.js';

const router = Router();

router.get('/',            asyncHandler(listarTranscripciones));
router.post('/',           asyncHandler(crearTranscripcion));
router.get('/:id',         asyncHandler(obtenerTranscripcion));
router.put('/:id',         asyncHandler(actualizarTranscripcion));
router.delete('/:id',      asyncHandler(eliminarTranscripcion));
router.post('/:id/lineas', asyncHandler(agregarLinea));

export default router;

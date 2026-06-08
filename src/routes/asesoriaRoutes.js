import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  crearAsesoria,
  listarAsesorias,
  obtenerAsesoria,
  actualizarAsesoria,
  asignarTranscripcion,
  eliminarAsesoria
} from '../controllers/asesoriaController.js';

const router = Router();

router.get('/',                   asyncHandler(listarAsesorias));
router.post('/',                  asyncHandler(crearAsesoria));
router.get('/:id',                asyncHandler(obtenerAsesoria));
router.put('/:id',                asyncHandler(actualizarAsesoria));
router.patch('/:id/transcripcion', asyncHandler(asignarTranscripcion));
router.delete('/:id',             asyncHandler(eliminarAsesoria));

export default router;

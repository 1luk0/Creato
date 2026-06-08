import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  crearEncargo,
  listarEncargos,
  obtenerEncargo,
  actualizarEncargo,
  cambiarEstadoEncargo,
  agregarEntrega,
  agregarRetroalimentacion,
  eliminarEncargo
} from '../controllers/encargoController.js';

const router = Router();

router.get('/',                        asyncHandler(listarEncargos));
router.post('/',                       asyncHandler(crearEncargo));
router.get('/:id',                     asyncHandler(obtenerEncargo));
router.put('/:id',                     asyncHandler(actualizarEncargo));
router.patch('/:id/estado',            asyncHandler(cambiarEstadoEncargo));
router.post('/:id/entregas',           asyncHandler(agregarEntrega));
router.post('/:id/retroalimentaciones', asyncHandler(agregarRetroalimentacion));
router.delete('/:id',                  asyncHandler(eliminarEncargo));

export default router;

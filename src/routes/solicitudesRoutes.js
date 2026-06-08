import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  crearSolicitud,
  listarSolicitudes,
  obtenerSolicitud,
  actualizarSolicitud,
  cambiarEstadoSolicitud,
  eliminarSolicitud
} from '../controllers/solicitudesController.js';

const router = Router();

router.get('/',             asyncHandler(listarSolicitudes));
router.post('/',            asyncHandler(crearSolicitud));
router.get('/:id',          asyncHandler(obtenerSolicitud));
router.put('/:id',          asyncHandler(actualizarSolicitud));
router.patch('/:id/estado', asyncHandler(cambiarEstadoSolicitud));
router.delete('/:id',       asyncHandler(eliminarSolicitud));

export default router;

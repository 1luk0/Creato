import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  crearOfertaAsesoria,
  listarOfertasAsesoria,
  obtenerOfertaAsesoria,
  actualizarOfertaAsesoria,
  eliminarOfertaAsesoria,
  agregarSolicitudPendiente,
  cambiarEstadoSolicitudPendiente,
} from '../controllers/ofertaAsesoriaController.js';

const router = Router();

router.post('/',                                    asyncHandler(crearOfertaAsesoria));
router.get('/',                                     asyncHandler(listarOfertasAsesoria));
router.get('/:id',                                  asyncHandler(obtenerOfertaAsesoria));
router.put('/:id',                                  asyncHandler(actualizarOfertaAsesoria));
router.delete('/:id',                               asyncHandler(eliminarOfertaAsesoria));
router.post('/:id/solicitudes',                     asyncHandler(agregarSolicitudPendiente));
router.patch('/:id/solicitudes/:solId/estado',      asyncHandler(cambiarEstadoSolicitudPendiente));

export default router;

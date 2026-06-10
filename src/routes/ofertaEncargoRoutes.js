import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  crearOfertaEncargo,
  listarOfertasEncargo,
  obtenerOfertaEncargo,
  actualizarOfertaEncargo,
  cambiarEstadoOfertaEncargo,
  revectorizarOfertaEncargo,
  eliminarOfertaEncargo,
  agregarPostulacion,
  cambiarEstadoPostulacion,
} from '../controllers/ofertaEncargoController.js';

const router = Router();

router.post('/',                                    asyncHandler(crearOfertaEncargo));
router.get('/',                                     asyncHandler(listarOfertasEncargo));
router.get('/:id',                                  asyncHandler(obtenerOfertaEncargo));
router.put('/:id',                                  asyncHandler(actualizarOfertaEncargo));
router.patch('/:id/estado',                         asyncHandler(cambiarEstadoOfertaEncargo));
router.patch('/:id/revectorizar',                   asyncHandler(revectorizarOfertaEncargo));
router.delete('/:id',                               asyncHandler(eliminarOfertaEncargo));
router.post('/:id/postulaciones',                   asyncHandler(agregarPostulacion));
router.patch('/:id/postulaciones/:postId/estado',   asyncHandler(cambiarEstadoPostulacion));

export default router;

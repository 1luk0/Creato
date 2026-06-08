import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  crearPago,
  listarPagos,
  obtenerPago,
  actualizarPago,
  cambiarEstadoPago,
  eliminarPago
} from '../controllers/pagosController.js';

const router = Router();

router.get('/',             asyncHandler(listarPagos));
router.post('/',            asyncHandler(crearPago));
router.get('/:id',          asyncHandler(obtenerPago));
router.put('/:id',          asyncHandler(actualizarPago));
router.patch('/:id/estado', asyncHandler(cambiarEstadoPago));
router.delete('/:id',       asyncHandler(eliminarPago));

export default router;

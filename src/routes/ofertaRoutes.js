import express from 'express';
import {
  obtenerOfertas,
  obtenerOfertaPorId,
  crearOferta,
  actualizarOferta,
  eliminarOferta,
} from '../controllers/ofertaController.js';

const router = express.Router();

router.get('/', obtenerOfertas);
router.get('/:id', obtenerOfertaPorId);
router.post('/', crearOferta);
router.put('/:id', actualizarOferta);
router.delete('/:id', eliminarOferta);

export default router;

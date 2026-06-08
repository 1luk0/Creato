import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  crearCurso,
  listarCursos,
  obtenerCurso,
  actualizarCurso,
  eliminarCurso,
  agregarCapitulo
} from '../controllers/cursosController.js';

const router = Router();

router.get('/',                asyncHandler(listarCursos));
router.post('/',               asyncHandler(crearCurso));
router.get('/:id',             asyncHandler(obtenerCurso));
router.put('/:id',             asyncHandler(actualizarCurso));
router.delete('/:id',          asyncHandler(eliminarCurso));
router.post('/:id/capitulos',  asyncHandler(agregarCapitulo));

export default router;

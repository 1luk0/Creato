import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  searchCursos,
  crearVectorCurso,
  listarVectorCursos,
  obtenerVectorCurso,
  eliminarVectorCurso
} from '../controllers/vectorCursosController.js';

const router = Router();

// /search debe declararse antes que /:id para no ser capturado como id.
router.get('/search', asyncHandler(searchCursos));
router.get('/',       asyncHandler(listarVectorCursos));
router.post('/',      asyncHandler(crearVectorCurso));
router.get('/:id',    asyncHandler(obtenerVectorCurso));
router.delete('/:id', asyncHandler(eliminarVectorCurso));

export default router;

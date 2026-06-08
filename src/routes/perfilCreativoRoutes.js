import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  crearPerfil,
  listarPerfiles,
  obtenerPerfil,
  obtenerPerfilPorUsuario,
  actualizarPerfil,
  eliminarPerfil,
} from '../controllers/perfilCreativoController.js';

const router = Router();

router.post('/',                 asyncHandler(crearPerfil));
router.get('/',                  asyncHandler(listarPerfiles));
router.get('/usuario/:userId',   asyncHandler(obtenerPerfilPorUsuario));
router.get('/:id',               asyncHandler(obtenerPerfil));
router.put('/:id',               asyncHandler(actualizarPerfil));
router.delete('/:id',            asyncHandler(eliminarPerfil));

export default router;

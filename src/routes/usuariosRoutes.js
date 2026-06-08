import { Router } from 'express';
import { crear, obtenerTodos, obtenerPorId, actualizar, eliminar } from '../controllers/usuariosController.js';

const router = Router();

router.post('/', crear);
router.get('/', obtenerTodos);
router.get('/:id', obtenerPorId);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

export default router;

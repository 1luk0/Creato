import { Router } from 'express';
import { crear, obtenerTodos, obtenerPorId, obtenerPorUsuario, actualizar, eliminar } from '../controllers/perfilEmpresaController.js';

const router = Router();

router.post('/', crear);
router.get('/', obtenerTodos);
router.get('/usuario/:userId', obtenerPorUsuario);
router.get('/:id', obtenerPorId);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

export default router;

import { Router } from 'express';
import { crear, obtenerTodos, obtenerPorId, actualizar, eliminar, postular } from '../controllers/ofertaLaboralController.js';

const router = Router();

router.post('/', crear);
router.get('/', obtenerTodos);
router.get('/:id', obtenerPorId);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);
router.post('/:id/postular', postular);

export default router;

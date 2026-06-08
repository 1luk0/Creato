import { Router } from 'express';
import { crear, obtenerPorTarget, obtenerPorId, agregarRespuesta, eliminarRespuesta, eliminar } from '../controllers/comentariosController.js';

const router = Router();

router.post('/', crear);
router.get('/', obtenerPorTarget);
router.get('/:id', obtenerPorId);
router.patch('/:id/respuestas', agregarRespuesta);
router.delete('/:id/respuestas/:indice', eliminarRespuesta);
router.delete('/:id', eliminar);

export default router;

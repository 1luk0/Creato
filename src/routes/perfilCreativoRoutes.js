import { Router } from 'express';
import { crearPerfil, obtenerPerfil } from '../controllers/perfilCreativoController.js';

const router = Router();

router.post('/',     crearPerfil);
router.get('/:id',   obtenerPerfil);

export default router;

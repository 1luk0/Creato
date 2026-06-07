import { Router } from 'express';
import { crearPublicacion, obtenerPublicacion } from '../controllers/publicacionesController.js';

const router = Router();

router.post('/',     crearPublicacion);
router.get('/:id',   obtenerPublicacion);

export default router;

import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { crearPerfil, obtenerPerfil } from '../controllers/perfilCreativoController.js';

const router = Router();

router.post('/',    asyncHandler(crearPerfil));
router.get('/:id',  asyncHandler(obtenerPerfil));

export default router;

import { Router } from 'express';
import { searchPerfil, crearVectorPerfil } from '../controllers/vectorPerfilCreativoController.js';

const router = Router();

router.get('/search', searchPerfil);
router.post('/',      crearVectorPerfil);

export default router;

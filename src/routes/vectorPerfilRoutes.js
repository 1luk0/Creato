import { Router } from 'express';
import { searchPerfil } from '../controllers/vectorPerfilCreativoController.js';

const router = Router();
router.get('/search', searchPerfil);
export default router;

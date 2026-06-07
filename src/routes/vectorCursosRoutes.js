import { Router } from 'express';
import { searchCursos } from '../controllers/vectorCursosController.js';

const router = Router();
router.get('/search', searchCursos);
export default router;

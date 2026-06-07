import { Router } from 'express';
import { searchCursos, crearVectorCurso } from '../controllers/vectorCursosController.js';

const router = Router();

router.get('/search', searchCursos);
router.post('/',      crearVectorCurso);

export default router;

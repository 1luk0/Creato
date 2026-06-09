import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getIngresosCreativos,
  getCreativosPorProfesion,
  getAuditoriaAsesorias,
  getTranscripcionesEstrategia,
  getBuscarCursosTranscripcion
} from '../controllers/consultasController.js';

const router = Router();

// AGGREGATION clásico
router.get('/ingresos-creativos',          asyncHandler(getIngresosCreativos));
router.get('/creativos-por-profesion',     asyncHandler(getCreativosPorProfesion));
router.get('/auditoria-asesorias',         asyncHandler(getAuditoriaAsesorias));

// CONSULTAS HÍBRIDAS
router.get('/transcripciones-estrategia',  asyncHandler(getTranscripcionesEstrategia));
router.get('/buscar-cursos-transcripcion', asyncHandler(getBuscarCursosTranscripcion));

export default router;

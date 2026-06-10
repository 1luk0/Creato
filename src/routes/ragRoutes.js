import { Router } from 'express';
import {
  rag,
  searchTranscripciones,
  searchCursos,
  searchCreativos,
  searchByImage,
  searchMultimodal,
  compararEstrategias,
  chunkingAnalysis,
} from '../controllers/ragController.js';

const router = Router();

router.post('/rag',                          rag);
router.post('/rag/comparar',                 compararEstrategias);
router.post('/rag/chunking-analysis',        chunkingAnalysis);
router.post('/search/transcripciones',       searchTranscripciones);
router.post('/search/cursos',                searchCursos);
router.post('/search/creativos',             searchCreativos);
router.post('/search/image',                 searchByImage);
router.post('/search/multimodal',            searchMultimodal);

export default router;

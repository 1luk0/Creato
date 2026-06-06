import express from 'express';
import {
  obtenerPerfilesCreativos,
  obtenerPerfilCreativoPorId,
  crearPerfilCreativo,
  actualizarPerfilCreativo,
  eliminarPerfilCreativo,
} from '../controllers/creativoController.js';

const router = express.Router();

router.get('/', obtenerPerfilesCreativos);
router.get('/:id', obtenerPerfilCreativoPorId);
router.post('/', crearPerfilCreativo);
router.put('/:id', actualizarPerfilCreativo);
router.delete('/:id', eliminarPerfilCreativo);

export default router;

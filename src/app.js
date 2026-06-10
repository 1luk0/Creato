import 'dotenv/config';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// RAG y búsqueda vectorial
import ragRoutes                 from './routes/ragRoutes.js';
import vectorTransRoutes         from './routes/vectortranscripcionesRoutes.js';
import vectorCursosRoutes        from './routes/vectorCursosRoutes.js';
import vectorPerfilRoutes        from './routes/vectorPerfilRoutes.js';
import vectorOfertaLaboralRoutes from './routes/vectorOfertaLaboralRoutes.js';

// Entidades con auto-vectorización
import publicacionesRoutes       from './routes/publicacionesRoutes.js';
import perfilCreativoRoutes      from './routes/perfilCreativoRoutes.js';
import creativoRoutes            from './routes/creativoRoutes.js';

// CRUD
import usuariosRoutes            from './routes/usuariosRoutes.js';
import perfilEmpresaRoutes       from './routes/perfilEmpresaRoutes.js';
import ofertaLaboralRoutes       from './routes/ofertaLaboralRoutes.js';
import ofertaAsesoriaRoutes      from './routes/ofertaAsesoriaRoutes.js';
import ofertaEncargoRoutes       from './routes/ofertaEncargoRoutes.js';
import comentariosRoutes         from './routes/comentariosRoutes.js';
import cursosRoutes              from './routes/cursosRoutes.js';
import transcripcionesRoutes     from './routes/transcripcionesRoutes.js';
import solicitudesRoutes         from './routes/solicitudesRoutes.js';
import pagosRoutes               from './routes/pagosRoutes.js';
import asesoriaRoutes            from './routes/asesoriaRoutes.js';
import encargoRoutes             from './routes/encargoRoutes.js';

// Middlewares
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

await connectDB();

app.use(express.json());

// Servir imágenes locales del dataset en /imagenes/<carpeta>/<archivo>
const IMG_DIR = join(__dirname, '..', 'data', 'Imagenes');
app.use('/imagenes', express.static(IMG_DIR));

// RAG y búsqueda vectorial
app.use('/api',                          ragRoutes);
app.use('/api/vector/transcripciones',   vectorTransRoutes);
app.use('/api/vector/cursos',            vectorCursosRoutes);
app.use('/api/vector/perfil',            vectorPerfilRoutes);
app.use('/api/vector/oferta-laboral',    vectorOfertaLaboralRoutes);

// Entidades con vectorización automática al crear
app.use('/api/publicaciones',            publicacionesRoutes);
app.use('/api/perfil-creativo',          perfilCreativoRoutes);
app.use('/api/creativos',               creativoRoutes);

// CRUD general
app.use('/api/usuarios',                 usuariosRoutes);
app.use('/api/perfil-empresa',           perfilEmpresaRoutes);
app.use('/api/oferta-laboral',           ofertaLaboralRoutes);
app.use('/api/oferta-asesoria',          ofertaAsesoriaRoutes);
app.use('/api/oferta-encargo',           ofertaEncargoRoutes);
app.use('/api/comentarios',              comentariosRoutes);
app.use('/api/cursos',                   cursosRoutes);
app.use('/api/transcripciones',          transcripcionesRoutes);
app.use('/api/solicitudes',              solicitudesRoutes);
app.use('/api/pagos',                    pagosRoutes);
app.use('/api/asesorias',                asesoriaRoutes);
app.use('/api/encargos',                 encargoRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: "online",
    message: "Backend de Agencia de Diseño y Sistema RAG activo 🚀",
    timestamp: new Date()
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Servidor HTTP corriendo en el puerto ${PORT}`);
});

export default app;

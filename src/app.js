// src/app.js
import 'dotenv/config'; // Inicializa las variables de entorno automáticamente
import express from 'express';
import connectDB from './config/db.js'; // Importación directa (asumiendo que usaste export default)


const app = express();

// Inicializar la conexión a Atlas (con el mismo nombre que importaste)
await connectDB(); 

// Middlewares estándar
app.use(express.json());

// Rutas RAG y búsqueda vectorial
import ragRoutes                 from './routes/ragRoutes.js';
import vectorTransRoutes         from './routes/vectortranscripcionesRoutes.js';
import vectorCursosRoutes        from './routes/vectorCursosRoutes.js';
import vectorPerfilRoutes        from './routes/vectorPerfilRoutes.js';

// Rutas de entidades con auto-vectorización
import publicacionesRoutes       from './routes/publicacionesRoutes.js';
import perfilCreativoRoutes      from './routes/perfilCreativoRoutes.js';

// Rutas del núcleo CRUD (colecciones de esta rama)
import cursosRoutes              from './routes/cursosRoutes.js';
import transcripcionesRoutes     from './routes/transcripcionesRoutes.js';
import solicitudesRoutes         from './routes/solicitudesRoutes.js';
import pagosRoutes               from './routes/pagosRoutes.js';
import asesoriaRoutes            from './routes/asesoriaRoutes.js';
import encargoRoutes             from './routes/encargoRoutes.js';

// Middleware central de errores y 404
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

app.use('/api',                          ragRoutes);
app.use('/api/vector/transcripciones',   vectorTransRoutes);
app.use('/api/vector/cursos',            vectorCursosRoutes);
app.use('/api/vector/perfil',            vectorPerfilRoutes);
app.use('/api/publicaciones',            publicacionesRoutes);
app.use('/api/perfil-creativo',          perfilCreativoRoutes);

app.use('/api/cursos',                   cursosRoutes);
app.use('/api/transcripciones',          transcripcionesRoutes);
app.use('/api/solicitudes',              solicitudesRoutes);
app.use('/api/pagos',                    pagosRoutes);
app.use('/api/asesorias',                asesoriaRoutes);
app.use('/api/encargos',                 encargoRoutes);

// Ruta base de prueba
app.get('/', (req, res) => {
  res.json({ 
    status: "online",
    message: "Backend de Agencia de Diseño y Sistema RAG activo 🚀",
    timestamp: new Date()
  });
});

// 404 para rutas no registradas (después de todas las rutas).
app.use(notFoundHandler);
// Manejador central de errores (siempre el último middleware).
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Servidor HTTP corriendo en el puerto ${PORT}`);
});

export default app;
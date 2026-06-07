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

app.use('/api',                          ragRoutes);
app.use('/api/vector/transcripciones',   vectorTransRoutes);
app.use('/api/vector/cursos',            vectorCursosRoutes);
app.use('/api/vector/perfil',            vectorPerfilRoutes);

// Ruta base de prueba
app.get('/', (req, res) => {
  res.json({ 
    status: "online",
    message: "Backend de Agencia de Diseño y Sistema RAG activo 🚀",
    timestamp: new Date()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Servidor HTTP corriendo en el puerto ${PORT}`);
});

export default app;
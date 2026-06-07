// src/app.js
import 'dotenv/config'; // Inicializa las variables de entorno automáticamente
import express from 'express';
import connectDB from './config/db.js'; // Importación directa (asumiendo que usaste export default)


const app = express();

// Inicializar la conexión a Atlas (con el mismo nombre que importaste)
await connectDB(); 

// Middlewares estándar
app.use(express.json());

// TODO: Vincular las rutas cuando los controladores estén listos
// app.use('/api/usuarios', usuarioRoutes);
// app.use('/api/creativos', creativoRoutes);
// app.use('/api/ofertas', ofertaRoutes);

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
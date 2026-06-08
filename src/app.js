import 'dotenv/config';
import express from 'express';
import connectDB from './config/db.js';

import usuariosRoutes from './routes/usuariosRoutes.js';
import perfilCreativoRoutes from './routes/perfilCreativoRoutes.js';
import perfilEmpresaRoutes from './routes/perfilEmpresaRoutes.js';
import ofertaLaboralRoutes from './routes/ofertaLaboralRoutes.js';
import comentariosRoutes from './routes/comentariosRoutes.js';
import vectorPerfilRoutes from './routes/vectorPerfilRoutes.js';
import vectorOfertaLaboralRoutes from './routes/vectorOfertaLaboralRoutes.js';

const app = express();

await connectDB();

app.use(express.json());

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/perfil-creativo', perfilCreativoRoutes);
app.use('/api/perfil-empresa', perfilEmpresaRoutes);
app.use('/api/oferta-laboral', ofertaLaboralRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/vector-perfil-creativo', vectorPerfilRoutes);
app.use('/api/vector-oferta-laboral', vectorOfertaLaboralRoutes);

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

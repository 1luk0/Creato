import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import creativoRoutes from './routes/creativoRoutes.js';
import ofertaRoutes from './routes/ofertaRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/creativos', creativoRoutes);
app.use('/api/ofertas', ofertaRoutes);

app.get('/', (req, res) => {
  res.send('Kreato Backend API está en línea');
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
};

startServer();

export default app;

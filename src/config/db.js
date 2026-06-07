// src/config/db.js
import mongoose from 'mongoose';

const conectarDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error("La variable de entorno MONGODB_URI no está definida.");
    }

    // Eventos de monitoreo de la conexión (Mejor práctica actual)
    mongoose.connection.on('connected', () => {
      console.log(' Mongoose conectado a MongoDB Atlas.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ Error en la conexión de Mongoose: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log(' Mongoose se ha desconectado.');
    });

    // Conexión limpia nativa de las versiones vigentes de Mongoose
    const conn = await mongoose.connect(uri);

    console.log(`==================================================`);
    console.log(` Conexión Exitosa a MongoDB Atlas`);
    console.log(` Host: ${conn.connection.host}`);
    console.log(` Base de Datos Activa: ${conn.connection.name}`);
    console.log(`==================================================`);

  } catch (error) {
    console.error(`❌ Error crítico al inicializar la base de datos: ${error.message}`);
    process.exit(1); 
  }
};

// Capturar el cierre de la aplicación para limpiar conexiones abiertas de forma ordenada
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log(' Conexión a MongoDB cerrada debido a la finalización de la app.');
  process.exit(0);
});

export default conectarDB;
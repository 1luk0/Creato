import 'dotenv/config';
import mongoose from 'mongoose';
import {
  getIngresosCreativos,
  getCreativosPorProfesion,
  getAuditoriaAsesorias,
  getTranscripcionesEstrategia,
  getBuscarCursosTranscripcion
} from '../src/controllers/consultasController.js';

async function main() {
  console.log('🔌 Conectando a MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conexión establecida.\n');

  const runTest = async (nombre, fn, queryParams = {}) => {
    console.log(`=========================================`);
    console.log(`🧪 TEST: ${nombre}`);
    console.log(`🔌 Parámetros de consulta:`, JSON.stringify(queryParams));
    console.log(`=========================================`);
    
    const req = { query: queryParams };
    let jsonOutput = null;
    const res = {
      json: (data) => {
        jsonOutput = data;
      }
    };

    try {
      await fn(req, res);
      console.log(JSON.stringify(jsonOutput, null, 2));
    } catch (error) {
      console.error(`❌ Error al ejecutar ${nombre}:`, error);
    }
    console.log('\n');
  };

  // 1. Aggregations
  await runTest('1. Ingresos por Creativo (Cursos)', getIngresosCreativos);
  await runTest('2. Creativos por Profesión', getCreativosPorProfesion);
  await runTest('3. Auditoría de Asesorías', getAuditoriaAsesorias);

  // 2. Hybrid searches
  await runTest('4. Búsqueda Híbrida con Filtro de Estrategia', getTranscripcionesEstrategia, {
    query: 'luz ambiental',
    estrategia: 'semantic_split_v1',
    limit: 2
  });
  
  await runTest('5. Búsqueda Híbrida con Filtros de Presupuesto/Categoría', getBuscarCursosTranscripcion, {
    query: 'modos de fusion para brillos',
    maxPrecio: 100,
    categoria: 'Pintura Digital',
    limit: 2
  });

  await mongoose.disconnect();
  console.log('🔌 Desconectado de MongoDB.');
}

main().catch(console.error);

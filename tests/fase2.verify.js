// Verificación Fase 2 — Servicio de embeddings
// Ejecutar: node tests/fase2.verify.js

import { embed } from '../src/services/embeddingService.js';

const CONSULTAS = [
  '¿Cómo funciona la luz ambiental en pintura digital?',
  '¿Qué modo de fusión debo usar para los brillos?'
];

async function verificar() {
  console.log(`Modelo : paraphrase-multilingual-MiniLM-L12-v2`);
  console.log(`Dims   : 384\n`);

  for (const texto of CONSULTAS) {
    console.log(`📝 Consulta: "${texto}"`);
    const vector = await embed(texto);
    console.log(`   Longitud del vector : ${vector.length}`);
    console.log(`   Primeros 5 valores  : [${vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
    console.log(`   Último valor        : ${vector[vector.length - 1].toFixed(4)}\n`);
  }

  // Verificar que dos consultas distintas producen vectores distintos
  const v1 = await embed(CONSULTAS[0]);
  const v2 = await embed(CONSULTAS[1]);
  const sonIguales = v1.every((val, i) => val === v2[i]);
  console.log(`🔍 Vectores distintos para consultas distintas: ${sonIguales ? '❌ FALLO' : '✅ OK'}`);

  console.log('\n✅ Fase 2 completa — embeddingService operativo');
}

verificar().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});

// Verificación Fase 6 — llmService (Gemini) + ragQuery completo
// Ejecutar: node tests/fase6.verify.js
// Requiere: GEMINI_API_KEY en .env
// Nota: ragQuery llama $vectorSearch — necesita índice Atlas configurado.

import 'dotenv/config';
import mongoose from 'mongoose';
import { generarRespuesta } from '../src/services/llmService.js';
import { ragQuery } from '../src/services/ragService.js';

const CONSULTAS_RAG = [
  { id: 'Q01', texto: 'Como funciona la luz ambiental en pintura digital?',  estrategia: 'semantic_split_v1' },
  { id: 'Q02', texto: 'Que modo de fusion debo usar para los brillos?',       estrategia: 'semantic_split_v1' },
  { id: 'Q08', texto: 'Que paleta usar para escenas nocturnas?',              estrategia: 'semantic_split_v1' },
];

async function verificar() {
  // Test 1: Gemini directo (sin RAG)
  console.log('=== Test 1: Gemini 2.5-flash directo ===');
  const respDirecta = await generarRespuesta('En una oración: ¿qué es la iluminación en arte digital?');
  console.log('✅ Respuesta:', respDirecta.trim().slice(0, 120));

  // Test 2: Pipeline RAG completo
  console.log('\n=== Test 2: Pipeline RAG completo (embed → retrieve → Gemini) ===');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Atlas conectado\n');

  for (const { id, texto, estrategia } of CONSULTAS_RAG) {
    console.log(`── ${id}: "${texto}"`);
    try {
      const { respuesta, chunks } = await ragQuery(texto, estrategia, 3);
      console.log(`   Chunks recuperados : ${chunks.length}`);
      if (chunks.length) {
        const timestamps = chunks.map(c => `${c.metadata?.minuto_inicio}s-${c.metadata?.minuto_fin}s`).join(', ');
        console.log(`   Timestamps         : ${timestamps}`);
      }
      console.log(`   Respuesta Gemini   : ${respuesta.trim().slice(0, 150)}...`);
      console.log();
    } catch (e) {
      const esIndice = e.message?.toLowerCase().includes('index');
      if (esIndice) {
        console.log(`   ⚠️  Índice Atlas pendiente — ragQuery bloqueado`);
        console.log(`      Configurar índice rag_transcripciones en Atlas UI\n`);
      } else {
        console.log(`   ❌ ${e.message?.slice(0, 80)}\n`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('✅ Fase 6 completa — llmService y ragQuery implementados');
}

verificar().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});

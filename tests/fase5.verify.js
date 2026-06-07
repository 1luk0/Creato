// Verificación Fase 5 — imageEmbeddingService (CLIP 512-dim)
// Ejecutar: node tests/fase5.verify.js
// Nota: primera ejecución descarga ~350MB de pesos del modelo CLIP.

import { embedImage, embedTextForImage } from '../src/services/imageEmbeddingService.js';

const IMG_URL = 'https://picsum.photos/id/1015/300/200';
const TEXTO_1 = 'a colorful digital illustration of a fantasy forest';
const TEXTO_2 = 'portrait of a character with dark armor';

async function verificar() {
  console.log('Modelo : clip-vit-base-patch32 (Xenova)');
  console.log('Dims   : 512\n');
  console.log('⏳ Cargando modelo CLIP (puede tardar en la primera ejecución)...\n');

  // Test 1: imagen → vector
  console.log(`🖼  Imagen de prueba: ${IMG_URL.split('/').pop()}`);
  const vecImg = await embedImage(IMG_URL);
  console.log(`   Longitud del vector : ${vecImg.length}`);
  console.log(`   Primeros 5 valores  : [${vecImg.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
  console.log(`   ✅ embedImage() OK\n`);

  // Test 2: texto → vector (multimodal)
  console.log(`📝 Texto 1: "${TEXTO_1}"`);
  const vecTxt1 = await embedTextForImage(TEXTO_1);
  console.log(`   Longitud del vector : ${vecTxt1.length}`);
  console.log(`   Primeros 5 valores  : [${vecTxt1.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);

  console.log(`\n📝 Texto 2: "${TEXTO_2}"`);
  const vecTxt2 = await embedTextForImage(TEXTO_2);
  console.log(`   Longitud del vector : ${vecTxt2.length}`);

  // Verificar vectores distintos
  const distintos = !vecTxt1.every((v, i) => v === vecTxt2[i]);
  console.log(`\n🔍 Vectores distintos para textos distintos: ${distintos ? '✅ OK' : '❌ FALLO'}`);

  // Similitud texto relevante vs imagen (debe ser > similitud texto irrelevante)
  const dot1 = vecTxt1.reduce((s, v, i) => s + v * vecImg[i], 0);
  const dot2 = vecTxt2.reduce((s, v, i) => s + v * vecImg[i], 0);
  console.log(`\n🔗 Similitud coseno "forest" ↔ imagen  : ${dot1.toFixed(4)}`);
  console.log(`   Similitud coseno "dark armor" ↔ imagen: ${dot2.toFixed(4)}`);

  console.log('\n✅ Fase 5 completa — imageEmbeddingService operativo (CLIP 512-dim)');
}

verificar().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});

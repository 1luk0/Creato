import { embedBatch } from './embeddingService.js';

function mmssASegundos(mmss) {
  const [mm, ss] = mmss.split(':').map(Number);
  return mm * 60 + ss;
}

function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Divide lineas[] en chunks de ~chunkSize palabras con solapamiento de ~overlap palabras.
export function fixedSizeChunks(lineas, opts = {}) {
  const { chunkSize = 256, overlap = 32 } = opts;
  if (!lineas?.length) return [];

  const wordCounts = lineas.map(l =>
    l.texto.trim().split(/\s+/).filter(Boolean).length
  );

  const chunks = [];
  let startIdx = 0;

  while (startIdx < lineas.length) {
    let totalWords = 0;
    let endIdx = startIdx;

    while (endIdx < lineas.length && totalWords < chunkSize) {
      totalWords += wordCounts[endIdx];
      endIdx++;
    }

    const slice = lineas.slice(startIdx, endIdx);
    if (!slice.length) break;

    chunks.push({
      contenido:      slice.map(l => l.texto).join(' '),
      minuto_inicio:  mmssASegundos(slice[0].minuto),
      minuto_fin:     mmssASegundos(slice[slice.length - 1].minuto),
      chunk_index:    chunks.length
    });

    // Retroceder ~overlap palabras para calcular el próximo startIdx
    let overlapWords = 0;
    let overlapIdx   = endIdx - 1;
    while (overlapIdx > startIdx && overlapWords < overlap) {
      overlapWords += wordCounts[overlapIdx];
      overlapIdx--;
    }

    startIdx = Math.max(startIdx + 1, overlapIdx + 1);
  }

  return chunks;
}

// Divide lineas[] en ventanas de maxOraciones líneas con solapamiento de 1 línea.
export function sentenceWindowChunks(lineas, opts = {}) {
  const { maxOraciones = 5, overlap = 1 } = opts;
  if (!lineas?.length) return [];

  const step   = Math.max(1, maxOraciones - overlap);
  const chunks = [];

  for (let i = 0; i < lineas.length; i += step) {
    const slice = lineas.slice(i, i + maxOraciones);
    chunks.push({
      contenido:     slice.map(l => l.texto).join(' '),
      minuto_inicio: mmssASegundos(slice[0].minuto),
      minuto_fin:    mmssASegundos(slice[slice.length - 1].minuto),
      chunk_index:   chunks.length
    });
  }

  return chunks;
}

// Agrupa líneas por similitud semántica: divide cuando la similitud coseno
// entre líneas consecutivas cae por debajo del umbral.
export async function semanticChunks(lineas, opts = {}) {
  const { umbral = 0.80 } = opts;
  if (!lineas?.length) return [];

  if (lineas.length === 1) {
    return [{
      contenido:     lineas[0].texto,
      minuto_inicio: mmssASegundos(lineas[0].minuto),
      minuto_fin:    mmssASegundos(lineas[0].minuto),
      chunk_index:   0
    }];
  }

  // Una sola llamada batch para obtener todos los vectores de línea
  const vectores = await embedBatch(lineas.map(l => l.texto));

  const chunks   = [];
  let blockStart = 0;

  for (let i = 0; i < lineas.length - 1; i++) {
    const sim = cosineSim(vectores[i], vectores[i + 1]);
    if (sim < umbral) {
      const block = lineas.slice(blockStart, i + 1);
      chunks.push({
        contenido:     block.map(l => l.texto).join(' '),
        minuto_inicio: mmssASegundos(block[0].minuto),
        minuto_fin:    mmssASegundos(block[block.length - 1].minuto),
        chunk_index:   chunks.length
      });
      blockStart = i + 1;
    }
  }

  // Último bloque
  const lastBlock = lineas.slice(blockStart);
  if (lastBlock.length) {
    chunks.push({
      contenido:     lastBlock.map(l => l.texto).join(' '),
      minuto_inicio: mmssASegundos(lastBlock[0].minuto),
      minuto_fin:    mmssASegundos(lastBlock[lastBlock.length - 1].minuto),
      chunk_index:   chunks.length
    });
  }

  return chunks;
}

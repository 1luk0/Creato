import 'dotenv/config';

const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const HF_URL   = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`;
const DIMS     = 384;

async function llamarHF(texto, intento = 1) {
  console.log(`[embeddingService] → HuggingFace API (intento ${intento})`);
  console.log(`[embeddingService]   modelo : ${HF_MODEL}`);
  console.log(`[embeddingService]   texto  : "${texto.slice(0, 60)}${texto.length > 60 ? '...' : ''}"`);

  const res = await fetch(HF_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({ inputs: texto })
  });

  console.log(`[embeddingService]   HTTP status: ${res.status}`);

  if (res.status === 503 && intento === 1) {
    const { estimated_time } = await res.json();
    const espera = Math.ceil((estimated_time ?? 20) * 1000);
    console.log(`[embeddingService] ⏳ Modelo cargando — reintentando en ${espera / 1000}s...`);
    await new Promise(r => setTimeout(r, espera));
    return llamarHF(texto, 2);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HF API ${res.status}: ${body}`);
  }

  return res.json();
}

export async function embed(texto) {
  if (!texto || typeof texto !== 'string' || texto.trim() === '') {
    throw new Error('embed() requiere un texto no vacío');
  }

  console.log(`[embeddingService] embed() llamado`);
  const data = await llamarHF(texto.trim());

  const vector = Array.isArray(data[0]) ? data[0] : data;

  if (vector.length !== DIMS) {
    throw new Error(`Vector inválido: se esperaban ${DIMS} dims, se recibieron ${vector.length}`);
  }

  console.log(`[embeddingService] ✅ vector generado — ${vector.length} dims | primeros 3: [${vector.slice(0, 3).map(v => v.toFixed(4)).join(', ')}]`);
  return vector;
}

// Envía N textos en una sola llamada a HF y devuelve un array de vectores.
export async function embedBatch(textos) {
  if (!Array.isArray(textos) || textos.length === 0) {
    throw new Error('embedBatch() requiere un array no vacío');
  }

  const limpios = textos.map(t => (t ?? '').trim()).filter(Boolean);
  if (limpios.length === 0) throw new Error('embedBatch() todos los textos son vacíos');

  console.log(`[embeddingService] embedBatch() — ${limpios.length} textos`);

  const res = await fetch(HF_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({ inputs: limpios })
  });

  if (res.status === 503) {
    const { estimated_time } = await res.json();
    const espera = Math.ceil((estimated_time ?? 20) * 1000);
    console.log(`[embeddingService] ⏳ Modelo cargando — reintentando batch en ${espera / 1000}s...`);
    await new Promise(r => setTimeout(r, espera));
    return embedBatch(textos);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HF API batch ${res.status}: ${body}`);
  }

  const data = await res.json();
  // La API devuelve [[vec1], [vec2], ...] o [vec1, vec2, ...]
  const vectores = data.map(item => Array.isArray(item[0]) ? item[0] : item);

  console.log(`[embeddingService] ✅ embedBatch — ${vectores.length} vectores de ${vectores[0]?.length} dims`);
  return vectores;
}

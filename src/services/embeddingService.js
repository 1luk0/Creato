import 'dotenv/config';

const HF_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';
const HF_URL   = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`;
const DIMS     = 384;

// Reintento único si el modelo está cargando (HTTP 503 con estimated_time)
async function llamarHF(texto, intento = 1) {
  const res = await fetch(HF_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({ inputs: texto })
  });

  if (res.status === 503 && intento === 1) {
    const { estimated_time } = await res.json();
    const espera = Math.ceil((estimated_time ?? 20) * 1000);
    console.log(`⏳ Modelo cargando en HF — reintentando en ${espera / 1000}s...`);
    await new Promise(r => setTimeout(r, espera));
    return llamarHF(texto, 2);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HF API ${res.status}: ${body}`);
  }

  return res.json();
}

/**
 * Genera el embedding de un texto usando paraphrase-multilingual-MiniLM-L12-v2.
 * @param {string} texto
 * @returns {Promise<number[]>} Vector de 384 dimensiones
 */
export async function embed(texto) {
  if (!texto || typeof texto !== 'string' || texto.trim() === '') {
    throw new Error('embed() requiere un texto no vacío');
  }

  const data = await llamarHF(texto.trim());

  // La API devuelve [[n1, n2, ...]] — array anidado de un solo elemento
  const vector = Array.isArray(data[0]) ? data[0] : data;

  if (vector.length !== DIMS) {
    throw new Error(`Vector inválido: se esperaban ${DIMS} dims, se recibieron ${vector.length}`);
  }

  return vector;
}

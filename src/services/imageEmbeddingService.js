import {
  CLIPTextModelWithProjection,
  CLIPVisionModelWithProjection,
  AutoTokenizer,
  AutoProcessor,
  RawImage
} from '@huggingface/transformers';

const MODEL_ID = 'Xenova/clip-vit-base-patch32';
const DIMS = 512;

let tokenizer   = null;
let processor   = null;
let textModel   = null;
let visionModel = null;

async function cargar() {
  if (!textModel) {
    console.log('[imageEmbeddingService] ⏳ Cargando modelos CLIP (primera vez ~350MB)...');
    [tokenizer, processor, textModel, visionModel] = await Promise.all([
      AutoTokenizer.from_pretrained(MODEL_ID),
      AutoProcessor.from_pretrained(MODEL_ID),
      CLIPTextModelWithProjection.from_pretrained(MODEL_ID),
      CLIPVisionModelWithProjection.from_pretrained(MODEL_ID),
    ]);
    console.log('[imageEmbeddingService] ✅ Modelos CLIP cargados en memoria');
  } else {
    console.log('[imageEmbeddingService] ✅ Modelos CLIP ya en memoria (cache)');
  }
}

export async function embedImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('embedImage() requiere una URL de imagen válida');
  }
  console.log(`[imageEmbeddingService] embedImage() llamado`);
  console.log(`[imageEmbeddingService]   url: ${imageUrl}`);

  await cargar();

  console.log(`[imageEmbeddingService]   descargando imagen...`);
  const image  = await RawImage.fromURL(imageUrl);
  console.log(`[imageEmbeddingService]   imagen descargada: ${image.width}x${image.height}`);

  const inputs = await processor([image]);
  const output = await visionModel(inputs);
  const vector = Array.from(output.image_embeds.data);

  if (vector.length !== DIMS) {
    throw new Error(`CLIP inválido: se esperaban ${DIMS} dims, se recibieron ${vector.length}`);
  }

  console.log(`[imageEmbeddingService] ✅ vector imagen — ${vector.length} dims | primeros 3: [${vector.slice(0, 3).map(v => v.toFixed(4)).join(', ')}]`);
  return vector;
}

export async function embedTextForImage(texto) {
  if (!texto || typeof texto !== 'string' || texto.trim() === '') {
    throw new Error('embedTextForImage() requiere un texto no vacío');
  }
  console.log(`[imageEmbeddingService] embedTextForImage() llamado`);
  console.log(`[imageEmbeddingService]   texto: "${texto.slice(0, 60)}${texto.length > 60 ? '...' : ''}"`);

  await cargar();

  const inputs = await tokenizer([texto.trim()], { padding: true, truncation: true });
  const output = await textModel(inputs);
  const vector = Array.from(output.text_embeds.data);

  if (vector.length !== DIMS) {
    throw new Error(`CLIP inválido: se esperaban ${DIMS} dims, se recibieron ${vector.length}`);
  }

  console.log(`[imageEmbeddingService] ✅ vector texto→imagen — ${vector.length} dims | primeros 3: [${vector.slice(0, 3).map(v => v.toFixed(4)).join(', ')}]`);
  return vector;
}

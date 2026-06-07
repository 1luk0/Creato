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
    [tokenizer, processor, textModel, visionModel] = await Promise.all([
      AutoTokenizer.from_pretrained(MODEL_ID),
      AutoProcessor.from_pretrained(MODEL_ID),
      CLIPTextModelWithProjection.from_pretrained(MODEL_ID),
      CLIPVisionModelWithProjection.from_pretrained(MODEL_ID),
    ]);
  }
}

/**
 * Genera el embedding CLIP de una URL de imagen (imagen → espacio visual).
 * Usar para búsquedas imagen-a-imagen.
 * @param {string} imageUrl  URL pública de la imagen
 * @returns {Promise<number[]>} Vector de 512 dimensiones
 */
export async function embedImage(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('embedImage() requiere una URL de imagen válida');
  }
  await cargar();
  const image  = await RawImage.fromURL(imageUrl);
  const inputs = await processor([image]);
  const output = await visionModel(inputs);
  const vector = Array.from(output.image_embeds.data);
  if (vector.length !== DIMS) {
    throw new Error(`CLIP inválido: se esperaban ${DIMS} dims, se recibieron ${vector.length}`);
  }
  return vector;
}

/**
 * Genera el embedding CLIP de un texto (texto → espacio visual compartido con imágenes).
 * Usar para búsquedas texto-a-imagen (multimodal).
 * @param {string} texto  Descripción de la imagen buscada
 * @returns {Promise<number[]>} Vector de 512 dimensiones
 */
export async function embedTextForImage(texto) {
  if (!texto || typeof texto !== 'string' || texto.trim() === '') {
    throw new Error('embedTextForImage() requiere un texto no vacío');
  }
  await cargar();
  const inputs = await tokenizer([texto.trim()], { padding: true, truncation: true });
  const output = await textModel(inputs);
  const vector = Array.from(output.text_embeds.data);
  if (vector.length !== DIMS) {
    throw new Error(`CLIP inválido: se esperaban ${DIMS} dims, se recibieron ${vector.length}`);
  }
  return vector;
}

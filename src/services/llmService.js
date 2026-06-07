import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Envía un prompt a Gemini 2.5-flash y devuelve la respuesta como string.
 * Scope: solo se llama desde ragService.ragQuery() (transcripciones).
 * @param {string} prompt  Prompt completo con contexto de chunks
 * @returns {Promise<string>} Respuesta generada
 */
export async function generarRespuesta(prompt) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('generarRespuesta() requiere un prompt no vacío');
  }
  const result = await model.generateContent(prompt);
  return result.response.text();
}

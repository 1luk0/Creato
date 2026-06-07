import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function generarRespuesta(prompt) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    throw new Error('generarRespuesta() requiere un prompt no vacío');
  }

  console.log(`[llmService] → Gemini 2.5-flash`);
  console.log(`[llmService]   longitud del prompt: ${prompt.length} caracteres`);
  console.log(`[llmService]   primeras 3 líneas del prompt:`);
  prompt.split('\n').slice(0, 3).forEach(l => console.log(`[llmService]   | ${l}`));

  const result = await model.generateContent(prompt);
  const respuesta = result.response.text();

  console.log(`[llmService] ✅ respuesta recibida — ${respuesta.length} caracteres`);
  console.log(`[llmService]   preview: "${respuesta.slice(0, 100)}..."`);

  return respuesta;
}

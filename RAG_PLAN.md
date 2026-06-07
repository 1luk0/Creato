# Plan de Implementación — Pipeline RAG · Kreato

> **Rama:** `feature/rag-pipeline`
> **Responsable:** Rafael Medina
> **Stack:** Node 20 + Express 5 + Mongoose 9 + ES Modules

---

## Alcance

### El LLM (Gemini 2.5-flash) está acotado a un único caso de uso

Estudiante hace una pregunta en lenguaje natural sobre el contenido de una clase →
el sistema recupera los fragmentos relevantes de la transcripción del video →
Gemini sintetiza una respuesta citando el minuto exacto del video.

Para todos los demás casos de recuperación (creativos, vacantes, portafolios) el RAG
devuelve documentos concretos directamente. No hay generación LLM.

### Archivos que crea este pipeline

| Archivo | Propósito |
|---|---|
| `src/models/VectorTranscripciones.js` | Schema Mongoose de `vector_transcripciones` |
| `src/services/embeddingService.js` | Embed de texto vía HF Inference API (384 dims) |
| `src/services/ragService.js` | retrieve() + buildPrompt() + ragQuery() |
| `src/services/llmService.js` | Llamada a Gemini 2.5-flash |
| `src/controllers/ragController.js` | Handlers HTTP |
| `src/routes/ragRoutes.js` | POST /api/search y POST /api/rag |
| `tests/rag.test.js` | Pruebas formales — 10 consultas del experimento |

### Archivos que modifica (mínimamente)

| Archivo | Cambio |
|---|---|
| `src/app.js` | 2 líneas: import ragRoutes + app.use('/api', ragRoutes) |
| `.env` | Agrega HF_API_TOKEN y GEMINI_API_KEY |
| `package.json` | Agrega @google/generative-ai + script "test" |

### No toca

Todo lo demás: db.js, todos los controllers/models/routes de otras entidades.

---

## Variables de entorno

```env
MONGODB_URI=...          # ya existe
HF_API_TOKEN=hf_xxx      # huggingface.co/settings/tokens
GEMINI_API_KEY=AIza...   # aistudio.google.com/app/apikey
```

---

## Dependencia nueva

```bash
npm install @google/generative-ai
```

HF Inference API usa `fetch` nativo de Node 20 — sin librería extra.

---

## Fases

### Fase 1 — Modelo Mongoose

**Entregable:** `src/models/VectorTranscripciones.js`

**Evidencia:** Script de verificación que conecta a Atlas, cuenta los 24 chunks
de `vector_transcripciones` y muestra un documento de cada estrategia.
Captura de la salida en consola.

---

### Fase 2 — Servicio de embeddings

**Entregable:** `src/services/embeddingService.js`

**Evidencia:** Llamar `embed("¿Cómo funciona la luz ambiental?")` e imprimir la
longitud del vector resultante (debe ser 384) y los primeros 5 valores.
Confirma que el token de HF funciona y el modelo responde.

---

### Fase 3 — Retrieval con $vectorSearch

**Entregable:** `src/services/ragService.js` — solo la función `retrieve()`

**Evidencia:** Tabla con las 10 consultas ejecutadas contra las 3 estrategias,
mostrando el chunk top-1 recuperado vs el ground truth definido en el
experimento de chunking.

| # | Consulta | semantic top-1 | GT | Hit |
|---|---|---|---|---|
| Q01 | Luz ambiental en pintura digital | ? | vt_001 | ? |
| Q02 | Modo de fusión para brillos | ? | vt_003 | ? |
| Q03 | Pintar sombras sin negro puro | ? | — (inter-transcripción) | null |
| Q04 | Sombra propia vs proyectada | ? | — (inter-transcripción) | null |
| Q05 | Gradiente de luz cenital | ? | vt_002 | ? |
| Q06 | Por qué la iluminación es importante | ? | vt_005 | ? |
| Q07 | Distancia de luz y dureza de sombra | ? | vt_004 | ? |
| Q08 | Paleta para escenas nocturnas | ? | vt_006 | ? |
| Q09 | Modo Multiplicar para sombras | ? | vt_003 | ? |
| Q10 | Luz que colorea superficies | ? | vt_001 | ? |

La tabla se completa con los resultados reales al ejecutar la fase.

---

### Fase 4 — Generación LLM

**Entregable:** `src/services/llmService.js` + `ragService.js` (añadir
`buildPrompt` y `ragQuery`)

**Evidencia:** Respuesta completa de Gemini para Q01, Q02 y Q08, mostrando
que cita el timestamp del video y usa solo el contexto recuperado.

---

### Fase 5 — API

**Entregables:** `src/controllers/ragController.js`, `src/routes/ragRoutes.js`,
2 líneas en `src/app.js`

**Evidencia:** Capturas de curl con los dos endpoints:
- `POST /api/search` → chunks crudos con score de similitud
- `POST /api/rag` → respuesta de Gemini + chunks usados como contexto

---

### Fase 6 — Tests formales

**Entregable:** `tests/rag.test.js`

**Evidencia:** Output completo de `node --test` con cada test nombrado y su
resultado. Q03 y Q04 se documentan como `hit@3 = null` (correcto — fuera del
corpus de trans_999).

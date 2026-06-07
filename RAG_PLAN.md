# Plan de Implementación — Pipeline RAG · Kreato (v2)

> **Rama:** `feature/rag-pipeline`
> **Responsable:** Rafael Medina
> **Stack:** Node 20 + Express 5 + Mongoose 9 + ES Modules

---

## Alcance completo

### Casos de uso implementados

| Tipo | Input | Output | LLM |
|---|---|---|---|
| Texto → texto (transcripciones) | Pregunta natural | Respuesta + timestamp del video | ✅ Gemini 2.5-flash |
| Texto → texto (cursos, creativos, vacantes) | Query semántica | Documentos relevantes | ❌ directo |
| Texto → imagen | Query de texto | Publicaciones/portafolios similares | ❌ directo |
| Imagen → imagen | Imagen de referencia | Publicaciones/portafolios similares | ❌ directo |

### Modelos de embedding

| Modelo | Dims | Colecciones que lo usan |
|---|---|---|
| `paraphrase-multilingual-MiniLM-L12-v2` | 384 | vector_transcripciones, vector_perfil_creativo, vector_cursos, perfil_creativo.vector_descripcion, cursos.vector_contenido, oferta_encargo.vector_descripcion, oferta_laboral.vector_descripcion, transcripciones.lineas.vector_linea |
| `openai/clip-vit-base-patch32` | 512 | publicaciones.vector_imagen, perfil_creativo.vector_portafolio_global, oferta_encargo.vectores_imagenes |

---

## Variables de entorno

```env
MONGODB_URI=...          # ya existe
HF_API_TOKEN=hf_xxx      # huggingface.co/settings/tokens — para ambos modelos
GEMINI_API_KEY=AIza...   # aistudio.google.com/app/apikey
```

---

## Dependencias nuevas

```bash
npm install @google/generative-ai   # Gemini SDK
```

CLIP y MiniLM se llaman vía HF Inference API con `fetch` nativo de Node 20.
URL base: `https://router.huggingface.co/hf-inference/models/<modelo>/pipeline/feature-extraction`

---

## Índices vectoriales HNSW (Atlas UI — manual)

Se crean en Atlas UI → Search → Create Search Index (tipo `vectorSearch`).
No se crean con `createIndex()`.

| Nombre índice | Colección | Campo | Dims | Modelo |
|---|---|---|---|---|
| `rag_transcripciones` | vector_transcripciones | vector_embedding | 384 | MiniLM |
| `rag_publicaciones_img` | publicaciones | vector_imagen | 512 | CLIP |
| `rag_perfil_descripcion` | perfil_creativo | vector_descripcion | 384 | MiniLM |
| `rag_perfil_portafolio` | perfil_creativo | vector_portafolio_global | 512 | CLIP |
| `rag_vector_perfil` | vector_perfil_creativo | vector_embedding | 384 | MiniLM |
| `rag_cursos_contenido` | cursos | vector_contenido | 384 | MiniLM |
| `rag_vector_cursos` | vector_cursos | vector_embedding | 384 | MiniLM |
| `rag_encargo_desc` | oferta_encargo | vector_descripcion | 384 | MiniLM |
| `rag_encargo_img` | oferta_encargo | vectores_imagenes | 512 | CLIP |
| `rag_laboral_desc` | oferta_laboral | vector_descripcion | 384 | MiniLM |
| `rag_transcripciones_lineas` | transcripciones | lineas.vector_linea | 384 | MiniLM |

JSON de configuración para Atlas UI:
```json
{ "fields": [{ "type": "vector", "path": "<campo>", "numDimensions": <384|512>, "similarity": "cosine" }] }
```

---

## Archivos del pipeline RAG

### Crea

| Archivo | Estado |
|---|---|
| `src/models/VectorTranscripciones.js` | ✅ FASE 1 |
| `src/services/embeddingService.js` | ✅ FASE 2 |
| `src/services/ragService.js` | ✅ FASE 3 (parcial — retrieve texto) |
| `src/models/Publicaciones.js` | FASE 4 |
| `src/models/PerfilCreativo.js` | FASE 4 |
| `src/models/VectorPerfilCreativo.js` | FASE 4 |
| `src/models/VectorCursos.js` | FASE 4 |
| `src/models/OfertaEncargo.js` | FASE 4 |
| `src/models/OfertaLaboral.js` | FASE 4 |
| `src/services/imageEmbeddingService.js` | FASE 5 |
| `src/services/llmService.js` | FASE 6 |
| `src/controllers/ragController.js` | FASE 7 |
| `src/routes/ragRoutes.js` | FASE 7 |
| `scripts/populate_vectors_node.js` | ✅ FASE 3 |

### Modifica

| Archivo | Cambio |
|---|---|
| `src/services/ragService.js` | Añadir retrieveByImage(), retrieveTextToImage(), ragQuery() |
| `src/controllers/vectorTranscripcionesController.js` | Llenar stub |
| `src/controllers/vectorCursosController.js` | Llenar stub |
| `src/controllers/vectorPerfilCreativoController.js` | Llenar stub |
| `src/routes/vectortranscripcionesRoutes.js` | Llenar stub |
| `src/routes/vectorCursosRoutes.js` | Llenar stub |
| `src/routes/vectorPerfilRoutes.js` | Llenar stub |
| `src/app.js` | Vincular rutas RAG |
| `.env` | Añadir GEMINI_API_KEY |

### No toca

db.js, controllers/models/routes de otras entidades no vectoriales.

---

## Fases

### ✅ Fase 1 — Modelo VectorTranscripciones

`src/models/VectorTranscripciones.js` — Schema Mongoose de vector_transcripciones.
24 chunks verificados en Atlas (6 semantic + 9 fixed_size + 9 sentence_window).

---

### ✅ Fase 2 — Servicio de embeddings de texto (MiniLM)

`src/services/embeddingService.js` — embed(texto) → 384-dim via HF router.
Verificado: 2 consultas distintas, vectores distintos, longitud 384.

---

### ✅ Fase 3 — Retrieval con $vectorSearch (texto)

`src/services/ragService.js` — retrieve(queryText, estrategia, limit=3).
`scripts/populate_vectors_node.js` — poblar embeddings reales (correr cuando compañeros suban datos).
**Pendiente:** correr populate script + crear índice `rag_transcripciones` en Atlas UI.

---

### Fase 4 — Modelos Mongoose completos

**Entregables:** Schemas para todas las colecciones con campos vectoriales.

| Modelo | Campos vectoriales |
|---|---|
| Publicaciones | vector_imagen: [Number] (512) |
| PerfilCreativo | vector_descripcion: [Number] (384), vector_portafolio_global: [Number] (512) |
| VectorPerfilCreativo | vector_embedding: [Number] (384) |
| VectorCursos | vector_embedding: [Number] (384) |
| OfertaEncargo | vector_descripcion: [Number] (384), vectores_imagenes: [[Number]] (512 c/u) |
| OfertaLaboral | vector_descripcion: [Number] (384) |

**Evidencia:** Script que conecta, cuenta documentos y muestra un doc de cada colección.

---

### Fase 5 — Servicio de embeddings de imagen (CLIP)

**Entregable:** `src/services/imageEmbeddingService.js`

Dos funciones:
- `embedImage(urlOrBase64)` → 512-dim (imagen → vector)
- `embedTextForImage(texto)` → 512-dim (texto → espacio CLIP para texto-a-imagen)

Modelo: `openai/clip-vit-base-patch32` vía HF router.

**Evidencia:** Llamar `embedImage(url)` con una URL de imagen pública, verificar 512 dims.
Verificar que dos imágenes distintas producen vectores distintos.

---

### Fase 6 — Generación LLM (Gemini 2.5-flash)

**Entregables:** `src/services/llmService.js` + ampliar `ragService.js`

`llmService.js` expone:
- `generarRespuesta(prompt)` → string con respuesta de Gemini

`ragService.js` añade:
- `buildPrompt(queryText, chunks)` → string con contexto + pregunta
- `ragQuery(queryText, estrategia)` → { respuesta, chunks, timestamps }

Scope: SOLO para transcripciones (texto-a-texto con Gemini).

**Evidencia:** Respuesta completa de Gemini para Q01, Q02 y Q08, citando el minuto del video.

---

### Fase 7 — Búsqueda vectorial multimodal + API completa

**Entregables:**
- Ampliar `ragService.js` con búsquedas en todas las colecciones vectoriales
- `src/controllers/ragController.js` — handlers HTTP
- `src/routes/ragRoutes.js` — endpoints
- Llenar stubs de vectorTranscripcionesController, vectorCursosController, vectorPerfilCreativoController
- 2 líneas en `src/app.js`

Funciones en ragService:
- `retrieveCreativos(queryText, limit)` → busca en vector_perfil_creativo y perfil_creativo.vector_descripcion
- `retrieveCursos(queryText, limit)` → busca en vector_cursos y cursos.vector_contenido
- `retrieveByImage(imageInput, coleccion, limit)` → imagen→imagen en publicaciones o oferta_encargo
- `retrieveTextToImage(texto, limit)` → texto→imagen en publicaciones.vector_imagen

Endpoints:
```
POST /api/rag          body: { query, estrategia? }   → RAG transcripciones + Gemini
POST /api/search       body: { query, tipo? }          → búsqueda semántica texto
POST /api/search/image body: { image_url, coleccion? } → imagen-a-imagen
POST /api/search/multimodal body: { query }            → texto-a-imagen
```

**Evidencia:** curl de los 4 endpoints con respuestas reales.

---

### Fase 8 — Tests formales

**Entregable:** `tests/rag.test.js`

**Tests de texto (transcripciones) — 10 consultas × 3 estrategias:**

| # | Consulta | GT semantic | GT fixed_size | GT sentence_window |
|---|---|---|---|---|
| Q01 | luz ambiental en pintura digital | vt_001 | A_001, A_002 | C_001, C_002 |
| Q02 | modo de fusión para brillos | vt_003 | A_005, A_006 | C_006 |
| Q03 | pintar sombras sin negro puro | (trans_998) | (trans_998) | (trans_998) |
| Q04 | sombra propia vs proyectada | (trans_998) | (trans_998) | (trans_998) |
| Q05 | gradiente de luz cenital | vt_002 | A_004, A_005 | C_004, C_005 |
| Q06 | por qué la iluminación es importante | vt_005 | A_008 | C_009 |
| Q07 | distancia de luz y dureza de sombra | vt_004 | A_005 | C_005 |
| Q08 | paleta para escenas nocturnas | vt_006 | A_007, A_008 | C_008 |
| Q09 | modo Multiplicar para sombras | vt_003 | A_005, A_006 | C_007 |
| Q10 | luz colorea superficies según material | vt_001 | A_001, A_002 | C_001, C_002 |

Notas: A_001 = vt_exp_A_001 · C_001 = vt_exp_C_001
Q03 y Q04: hit@3 = null (inter-transcripción, fuera del corpus trans_999)
hits_eval = 8 (Q03 y Q04 excluidas del promedio)

**Tests de imagen:** 3 casos imagen-imagen sobre publicaciones.
**Tests multimodal:** 2 casos texto-a-imagen.

**Evidencia:** Output completo de `node --test` con cada test nombrado y resultado.
Tabla comparativa Hit@3 por estrategia con conclusión justificada.

# Kreato — Documentación de Endpoints

Base URL: `http://localhost:3000`

---

## RAG y Búsqueda Vectorial

### POST /api/rag
Pipeline RAG completo: genera una respuesta en lenguaje natural usando Gemini 2.5-flash con fragmentos de transcripción como contexto.

**Body:**
```json
{
  "query": "¿Cómo funciona la luz ambiental en pintura digital?",
  "estrategia": "semantic_split_v1"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `query` | string | ✅ | Pregunta del usuario |
| `estrategia` | string | ❌ | Filtra chunks por estrategia. Valores: `fixed_size_v1`, `semantic_split_v1`, `sentence_window_v1`. Sin filtro si se omite. |

**Respuesta:**
```json
{
  "respuesta": "La luz ambiental en pintura digital es...",
  "chunks": [
    {
      "_id": "vt_001",
      "transcripcion_id": "trans_999",
      "contenido_segmento": "...",
      "metadata": { "minuto_inicio": 0, "minuto_fin": 120, "estrategia_chunking": "semantic_split_v1" },
      "score": 0.8316
    }
  ]
}
```

**Flujo interno:** `embed(query)` → `$vectorSearch` sobre `vector_transcripciones` → `buildPrompt` con timestamps → `Gemini 2.5-flash` → respuesta.

---

### POST /api/search/transcripciones
Búsqueda vectorial sobre chunks de transcripción. Devuelve los fragmentos más similares sin generar respuesta LLM.

**Body:**
```json
{
  "query": "¿Qué modo de fusión debo usar para los brillos?",
  "estrategia": "fixed_size_v1",
  "limit": 3
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `query` | string | ✅ | Texto de búsqueda |
| `estrategia` | string | ❌ | Filtra por estrategia de chunking |
| `limit` | number | ❌ | Cantidad de resultados (default: 5) |

**Respuesta:**
```json
{
  "query": "...",
  "estrategia": "fixed_size_v1",
  "resultados": [{ "_id": "vt_exp_A_005", "score": 0.87, "contenido_segmento": "...", "metadata": {...} }]
}
```

---

### POST /api/search/cursos
Búsqueda vectorial sobre la colección `vector_cursos` (384-dim, MiniLM). Devuelve cursos similares semánticamente a la consulta.

**Body:**
```json
{
  "query": "curso de ilustración digital para principiantes",
  "limit": 5
}
```

**Respuesta:**
```json
{
  "query": "...",
  "resultados": [{ "_id": "vc_001", "curso_id": "...", "tipo": "DESCRIPCION", "contenido": "...", "score": 0.81 }]
}
```

> Requiere índice Atlas `rag_vector_cursos` (384-dim, cosine) sobre `vector_cursos.vector_embedding`.

---

### POST /api/search/creativos
Búsqueda vectorial sobre la colección `vector_perfil_creativo` (384-dim, MiniLM). Devuelve perfiles creativos cuya descripción o portafolio coincide con la consulta.

**Body:**
```json
{
  "query": "diseñador gráfico especializado en branding e identidad visual",
  "limit": 5
}
```

**Respuesta:**
```json
{
  "query": "...",
  "resultados": [{ "_id": "vpc_001", "perfil_creativo_id": "...", "tipo": "bio", "contenido": "...", "score": 0.79 }]
}
```

> Requiere índice Atlas `rag_vector_perfil` (384-dim, cosine) sobre `vector_perfil_creativo.vector_embedding`.

---

### POST /api/search/image
Búsqueda imagen-a-imagen usando CLIP (512-dim). Recibe la URL de una imagen y devuelve publicaciones visualmente similares en `publicaciones.vector_imagen`.

**Body:**
```json
{
  "image_url": "https://picsum.photos/id/1015/300/200",
  "limit": 5
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `image_url` | string | ✅ | URL pública de la imagen de referencia |
| `limit` | number | ❌ | Cantidad de resultados (default: 5) |

**Respuesta:**
```json
{
  "image_url": "...",
  "resultados": [{ "_id": "pub_001", "creativo_id": "...", "imagen_url": "...", "descripcion": "...", "categorias": [], "score": 0.93 }]
}
```

**Flujo interno:** descarga imagen → `CLIP VisionModel` → vector 512-dim → `$vectorSearch` sobre `publicaciones.vector_imagen`.

> Requiere índice Atlas `rag_publicaciones_img` (512-dim, cosine) sobre `publicaciones.vector_imagen`.

---

### POST /api/search/multimodal
Búsqueda texto-a-imagen usando el encoder de texto de CLIP (512-dim). Proyecta el texto al espacio visual para encontrar publicaciones cuyas imágenes coincidan semánticamente con la descripción.

**Body:**
```json
{
  "query": "ilustración de personaje fantástico con colores vibrantes",
  "limit": 5
}
```

**Respuesta:**
```json
{
  "query": "...",
  "resultados": [{ "_id": "pub_002", "imagen_url": "...", "descripcion": "...", "score": 0.88 }]
}
```

**Flujo interno:** `CLIP TextModel` proyecta el texto al espacio visual → vector 512-dim → `$vectorSearch` sobre `publicaciones.vector_imagen`.

> Requiere índice Atlas `rag_publicaciones_img` (512-dim, cosine).

---

## Entidades con Auto-Vectorización

### POST /api/publicaciones
Crea una nueva publicación y genera automáticamente el vector CLIP de la imagen en el momento de creación.

**Body:**
```json
{
  "creativo_id": "perfil_001",
  "imagen_url": "https://ejemplo.com/obra.jpg",
  "descripcion": "Ilustración digital de paisaje fantástico",
  "categorias": ["ilustración", "digital", "fantasia"],
  "es_portafolio": true
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `creativo_id` | string | ✅ | ID del perfil creativo autor |
| `imagen_url` | string | ✅ | URL pública de la imagen — se usa para generar el vector CLIP |
| `descripcion` | string | ✅ | Descripción de la obra |
| `categorias` | string[] | ❌ | Etiquetas de la publicación |
| `es_portafolio` | boolean | ❌ | Si forma parte del portafolio oficial (default: false) |
| `_id` | string | ❌ | ID personalizado. Si se omite se genera un UUID. |

**Respuesta:** Documento completo guardado en MongoDB con `vector_imagen` de 512 dimensiones.

**Flujo interno:** `CLIP VisionModel` descarga la imagen → genera vector 512-dim → guarda documento con `vector_imagen` incluido.

---

### GET /api/publicaciones/:id
Obtiene una publicación por su ID.

**Respuesta:** Documento completo de la publicación incluyendo `vector_imagen`.

---

### POST /api/perfil-creativo
Crea un perfil creativo y genera automáticamente dos vectores en el momento de creación:
- `vector_descripcion` (384-dim, MiniLM) desde el campo `descripcion`
- `vector_portafolio_global` (512-dim, CLIP) como bootstrap desde la descripción (se actualiza al agregar publicaciones)

**Body:**
```json
{
  "user_id": "usuario_001",
  "descripcion": "Ilustradora digital especializada en concept art y personajes de fantasía",
  "profesiones": ["Ilustradora", "Concept Artist"],
  "habilidades": ["Photoshop", "Procreate", "Blender"],
  "experiencia": "5 años trabajando en proyectos indie y editoriales",
  "foto_perfil": "https://ejemplo.com/foto.jpg"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `user_id` | string | ✅ | ID del usuario dueño del perfil |
| `descripcion` | string | ✅ | Descripción profesional — se usa para generar ambos vectores |
| `profesiones` | string[] | ❌ | Lista de profesiones |
| `habilidades` | string[] | ❌ | Herramientas y habilidades |
| `experiencia` | string | ❌ | Descripción de la experiencia |
| `foto_perfil` | string | ❌ | URL de la foto de perfil |
| `_id` | string | ❌ | ID personalizado. Si se omite se genera un UUID. |

**Respuesta:** Documento completo con `vector_descripcion` (384-dim) y `vector_portafolio_global` (512-dim).

---

### GET /api/perfil-creativo/:id
Obtiene un perfil creativo por su ID.

---

## Colecciones Vectoriales (creación con auto-embedding)

### POST /api/vector/transcripciones
Crea un chunk de transcripción y genera automáticamente `vector_embedding` (384-dim, MiniLM) desde `contenido_segmento`.

**Body:**
```json
{
  "transcripcion_id": "trans_001",
  "contenido_segmento": "En esta sección veremos cómo usar la luz ambiental...",
  "metadata": {
    "minuto_inicio": 0,
    "minuto_fin": 120,
    "estrategia_chunking": "semantic_split_v1"
  }
}
```

Valores válidos para `estrategia_chunking`: `fixed_size_v1`, `semantic_split_v1`, `sentence_window_v1`.

---

### GET /api/vector/transcripciones/search
Búsqueda vectorial sobre chunks de transcripción (equivalente a `POST /api/search/transcripciones` pero via query params).

**Query params:** `?q=texto&estrategia=semantic_split_v1&limit=5`

---

### POST /api/vector/cursos
Crea un vector de curso y genera automáticamente `vector_embedding` (384-dim, MiniLM) desde `contenido`.

**Body:**
```json
{
  "curso_id": "curso_001",
  "tipo": "DESCRIPCION",
  "contenido": "Aprende las técnicas fundamentales de la ilustración digital...",
  "estrategia_chunking": "semantic_split_v1"
}
```

Valores válidos para `tipo`: `DESCRIPCION`, `TEMARIO`, `OBJETIVO`.

---

### GET /api/vector/cursos/search
**Query params:** `?q=texto&limit=5`

---

### POST /api/vector/perfil
Crea un vector de perfil creativo y genera automáticamente `vector_embedding` (384-dim, MiniLM) desde `contenido`.

**Body:**
```json
{
  "perfil_creativo_id": "perfil_001",
  "tipo": "bio",
  "contenido": "Diseñadora con 5 años de experiencia en branding y logotipos...",
  "estrategia_chunking": "semantic_split_v1"
}
```

Valores válidos para `tipo`: `estilo`, `herramientas`, `bio`, `portafolio`.

---

### GET /api/vector/perfil/search
**Query params:** `?q=texto&limit=5`

---

## Índices Atlas requeridos

| Nombre | Colección | Campo | Dims | Tipo |
|--------|-----------|-------|------|------|
| `rag_transcripciones` | `vector_transcripciones` | `vector_embedding` | 384 | cosine |
| `rag_vector_perfil` | `vector_perfil_creativo` | `vector_embedding` | 384 | cosine |
| `rag_vector_cursos` | `vector_cursos` | `vector_embedding` | 384 | cosine |
| `rag_publicaciones_img` | `publicaciones` | `vector_imagen` | 512 | cosine |

El índice `rag_transcripciones` requiere además un campo `filter` para `metadata.estrategia_chunking`:
```json
{
  "fields": [
    { "type": "vector", "path": "vector_embedding", "numDimensions": 384, "similarity": "cosine" },
    { "type": "filter", "path": "metadata.estrategia_chunking" }
  ]
}
```

Los demás usan solo el campo vector:
```json
{
  "fields": [
    { "type": "vector", "path": "vector_embedding", "numDimensions": 384, "similarity": "cosine" }
  ]
}
```

---

## Modelos de embeddings

| Modelo | Tipo | Dims | Uso |
|--------|------|------|-----|
| `sentence-transformers/all-MiniLM-L6-v2` | Texto | 384 | Transcripciones, cursos, perfiles |
| `Xenova/clip-vit-base-patch32` | Imagen / Texto→Imagen | 512 | Publicaciones, búsqueda multimodal |

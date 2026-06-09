# Documentación de Consultas No Relacionales — Kreato

Este documento detalla las consultas clásicas y de búsqueda híbrida implementadas para la Entrega 2 de **Kreato**, incluyendo su correspondencia con los casos de uso, etapas de agregación y ejemplos de respuestas reales obtenidas de la base de datos MongoDB Atlas.

---

## A) AGGREGATION CLÁSICO (Aggregation Framework)

### 1. Análisis de ingresos recaudados por creativo (Cursos)
- **Caso de uso**: **RF-16 (Pagos)** & **RF-07 (Cursos)**
  - *Descripción*: Analiza financieramente cuánto dinero ha recaudado cada creativo del sistema a través de la venta directa de sus cursos académicos.
- **Endpoint**: `GET /api/consultas/ingresos-creativos`
- **Etapas utilizadas**:
  - `$lookup` (con sub-pipeline sobre la colección `pagos` para buscar transacciones exitosas del tipo `'CURSO'`).
  - `$project` (para calcular la sumatoria de las ventas individuales de cada curso).
  - `$unwind` (para separar los creadores asociados a cada curso).
  - `$lookup` (sobre `perfil_creativo` para resolver las inconsistencias del seed donde se usó `perf_001` en lugar del ID directo de usuario).
  - `$project` (para resolver condicionalmente el `creador_id` real).
  - `$lookup` (sobre `usuarios` para obtener nombres y correos reales de los creativos).
  - `$unwind` (para aplanar el objeto de usuario).
  - `$group` (agrupación por ID de creativo sumando los ingresos y coleccionando los nombres de sus cursos).
  - `$sort` (ordenar de forma descendente por los ingresos recaudados).
- **Ejemplo de Request**:
  - URL: `http://localhost:3000/api/consultas/ingresos-creativos`
- **Ejemplo de Response Real (datos de Atlas)**:
```json
[
  {
    "_id": "usr_001",
    "creador_nombre": "Isabel Benitez",
    "creador_correo": "isabel@kreato.com",
    "cursos_asociados": [
      "Diseño de Marca desde Cero",
      "Dominando la Luz en Digital",
      "Fotografía de Retrato Profesional",
      "Modelado 3D para Diseñadores",
      "Branding Visual: Identidad de Marca",
      "Fotografía de Producto para E-commerce"
    ],
    "total_ingresos_cursos": 89.99
  },
  {
    "_id": "usr_003",
    "creador_nombre": "Valentina Rios",
    "creador_correo": "valentina@kreato.com",
    "cursos_asociados": [
      "Tipografía Expresiva para Diseño",
      "Motion Graphics para Redes Sociales",
      "Animación 2D con Procreate",
      "Tipografía para Diseñadores"
    ],
    "total_ingresos_cursos": 0
  },
  {
    "_id": "usr_004",
    "creador_nombre": "Andrés Gutiérrez",
    "creador_correo": "andres@kreato.com",
    "cursos_asociados": [
      "Ilustración Vectorial Profesional",
      "Diseño Tipográfico: De la Idea al Font",
      "Ilustración Vectorial Avanzada",
      "Diseño de Empaques Creativos"
    ],
    "total_ingresos_cursos": 0
  }
]
```

---

### 2. Estadísticas de creativos agrupados por su profesión
- **Caso de uso**: **RF-02 (Personalizar perfil de creativo)** & **RF-03 (Publicar portafolio)**
  - *Descripción*: Agrupa perfiles creativos según sus profesiones (por ejemplo, *Concept Artist*, *Tipógrafo*, etc.) para calcular el promedio de ratings otorgados y el volumen de obras totales cargadas en su portafolio.
- **Endpoint**: `GET /api/consultas/creativos-por-profesion`
- **Etapas utilizadas**:
  - `$lookup` (sobre `usuarios` para obtener nombres y verificar existencia).
  - `$unwind` (aplanar usuario).
  - `$lookup` (sobre `publicaciones` filtrando por `creativo_id` para obtener el portafolio).
  - `$project` (para calcular el tamaño del arreglo de publicaciones).
  - `$unwind` (para separar las profesiones individuales declaradas por cada creativo).
  - `$group` (agrupar por la especialidad profesional calculando promedios de calificación y conteo de piezas).
  - `$sort` (ordenar descendentemente por la cantidad de creativos en cada profesión).
- **Ejemplo de Request**:
  - URL: `http://localhost:3000/api/consultas/creativos-por-profesion`
- **Ejemplo de Response Real (datos de Atlas)**:
```json
[
  {
    "_id": "Ilustradora Senior",
    "cantidad_creativos": 1,
    "rating_promedio_profesion": 4.5,
    "total_obras_portafolio": 6
  },
  {
    "_id": "Concept Artist",
    "cantidad_creativos": 1,
    "rating_promedio_profesion": 4.5,
    "total_obras_portafolio": 6
  },
  {
    "_id": "Diseñador Editorial",
    "cantidad_creativos": 1,
    "rating_promedio_profesion": 4.8,
    "total_obras_portafolio": 4
  },
  {
    "_id": "Motion Designer",
    "cantidad_creativos": 1,
    "rating_promedio_profesion": 4.2,
    "total_obras_portafolio": 5
  },
  {
    "_id": "Tipógrafo",
    "cantidad_creativos": 1,
    "rating_promedio_profesion": 4.8,
    "total_obras_portafolio": 4
  },
  {
    "_id": "Editor de Video",
    "cantidad_creativos": 1,
    "rating_promedio_profesion": 4.2,
    "total_obras_portafolio": 5
  }
]
```

---

### 3. Auditoría cruzada de agendamiento y pago de asesorías
- **Caso de uso**: **RF-11 (Ofrecer asesorías)**, **RF-12 (Solicitar asesoría)** & **RF-16 (Pagos)**
  - *Descripción*: Realiza un cruce de auditoría completo para cada sesión de asesoría materializada, listando los datos del cliente, el creativo asignado, el canal de comunicación, y verificando el monto monetario y estado de pago de la transacción en una sola respuesta.
- **Endpoint**: `GET /api/consultas/auditoria-asesorias`
- **Etapas utilizadas**:
  - `$lookup` y `$unwind` (sobre `pagos` para verificar la transacción de cobro).
  - `$lookup` y `$unwind` (sobre `solicitudes` para traer el requerimiento inicial y horarios agendados).
  - `$lookup` y `$unwind` (sobre `usuarios` para detallar los datos del cliente comprador).
  - `$lookup` y `$unwind` (sobre `oferta_asesoria` para buscar el origen de la oferta).
  - `$lookup` y `$unwind` (sobre `perfil_creativo` para mapear al diseñador).
  - `$lookup` y `$unwind` (sobre `usuarios` para detallar los datos de contacto y nombre del creativo docente).
  - `$project` (para limpiar y estructurar jerárquicamente la auditoría).
- **Ejemplo de Request**:
  - URL: `http://localhost:3000/api/consultas/auditoria-asesorias`
- **Ejemplo de Response Real (datos de Atlas)**:
```json
[
  {
    "_id": "ase_444",
    "link_reunion": "https://meet.google.com/kreato-ase-444",
    "video_grabacion": "https://storage.kreato/grabaciones/ase_444.mp4",
    "monto_pagado": 45,
    "estado_pago": "pagado",
    "cliente": {
      "id": "usr_005",
      "nombre": "Laura Martínez",
      "correo": "laura@kreato.com"
    },
    "creativo": {
      "id": "usr_001",
      "nombre": "Isabel Benitez",
      "correo": "isabel@kreato.com"
    },
    "fecha_asesoria": "2026-04-09T00:00:00.000Z",
    "horario": {
      "inicio": "15:00",
      "fin": "16:00"
    }
  },
  {
    "_id": "ase_002",
    "link_reunion": "https://meet.kreato.com/sesion-001",
    "video_grabacion": "http://localhost:3000/grabaciones/sesion_001.mp4",
    "monto_pagado": 150000,
    "estado_pago": "pagado",
    "cliente": {
      "id": "usr_002",
      "nombre": "Carlos Mendez",
      "correo": "carlos@kreato.com"
    },
    "creativo": {
      "id": "usr_001",
      "nombre": "Isabel Benitez",
      "correo": "isabel@kreato.com"
    },
    "fecha_asesoria": "2026-06-10T05:00:00.000Z",
    "horario": {
      "inicio": "09:00",
      "fin": "10:00"
    }
  },
  {
    "_id": "ase_003",
    "link_reunion": "https://meet.kreato.com/sesion-002",
    "video_grabacion": "http://localhost:3000/grabaciones/sesion_002.mp4",
    "monto_pagado": 170000,
    "estado_pago": "pagado",
    "cliente": {
      "id": "usr_005",
      "nombre": "Laura Martínez",
      "correo": "laura@kreato.com"
    },
    "creativo": {
      "id": "usr_003",
      "nombre": "Valentina Rios",
      "correo": "valentina@kreato.com"
    },
    "fecha_asesoria": "2026-06-11T05:00:00.000Z",
    "horario": {
      "inicio": "10:00",
      "fin": "11:00"
    }
  }
]
```

---

## B) CONSULTAS HÍBRIDAS (VectorSearch + filters)

### 4. Búsqueda semántica en transcripciones con filtro de estrategia
- **Caso de uso**: **RF-09 (Transcripción automática)**
  - *Descripción*: Búsqueda semántica (a través de embeddings vectoriales de 384 dimensiones) en fragmentos de video transcritos, aplicando un filtro duro en el índice vectorial sobre la estrategia de chunking.
- **Endpoint**: `GET /api/consultas/transcripciones-estrategia`
- **Etapas utilizadas**:
  - `$vectorSearch` (con propiedad `filter` pre-filtrando directamente en el índice Atlas HNSW sobre `'metadata.estrategia_chunking'`).
  - `$project` (para incluir el `score` semántico y filtrar campos de salida).
- **Ejemplo de Request**:
  - URL: `/api/consultas/transcripciones-estrategia?query=luz ambiental&estrategia=semantic_split_v1&limit=2`
- **Ejemplo de Response Real (datos de Atlas)**:
```json
[
  {
    "_id": "vt_006",
    "transcripcion_id": "trans_999",
    "contenido_segmento": "Practiquen este ejercicio con diferentes paletas de color. Prueben con paletas frías para escenas nocturnas y paletas cálidas para atardeceres. En el próximo capítulo veremos cómo las sombras complementan esta base de luz para crear volumen y profundidad.",
    "metadata": {
      "minuto_inicio": 520,
      "minuto_fin": 570,
      "estrategia_chunking": "semantic_split_v1"
    },
    "score": 0.6460709571838379
  },
  {
    "_id": "vt_002",
    "transcripcion_id": "trans_999",
    "contenido_segmento": "Primero debemos entender que la luz no solo ilumina, también colorea. Cada superficie absorbe ciertos colores y refleja otros. Por eso un cuarto con paredes rojas tendrá una luz ambiental cálida.",
    "metadata": {
      "minuto_inicio": 70,
      "minuto_fin": 120,
      "estrategia_chunking": "semantic_split_v1"
    },
    "score": 0.633715033531189
  }
]
```

---

### 5. Búsqueda semántica filtrada por presupuesto y categoría del curso
- **Caso de uso**: **RF-09 (Transcripción de videos)** & **RF-08 (Buscar cursos según habilidad y presupuesto)**
  - *Descripción*: Permite al usuario buscar explicaciones textuales en audio de videos semánticamente, pero restringiendo los resultados a cursos que pertenezcan a una categoría y cuyo precio sea menor o igual al presupuesto máximo especificado (post-filtrado multi-colección).
- **Endpoint**: `GET /api/consultas/buscar-cursos-transcripcion`
- **Etapas utilizadas**:
  - `$vectorSearch` (similitud semántica con 100 candidatos sobre la transcripción).
  - `$lookup` (para vincular con `transcripciones`).
  - `$unwind` (para desestructurar la transcripción).
  - `$lookup` (para cruzar con `cursos` asociando el capítulo correspondiente).
  - `$unwind` (para aplanar el curso asociado).
  - `$match` (filtro duro condicional por `curso_info.precio` y/o `curso_info.categorias`).
  - `$project` (para retornar los datos de la transcripción junto con el objeto metadata del curso).
- **Ejemplo de Request**:
  - URL: `/api/consultas/buscar-cursos-transcripcion?query=modos de fusion para brillos&maxPrecio=100&categoria=Pintura Digital&limit=2`
- **Ejemplo de Response Real (datos de Atlas)**:
```json
[
  {
    "_id": "vt_exp_C_007",
    "contenido_segmento": "Para las zonas de sombra, utilicen 'Multiplicar'. Multiplicar oscurece respetando los tonos originales. Ahora combinen ambos modos en capas separadas y ajusten la opacidad.",
    "metadata": {
      "minuto_inicio": 375,
      "minuto_fin": 430,
      "estrategia_chunking": "sentence_window_v1"
    },
    "score": 0.6132586002349854,
    "curso": {
      "id": "cur_101",
      "nombre": "Dominando la Luz en Digital",
      "precio": 89.99,
      "categorias": [
        "Pintura Digital"
      ]
    }
  },
  {
    "_id": "vt_exp_C_006",
    "contenido_segmento": "Usen el modo de fusión 'Trama' para los brillos. Este modo es ideal porque aclara sin destruir la saturación del color base. Para las zonas de sombra, utilicen 'Multiplicar'.",
    "metadata": {
      "minuto_inicio": 320,
      "minuto_fin": 375,
      "estrategia_chunking": "sentence_window_v1"
    },
    "score": 0.6093396544456482,
    "curso": {
      "id": "cur_101",
      "nombre": "Dominando la Luz en Digital",
      "precio": 89.99,
      "categorias": [
        "Pintura Digital"
      ]
    }
  }
]
```

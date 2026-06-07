# Creato — Backend

API REST para Creato, una plataforma que conecta creativos freelance con clientes. Construida con Node.js, Express y MongoDB Atlas (Mongoose).

---

## Estructura del Proyecto

```
creato_backend/
├── src/
│   ├── app.js                   # Punto de entrada: configuración de Express, conexión a BD y rutas
│   ├── config/
│   │   └── db.js                # Lógica de conexión a MongoDB Atlas
│   ├── models/
│   │   ├── Contador.js          # Colección que almacena los contadores de secuencia
│   │   ├── idGeneratorService.js# Servicio para generar IDs secuenciales con prefijo
│   │   ├── Usuarios.js
│   │   ├── PerfilCreativo.js
│   │   ├── PerfilEmpresa.js
│   │   ├── Publicaciones.js
│   │   ├── Cursos.js
│   │   ├── Asesoria.js
│   │   ├── OfertaAsesoria.js
│   │   ├── OfertaEncargo.js
│   │   ├── OfertaLaboral.js
│   │   ├── Encargo.js
│   │   ├── Solicitudes.js
│   │   ├── Pagos.js
│   │   ├── Comentarios.js
│   │   ├── Transcripciones.js
│   │   ├── VectorCursos.js
│   │   ├── VectorPerfilCreativo.js
│   │   └── VectorTranscripciones.js
│   ├── controllers/             # Lógica de negocio para cada recurso
│   ├── routes/                  # Definición de endpoints de Express
│   └── services/
│       ├── embeddingService.js  # Generación de embeddings vectoriales (sistema RAG)
│       ├── chunkingService.js   # División de texto en fragmentos para embedding
│       └── llmService.js        # Llamadas al LLM para respuestas RAG
├── docs/
│   └── Diagrama de entidades - Kreato.pdf
├── .env                         # Variables de entorno locales (no se sube al repo)
├── package.json
└── README.md
```

---

## Generación de IDs

Todos los documentos usan **IDs secuenciales de tipo string** en lugar del ObjectId por defecto de MongoDB. Esto hace que los IDs sean legibles y consistentes entre colecciones.

**¿Cómo funciona?**

1. La colección `Contador` almacena un documento por colección con su número de secuencia actual.
2. Al crear un nuevo documento, `generarSiguienteId(coleccionNombre, prefijo)` incrementa el contador de forma atómica y retorna el siguiente ID.
3. El ID generado sigue el formato: `PREFIJO_NUMERO`

**Ejemplo de uso en un controlador:**

```js
import { generarSiguienteId } from '../models/idGeneratorService.js';

const nuevoId = await generarSiguienteId('usuarios', 'US');
// Retorna: 'US_1', 'US_2', 'US_3', ...

const nuevoUsuario = new Usuario({ _id: nuevoId, ... });
```

**Prefijos por colección:**

| Colección         | Prefijo |
|-------------------|---------|
| usuarios          | US      |
| perfilCreativo    | PC      |
| perfilEmpresa     | PE      |
| publicaciones     | PB      |
| cursos            | CU      |
| asesoria          | AS      |
| ofertaAsesoria    | OA      |
| ofertaEncargo     | OE      |
| ofertaLaboral     | OL      |
| encargo           | EN      |
| solicitudes       | SO      |
| pagos             | PA      |
| comentarios       | CO      |
| transcripciones   | TR      |

---

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
MONGODB_URI=mongodb+srv://<usuario>:<contraseña>@cluster.mongodb.net/<nombreBD>
PORT=3000
```

---

## Comandos

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo (se reinicia automáticamente al guardar cambios)
npm run dev

# Ejecutar en producción
npm start
```

---

## Ramas de Git

| Rama      | Propósito                                                             |
|-----------|-----------------------------------------------------------------------|
| `main`    | Código estable listo para producción. Solo se actualiza mediante PR.  |
| `develop` | Rama de integración. Todas las features se fusionan aquí primero.     |
| `<nombre>`| Ramas individuales por desarrollador (ej: `luk`). Se trabaja aquí y luego se hace PR a `develop`. |

**Flujo de trabajo:**
```
<tu-rama>  →  develop  →  main
```

1. Crear tu rama a partir de `develop`.
2. Abrir un Pull Request hacia `develop` cuando tu funcionalidad esté lista.
3. `develop` se fusiona con `main` al hacer una entrega o release.

---

## Stack Tecnológico

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Base de datos:** MongoDB Atlas con Mongoose 9
- **IA / RAG:** Servicio de embeddings + LLM para búsqueda vectorial sobre cursos, perfiles y transcripciones

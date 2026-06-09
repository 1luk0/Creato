import Cursos from '../models/Cursos.js';
import PerfilCreativo from '../models/PerfilCreativo.js';
import Asesoria from '../models/Asesoria.js';
import VectorTranscripciones from '../models/VectorTranscripciones.js';
import { embed } from '../services/embeddingService.js';
import { httpError } from '../utils/httpError.js';

/**
 * ============================================================================
 * AGGREGATION CLÁSICO (Aggregation Framework)
 * ============================================================================
 */

/**
 * 1. Análisis de ingresos recaudados por creativo a través de ventas de cursos
 * Caso de uso del PDF: RF-16 (Pagos) & RF-07 (Cursos)
 * Relaciones: pagos.source_id -> cursos._id (cuando pago.tipo === 'CURSO')
 *             cursos.creadores[] -> usuarios._id
 */
export const getIngresosCreativos = async (req, res) => {
  const pipeline = [
    // 1. Unir con pagos de tipo CURSO que estén marcados como 'pagado'
    {
      $lookup: {
        from: 'pagos',
        let: { cursoId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$tipo', 'CURSO'] },
                  { $eq: ['$source_id', '$$cursoId'] },
                  { $eq: ['$estado', 'pagado'] }
                ]
              }
            }
          }
        ],
        as: 'ventas'
      }
    },
    // 2. Proyectar el nombre, creadores y totalizar el monto de las ventas
    {
      $project: {
        nombre: 1,
        creadores: 1,
        total_recaudado: { $sum: '$ventas.monto' }
      }
    },
    // 3. Deshacer el arreglo de creadores
    { $unwind: '$creadores' },
    // 4. Buscar si el creador referenciado es un perfil creativo (perf_...) en lugar de directamente usuario_id
    {
      $lookup: {
        from: 'perfil_creativo',
        localField: 'creadores',
        foreignField: '_id',
        as: 'perfil_info'
      }
    },
    // 5. Determinar el usuario_id real: si encontramos perfil_creativo, usamos su user_id; si no, asumimos que es directamente el usuario_id
    {
      $project: {
        nombre: 1,
        total_recaudado: 1,
        creador_id: {
          $cond: {
            if: { $gt: [{ $size: '$perfil_info' }, 0] },
            then: { $arrayElemAt: ['$perfil_info.user_id', 0] },
            else: '$creadores'
          }
        }
      }
    },
    // 6. Buscar los datos personales del creador en la colección usuarios
    {
      $lookup: {
        from: 'usuarios',
        localField: 'creador_id',
        foreignField: '_id',
        as: 'usuario_creador'
      }
    },
    { $unwind: '$usuario_creador' },
    // 7. Agrupar por creador para sumar los ingresos de todos sus cursos
    {
      $group: {
        _id: '$creador_id',
        creador_nombre: { $first: '$usuario_creador.nombre' },
        creador_correo: { $first: '$usuario_creador.correo' },
        cursos_asociados: { $addToSet: '$nombre' },
        total_ingresos_cursos: { $sum: '$total_recaudado' }
      }
    },
    // 8. Ordenar por ingresos descendente
    { $sort: { total_ingresos_cursos: -1 } }
  ];

  const resultados = await Cursos.aggregate(pipeline);
  res.json(resultados);
};

/**
 * 2. Estadísticas de creativos agrupados por su profesión
 * Caso de uso del PDF: RF-02 (Personalizar perfil de creativo) & RF-03 (Publicar portafolio)
 * Relaciones: perfil_creativo.user_id -> usuarios._id
 *             publicaciones.creativo_id -> perfil_creativo._id
 */
export const getCreativosPorProfesion = async (req, res) => {
  const pipeline = [
    // 1. Unir con la colección usuarios para obtener el nombre del creativo
    {
      $lookup: {
        from: 'usuarios',
        localField: 'user_id',
        foreignField: '_id',
        as: 'usuario_info'
      }
    },
    { $unwind: '$usuario_info' },
    // 2. Unir con publicaciones del portafolio del creativo
    {
      $lookup: {
        from: 'publicaciones',
        localField: '_id',
        foreignField: 'creativo_id',
        as: 'publicaciones_info'
      }
    },
    // 3. Proyectar campos calculando la cantidad de publicaciones en portafolio
    {
      $project: {
        _id: 1,
        nombre_completo: '$usuario_info.nombre',
        profesiones: 1,
        rating_promedio: 1,
        total_publicaciones: { $size: '$publicaciones_info' }
      }
    },
    // 4. Deshacer el arreglo de profesiones para agrupar por profesión individual
    { $unwind: '$profesiones' },
    // 5. Agrupar por profesión, obteniendo métricas clave
    {
      $group: {
        _id: '$profesiones',
        cantidad_creativos: { $sum: 1 },
        rating_promedio_profesion: { $avg: '$rating_promedio' },
        total_obras_portafolio: { $sum: '$total_publicaciones' }
      }
    },
    // 6. Ordenar por cantidad de creativos descendente
    { $sort: { cantidad_creativos: -1 } }
  ];

  const resultados = await PerfilCreativo.aggregate(pipeline);
  res.json(resultados);
};

/**
 * 3. Auditoría cruzada de agendamiento y pago de asesorías
 * Caso de uso del PDF: RF-11 (Ofrecer asesorías), RF-12 (Solicitar asesoría) & RF-16 (Pagos)
 * Relaciones: asesoria.pago_id -> pagos._id
 *             asesoria.solicitud_id -> solicitudes._id
 *             solicitudes.usuario_id -> usuarios._id (cliente)
 *             solicitudes.oferta_asesoria_id -> oferta_asesoria._id
 *             oferta_asesoria.perfil_creativo_id -> perfil_creativo._id
 *             perfil_creativo.user_id -> usuarios._id (creativo)
 */
export const getAuditoriaAsesorias = async (req, res) => {
  const pipeline = [
    // 1. Obtener detalles del pago
    {
      $lookup: {
        from: 'pagos',
        localField: 'pago_id',
        foreignField: '_id',
        as: 'pago'
      }
    },
    { $unwind: '$pago' },
    // 2. Obtener detalles de la solicitud
    {
      $lookup: {
        from: 'solicitudes',
        localField: 'solicitud_id',
        foreignField: '_id',
        as: 'solicitud'
      }
    },
    { $unwind: '$solicitud' },
    // 3. Obtener datos del cliente que solicitó la asesoría
    {
      $lookup: {
        from: 'usuarios',
        localField: 'solicitud.usuario_id',
        foreignField: '_id',
        as: 'usuario_cliente'
      }
    },
    { $unwind: '$usuario_cliente' },
    // 4. Obtener la oferta de asesoría relacionada
    {
      $lookup: {
        from: 'oferta_asesoria',
        localField: 'solicitud.oferta_asesoria_id',
        foreignField: '_id',
        as: 'oferta'
      }
    },
    { $unwind: '$oferta' },
    // 5. Obtener el perfil creativo que oferta la asesoría
    {
      $lookup: {
        from: 'perfil_creativo',
        localField: 'oferta.perfil_creativo_id',
        foreignField: '_id',
        as: 'creativo_perfil'
      }
    },
    { $unwind: '$creativo_perfil' },
    // 6. Obtener los datos del usuario del creativo
    {
      $lookup: {
        from: 'usuarios',
        localField: 'creativo_perfil.user_id',
        foreignField: '_id',
        as: 'usuario_creativo'
      }
    },
    { $unwind: '$usuario_creativo' },
    // 7. Proyectar la auditoría estructurada final
    {
      $project: {
        _id: 1,
        link_reunion: 1,
        video_grabacion: 1,
        monto_pagado: '$pago.monto',
        estado_pago: '$pago.estado',
        cliente: {
          id: '$usuario_cliente._id',
          nombre: '$usuario_cliente.nombre',
          correo: '$usuario_cliente.correo'
        },
        creativo: {
          id: '$usuario_creativo._id',
          nombre: '$usuario_creativo.nombre',
          correo: '$usuario_creativo.correo'
        },
        fecha_asesoria: '$solicitud.fecha',
        horario: {
          inicio: '$solicitud.hora_inicio',
          fin: '$solicitud.hora_fin'
        }
      }
    }
  ];

  const resultados = await Asesoria.aggregate(pipeline);
  res.json(resultados);
};

/**
 * ============================================================================
 * CONSULTAS HÍBRIDAS (VectorSearch + filters)
 * ============================================================================
 */

/**
 * 4. Búsqueda semántica en transcripciones filtrando por estrategia de chunking
 * Caso de uso del PDF: RF-09 (Transcripción automática)
 * Nota: Pre-filtrado a nivel de $vectorSearch
 */
export const getTranscripcionesEstrategia = async (req, res) => {
  const { query, estrategia } = req.query;
  const limit = req.query.limit ? Number(req.query.limit) : 5;

  if (!query) {
    throw httpError(400, 'El parámetro "query" es obligatorio.');
  }

  const queryVector = await embed(query);

  const vectorSearchStage = {
    index: 'rag_transcripciones',
    path: 'vector_embedding',
    queryVector,
    numCandidates: limit * 10,
    limit
  };

  // Si se provee una estrategia, aplicarla en el filtro de Atlas Vector Search
  if (estrategia) {
    vectorSearchStage.filter = { 'metadata.estrategia_chunking': estrategia };
  }

  const pipeline = [
    { $vectorSearch: vectorSearchStage },
    {
      $project: {
        _id: 1,
        transcripcion_id: 1,
        contenido_segmento: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ];

  const resultados = await VectorTranscripciones.aggregate(pipeline);
  res.json(resultados);
};

/**
 * 5. Búsqueda semántica en videos de cursos filtrada por presupuesto y categoría
 * Caso de uso del PDF: RF-09 (Transcripción de videos) & RF-08 (Buscar cursos según habilidad y presupuesto)
 * Nota: Post-filtrado con $match tras realizar un $lookup a cursos
 */
export const getBuscarCursosTranscripcion = async (req, res) => {
  const { query, maxPrecio, categoria } = req.query;
  const limit = req.query.limit ? Number(req.query.limit) : 5;

  if (!query) {
    throw httpError(400, 'El parámetro "query" es obligatorio.');
  }

  const queryVector = await embed(query);

  const pipeline = [
    // 1. Búsqueda semántica (obtenemos suficientes candidatos para post-filtrado)
    {
      $vectorSearch: {
        index: 'rag_transcripciones',
        path: 'vector_embedding',
        queryVector,
        numCandidates: 100,
        limit: 20
      }
    },
    // 2. Unir con transcripciones principales para obtener el source_id
    {
      $lookup: {
        from: 'transcripciones',
        localField: 'transcripcion_id',
        foreignField: '_id',
        as: 'trans_info'
      }
    },
    { $unwind: '$trans_info' },
    // 3. Unir con cursos donde el source_id sea un capítulo de ese curso
    {
      $lookup: {
        from: 'cursos',
        localField: 'trans_info.source_id',
        foreignField: 'capitulos._id',
        as: 'curso_info'
      }
    },
    { $unwind: '$curso_info' }
  ];

  // 4. Construir el filtro $match dinámicamente
  const matchConditions = [];
  if (maxPrecio != null) {
    matchConditions.push({ 'curso_info.precio': { $lte: Number(maxPrecio) } });
  }
  if (categoria) {
    matchConditions.push({ 'curso_info.categorias': categoria });
  }

  if (matchConditions.length > 0) {
    pipeline.push({
      $match: {
        $and: matchConditions
      }
    });
  }

  // 5. Proyectar los resultados y limitar
  pipeline.push(
    {
      $project: {
        _id: 1,
        score: { $meta: 'vectorSearchScore' },
        contenido_segmento: 1,
        metadata: 1,
        curso: {
          id: '$curso_info._id',
          nombre: '$curso_info.nombre',
          precio: '$curso_info.precio',
          categorias: '$curso_info.categorias'
        }
      }
    },
    { $limit: limit }
  );

  const resultados = await VectorTranscripciones.aggregate(pipeline);
  res.json(resultados);
};

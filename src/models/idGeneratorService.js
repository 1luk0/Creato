import Contador from '../models/Contador.js';

/**
 * Servicio para generar IDs secuenciales con prefijo personalizado
 * @param {String} coleccionNombre - Nombre de la colección en la BD (ej: 'usuarios')
 * @param {String} prefijo - Prefijo para el ID (ej: 'US', 'OF')
 * @returns {Promise<String>} - Retorna el ID listo (ej: 'US_1')
 */
export const generarSiguienteId = async (coleccionNombre, prefijo) => {
  try {
    const contador = await Contador.findByIdAndUpdate(
      coleccionNombre,
      { $inc: { secuencia: 1 } },
      { new: true, upsert: true } // Si no existe el registro del contador, lo crea en 1
    );
    
    return `${prefijo}_${contador.secuencia}`;
  } catch (error) {
    throw new Error(`Error al generar el ID secuencial para ${coleccionNombre}: ${error.message}`);
  }
};
const db = require("../config/db");

const Indicadores = {};

// Crear un nuevo indicador
Indicadores.createIndicador = async (asignaturaId, periodoId, salonId, descripcion) => {
  const query = `
    INSERT INTO indicadores (asignatura_id, periodo_id, salon_id, descripcion, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW());
  `;
  await db.query(query, [asignaturaId, periodoId, salonId, descripcion]);
};

// Actualizar un indicador
Indicadores.updateIndicador = async (id, descripcion) => {
  const query = `
      UPDATE indicadores 
      SET descripcion = ?, updated_at = NOW()
      WHERE id = ?;
    `;
  await db.query(query, [descripcion, id]);
};

// Eliminar un indicador
Indicadores.deleteIndicador = async (periodoId, salonId) => {
  const query = `DELETE FROM indicadores WHERE periodo_id = ? AND salon_id = ?;`;
  await db.query(query, [periodoId, salonId]);
};

// Obtener un indicador por ID (para validación de propiedad del profesor)
Indicadores.getIndicadorById = async (id) => {
  const query = `SELECT * FROM indicadores WHERE id = ?;`;
  const [rows] = await db.query(query, [id]);
  return rows[0] || null;
};

// Obtener indicadores por asignatura y periodo y salón
Indicadores.getIndicadorByAsignaturaPeriodoSalon = async (asignaturaId, periodoId, salonId) => {
  const query = `
    SELECT * FROM indicadores
    WHERE asignatura_id = ? AND periodo_id = ? AND salon_id = ?;
  `;
  const [rows] = await db.query(query, [asignaturaId, periodoId, salonId]);
  return rows[0] || null;
};

// Obtener indicadores por periodo y salón
Indicadores.getIndicadorByPeriodoSalon = async (periodoId, salonId) => {
  const query = `
    SELECT * FROM indicadores
    WHERE periodo_id = ? AND salon_id = ?;
  `;
  const [rows] = await db.query(query, [periodoId, salonId]);
  return rows;
};

// Obtener todos los indicadores de un docente
Indicadores.getIndicadoresByDocente = async (teacherId) => {
  const query = `
    SELECT i.*, a.nombre AS asignatura_nombre, p.nombre AS periodo_nombre
    FROM indicadores i
    INNER JOIN asignaturas a ON i.asignatura_id = a.id
    INNER JOIN periodos p ON i.periodo_id = p.id
    INNER JOIN profesores_has_asignaturas_has_salones phas
      ON phas.asignatura_id = i.asignatura_id
    WHERE phas.teachers_id = ?
    GROUP BY i.id
    ORDER BY p.id, a.nombre;
  `;
  const [rows] = await db.query(query, [teacherId]);
  return rows;
};

module.exports = Indicadores;

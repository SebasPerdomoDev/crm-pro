const db = require("../config/db");

const Asignatura = {};

// Crear una asignatura
Asignatura.createAsignatura = async (asignaturaData, result) => {
  const sqlInsertAsignatura = `
    INSERT INTO asignaturas (nombre, descripcion, created_at, updated_at) 
    VALUES (?, ?, NOW(), NOW())
  `;

  try {
    const [asignaturaResult] = await db.query(sqlInsertAsignatura, [
      asignaturaData.nombre,
      asignaturaData.descripcion || null,
    ]);

    const asignaturaId = asignaturaResult.insertId;
    result(null, { asignaturaId });
  } catch (error) {
    result(error, null);
  }
};

// Actualizar una asignatura
Asignatura.updateAsignatura = async (asignaturaId, updatedData, result) => {
  const sqlUpdateAsignatura = `
    UPDATE asignaturas SET nombre = ?, descripcion = ?, updated_at = NOW() WHERE id = ?
  `;

  try {
    await db.query(sqlUpdateAsignatura, [
      updatedData.nombre,
      updatedData.descripcion || null,
      asignaturaId,
    ]);
    result(null, { success: true });
  } catch (error) {
    result(error, null);
  }
};

// Eliminar una asignatura
Asignatura.deleteAsignatura = async (asignaturaId, result) => {
  const sqlDeleteAsignatura = `DELETE FROM asignaturas WHERE id = ?`;

  try {
    await db.query(sqlDeleteAsignatura, [asignaturaId]);
    result(null, { success: true });
  } catch (error) {
    result(error, null);
  }
};

module.exports = Asignatura;

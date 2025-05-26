const db = require("../config/db");

const Salon = {};


// Crear un salón
Salon.createSalon = async (salonData, result) => {
  const sqlInsertSalon = `
    INSERT INTO salones (nombre, grado, director_id, horario_image, created_at, updated_at) 
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [salonResult] = await connection.query(sqlInsertSalon, [
      salonData.nombre,
      salonData.grado,
      salonData.director_id || null,
      null, // Se actualizará si se sube una imagen
    ]);

    const salonId = salonResult.insertId;
    await connection.commit();
    result(null, { salonId });
  } catch (err) {
    await connection.rollback();
    result(err, null);
  } finally {
    connection.release();
  }
};

// Eliminar un salón
Salon.deleteSalon = async (salonId, result) => {
  const sqlDeleteSalon = `DELETE FROM salones WHERE id = ?`;

  try {
    await db.query(sqlDeleteSalon, [salonId]);
    result(null, { success: true });
  } catch (error) {
    result(error, null);
  }
};

Salon.updateHorarioImage = async (salonId, imageUrl, result) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Validar que el salón existe y el director tiene permisos
    const [salon] = await connection.query(
      `SELECT id, director_id FROM salones WHERE id = ?`,
      [salonId]
    );

    if (!salon.length) {
      throw new Error(`El salón con ID ${salonId} no existe.`);
    }

    // Actualizar la URL del horario en la tabla salones
    await connection.query(
      `UPDATE salones SET horario_image = ? WHERE id = ?`,
      [imageUrl, salonId]
    );

    await connection.commit();
    result(null, { message: "Horario actualizado correctamente." });
  } catch (err) {
    await connection.rollback();
    result(err, null);
  } finally {
    connection.release();
  }
};

Salon.getHorarioImage = async (salonId, result) => {
  const connection = await db.getConnection();

  try {
    // Validar que el salón existe y que el director tiene permisos
    const [salon] = await connection.query(
      `SELECT nombre, grado, horario_image FROM salones WHERE id = ?`,
      [salonId]
    );

    if (!salon.length) {
      throw new Error(
        `No tienes permisos para ver el horario de este salón o no existe.`
      );
    }

    result(null, salon);
  } catch (err) {
    result(err, null);
  } finally {
    connection.release();
  }
};

module.exports = Salon;

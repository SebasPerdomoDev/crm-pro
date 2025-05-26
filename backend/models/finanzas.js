const db = require("../config/db");

const Finanzas = {};

Finanzas.getFinanzas = async (userId, rolId, result) => {
  try {
    const query =
      rolId === 1 //  Si es rector, obtiene todos los pagos
        ? `
        SELECT 
          p.id AS pago_id, 
          p.students_id, 
          p.monto, 
          DATE_FORMAT(p.fecha, '%Y-%m-%d') AS fecha,
          p.razon_pago, 
          sal.grado, 
          sal.nombre AS salon_nombre, 
          u.first_name,
          u.second_name, 
          u.apellido
        FROM pagos p
        INNER JOIN students st ON p.students_id = st.users_id
        INNER JOIN salones sal ON st.salon_id = sal.id
        INNER JOIN users u ON st.users_id = u.id
        ORDER BY p.fecha DESC;`
        : `
        SELECT 
          p.id AS pago_id, 
          p.students_id, 
          p.monto, 
          DATE_FORMAT(p.fecha, '%Y-%m-%d') AS fecha,
          p.razon_pago, 
          sal.grado, 
          sal.nombre AS salon_nombre, 
          u.first_name,
          u.second_name, 
          u.apellido
        FROM pagos p
        INNER JOIN students st ON p.students_id = st.users_id
        INNER JOIN salones sal ON st.salon_id = sal.id
        INNER JOIN users u ON st.users_id = u.id
        WHERE p.students_id = ? 
        ORDER BY p.fecha DESC;`;

    const params = rolId === 1 ? [] : [userId];

    const [rows] = await db.query(query, params);

    if (rows.length > 0) {
      result(null, rows);
    } else {
      result({ message: "No se encontraron pagos" }, null);
    }
  } catch (error) {
    console.error("Error al obtener finanzas:", error);
    result(error, null);
  }
};

Finanzas.getFinanzaById = async (finanzaId, result) => {
  try {
    const [finanza] = await db.query(
      `SELECT 
          p.id AS pago_id, 
          p.students_id, 
          p.monto, 
          DATE_FORMAT(p.fecha, '%Y-%m-%d') AS fecha,
          p.razon_pago, 
          sal.grado, 
          sal.nombre AS salon_nombre, 
          u.first_name, 
          u.second_name, 
          u.apellido
      FROM pagos p
      INNER JOIN students st ON p.students_id = st.users_id
      INNER JOIN salones sal ON st.salon_id = sal.id
      INNER JOIN users u ON st.users_id = u.id
      WHERE p.id = ?
      ORDER BY p.fecha DESC;
      `,
      [finanzaId]
    );
    if (finanza.length > 0) {
      result(null, finanza[0]); // Devolver solo el primer resultado
    } else {
      result({ message: "No se encontró la finanza" }, null);
    }
  } catch (error) {
    console.error("Error al obtener finanza:", error);
    result(error, null);
  }
};

Finanzas.createFinanza = async (finanza, result) => {
  const sql = `INSERT INTO pagos (
        students_id, 
        monto, 
        fecha, 
        razon_pago, 
        created_at, 
        updated_at) 
    VALUES (?, ?, ?, ?, ?, ?);`;
  const connection = await db.getConnection(); // Obtén una conexión del pool
  try {
    await connection.beginTransaction(); // Inicia la transacción
    const [createdFinanza] = await connection.query(sql, [
      finanza.students_id,
      finanza.monto,
      finanza.fecha,
      finanza.razon_pago,
      new Date(),
      new Date(),
    ]);

    const finanzaId = createdFinanza.insertId; // ID del usuario insertado

    await connection.commit(); // Confirma la transacción
    result(null, { finanzaId, ...finanza });
  } catch (error) {
    await connection.rollback(); // Revertir la transacción en caso de error
    console.error("Error al crear finanza:", error);
    result(error, null);
  } finally {
    connection.release(); // Libera la conexión al pool
  }
};

Finanzas.updateFinanza = async (id, pagoData, rectorId, result) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar si el rector está autorizado
    const [rector] = await connection.query(
      `SELECT id, rol_id FROM users WHERE id = ? AND rol_id = 1`,
      [rectorId]
    );
    if (rector.length === 0) {
      throw new Error("Solo el rector puede realizar esta acción.");
    }

    // Verificar si el pago existe
    const [pago] = await connection.query(`SELECT * FROM pagos WHERE id = ?`, [
      id,
    ]);
    if (pago.length === 0) {
      throw new Error("Pago no encontrado.");
    }

    const existingPago = pago[0];

    // Actualizar solo los campos proporcionados
    const updateQuery = `
      UPDATE pagos SET 
          students_id = ?, 
          monto = ?, 
          fecha = ?, 
          razon_pago = ?, 
          updated_at = ?
      WHERE id = ?;
    `;
    const [updateResult] = await connection.query(updateQuery, [
      pagoData.students_id || existingPago.students_id,
      pagoData.monto || existingPago.monto,
      pagoData.fecha || existingPago.fecha,
      pagoData.razon_pago || existingPago.razon_pago,
      new Date(),
      id,
    ]);

    if (updateResult.affectedRows === 0) {
      throw new Error("El pago no fue actualizado.");
    }

    await connection.commit();
    result(null, {
      success: true,
      message: "Pago actualizado correctamente.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al actualizar finanza:", error);
    result(error, null);
  } finally {
    connection.release();
  }
};

Finanzas.deleteFinanza = async (id, result) => {
  const connection = await db.getConnection(); // Obtén una conexión para manejar transacciones
  try {
    await connection.beginTransaction(); // Inicia una transacción

    // Verificar si la finanza existe
    const [finanza] = await connection.query(
      `SELECT * FROM pagos WHERE id = ?;`,
      [id]
    );
    if (finanza.length === 0) {
      result({ message: `La finanza con ID ${id} no fue encontrada.` }, null);
      return;
    }

    // Eliminar la finanza
    const [deleted] = await connection.query(
      `DELETE FROM pagos WHERE id = ?;`,
      [id]
    );
    if (deleted.affectedRows === 0) {
      result({ message: "No se pudo eliminar el pago." }, null);
      return;
    }

    await connection.commit(); // Confirma la transacción
    result(null, { success: true, message: "Pago eliminado correctamente." });
  } catch (error) {
    await connection.rollback(); // Revertir la transacción en caso de error
    console.error("Error al eliminar finanza:", error);
    result(error, null);
  } finally {
    connection.release(); // Libera la conexión al pool
  }
};

module.exports = Finanzas;

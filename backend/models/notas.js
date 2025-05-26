const db = require("../config/db");

const Notas = {};

// Verificar si un usuario es profesor y director de un salón
Notas.isDirector = async (userId) => {
  const query = `
      SELECT t.id AS teacher_id, s.id AS salon_id, s.grado
      FROM teachers t
      INNER JOIN salones s ON t.id = s.director_id
      WHERE t.users_id = ?;
    `;
  const [result] = await db.query(query, [userId]);
  return result.length > 0 ? result[0] : null;
};

// Obtener notas por asignatura
Notas.getNotasByAsignatura = async (asignaturaId, result) => {
  try {
    const sqlQuery = `
          SELECT 
            g.id AS calificacion_general_id,
            g.students_id,
            u.first_name,
            u.second_name,
            u.apellido,
            g.promedio_final,
            g.tipo_calificacion,
            p.id AS calificacion_periodo_id,
            p.periodo_id,
            p.calificacion,
            p.simbolo_carita,
            per.nombre AS periodo_nombre
          FROM calificaciones_generales g
          LEFT JOIN calificaciones_periodos p ON g.id = p.calificacion_general_id
          LEFT JOIN users u ON g.students_id = u.id
          LEFT JOIN periodos per ON p.periodo_id = per.id
          WHERE g.asignatura_id = ?
          ORDER BY u.first_name, u.apellido, p.periodo_id;
        `;

    const [rows] = await db.query(sqlQuery, [asignaturaId]);

    if (rows.length === 0) {
      return result(
        { message: "No se encontraron calificaciones para esta asignatura." },
        null
      );
    }

    // Agrupar calificaciones por estudiante
    const groupedData = rows.reduce((acc, row) => {
      if (!acc[row.students_id]) {
        acc[row.students_id] = {
          students_id: row.students_id,
          estudiante_nombre: `${row.first_name} ${row.second_name || ""} ${
            row.apellido
          }`.trim(),
          promedio_final: row.promedio_final,
          tipo_calificacion: row.tipo_calificacion,
          periodos: [],
        };
      }
      acc[row.students_id].periodos.push({
        periodo_id: row.periodo_id,
        periodo_nombre: row.periodo_nombre,
        calificacion: row.calificacion,
        simbolo_carita: row.simbolo_carita,
      });
      return acc;
    }, {});

    result(null, Object.values(groupedData));
  } catch (error) {
    console.error(
      "Error al obtener calificaciones por asignatura:",
      error.message
    );
    result(error, null);
  }
};

Notas.getNotasByStudent = async (studentId, result) => {
  try {
    const sqlQuery = `
        SELECT 
          g.students_id,
          u.first_name,
          u.second_name,
          u.apellido,
          g.id AS calificacion_general_id,
          g.asignatura_id,
          a.nombre AS asignatura_nombre,
          g.promedio_final,
          g.tipo_calificacion,
          p.id AS calificacion_periodo_id,
          p.periodo_id,
          p.calificacion,
          p.simbolo_carita,
          per.nombre AS periodo_nombre
        FROM calificaciones_generales g
        INNER JOIN users u ON g.students_id = u.id
        LEFT JOIN calificaciones_periodos p ON g.id = p.calificacion_general_id
        LEFT JOIN asignaturas a ON g.asignatura_id = a.id
        LEFT JOIN periodos per ON p.periodo_id = per.id
        WHERE g.students_id = ?
        ORDER BY a.nombre, p.periodo_id;
      `;

    const [rows] = await db.query(sqlQuery, [studentId]);

    if (rows.length === 0) {
      return result(
        { message: "No se encontraron calificaciones para este estudiante." },
        null
      );
    }

    // Agrupar calificaciones por asignatura
    // const groupedData = rows.reduce((acc, row) => {
    //   if (!acc[row.asignatura_id]) {
    //     acc[row.asignatura_id] = {
    //       asignatura_id: row.asignatura_id,
    //       asignatura_nombre: row.asignatura_nombre,
    //       promedio_final: row.promedio_final,
    //       tipo_calificacion: row.tipo_calificacion,
    //       periodos: [],
    //     };
    //   }
    //   acc[row.asignatura_id].periodos.push({
    //     periodo_id: row.periodo_id,
    //     periodo_nombre: row.periodo_nombre,
    //     calificacion: row.calificacion,
    //     simbolo_carita: row.simbolo_carita,
    //   });
    //   return acc;
    // }, {});

    result(null, rows);
  } catch (error) {
    console.error(
      "Error al obtener calificaciones por estudiante:",
      error.message
    );
    result(error, null);
  }
};

Notas.getNotasByDirector = async (directorId, result) => {
  try {
    const sqlQuery = `
        SELECT 
          p.id,
          sal.id AS salon_id,
          sal.nombre AS salon_nombre,
          g.students_id,
          u.first_name,
          u.second_name,
          u.apellido,
          g.asignatura_id,
          a.nombre AS asignatura_nombre,
          g.promedio_final,
          p.periodo_id,
          per.nombre AS periodo_nombre,
          p.calificacion,
          p.simbolo_carita
        FROM salones sal
        INNER JOIN students s ON sal.id = s.salon_id
        INNER JOIN users u ON s.users_id = u.id
        INNER JOIN calificaciones_generales g ON g.students_id = s.users_id
        LEFT JOIN calificaciones_periodos p ON g.id = p.calificacion_general_id
        LEFT JOIN asignaturas a ON g.asignatura_id = a.id
        LEFT JOIN periodos per ON p.periodo_id = per.id
        WHERE sal.director_id = ?
        ORDER BY a.nombre, u.first_name, u.apellido, p.periodo_id;
      `;

    const [rows] = await db.query(sqlQuery, [directorId]);

    if (rows.length === 0) {
      return result(
        { message: "No se encontraron calificaciones para este director." },
        null
      );
    }

    result(null, rows);
  } catch (error) {
    console.error(
      "Error al obtener calificaciones por director:",
      error.message
    );
    result(error, null);
  }
};

Notas.getNotasByPeriodo = async (periodoId, result) => {
  try {
    const sqlQuery = `
        SELECT 
          g.id AS calificacion_general_id,
          g.asignatura_id,
          a.nombre AS asignatura_nombre,
          g.students_id,
          u.first_name,
          u.second_name,
          u.apellido,
          p.calificacion,
          p.simbolo_carita
        FROM calificaciones_generales g
        LEFT JOIN calificaciones_periodos p ON g.id = p.calificacion_general_id
        LEFT JOIN asignaturas a ON g.asignatura_id = a.id
        LEFT JOIN users u ON g.students_id = u.id
        WHERE p.periodo_id = ?
        ORDER BY a.nombre, u.first_name, u.apellido;
      `;

    const [rows] = await db.query(sqlQuery, [periodoId]);

    if (rows.length === 0) {
      return result(
        { message: "No se encontraron calificaciones para este periodo." },
        null
      );
    }

    result(null, rows);
  } catch (error) {
    console.error(
      "Error al obtener calificaciones por periodo:",
      error.message
    );
    result(error, null);
  }
};

Notas.getNotasByGrado = async (grado, result) => {
  try {
    const sqlQuery = `
        SELECT 
          sal.grado,
          g.students_id,
          u.first_name,
          u.second_name,
          u.apellido,
          g.asignatura_id,
          a.nombre AS asignatura_nombre,
          g.promedio_final,
          p.periodo_id,
          p.calificacion,
          p.simbolo_carita,
          per.nombre AS periodo_nombre
        FROM calificaciones_generales g
        LEFT JOIN calificaciones_periodos p ON g.id = p.calificacion_general_id
        LEFT JOIN students s ON g.students_id = s.users_id
        LEFT JOIN salones sal ON s.salon_id = sal.id
        LEFT JOIN asignaturas a ON g.asignatura_id = a.id
        LEFT JOIN users u ON s.users_id = u.id
        LEFT JOIN periodos per ON p.periodo_id = per.id
        WHERE sal.grado = ?
        ORDER BY a.nombre, u.first_name, u.apellido, p.periodo_id;
      `;

    const [rows] = await db.query(sqlQuery, [grado]);

    if (rows.length === 0) {
      return result(
        { message: "No se encontraron calificaciones para este grado." },
        null
      );
    }

    result(null, rows);
  } catch (error) {
    console.error("Error al obtener calificaciones por grado:", error.message);
    result(error, null);
  }
};

Notas.getNotasForAdmin = async () => {
  try {
    const sqlQuery = `
      SELECT 
          p.id,
          sal.id AS salon_id,
          sal.nombre AS salon_nombre,
          g.students_id,
          u.first_name,
          u.second_name,
          u.apellido,
          g.asignatura_id,
          a.nombre AS asignatura_nombre,
          g.promedio_final,
          p.periodo_id,
          per.nombre AS periodo_nombre,
          p.calificacion,
          p.simbolo_carita
        FROM salones sal
        INNER JOIN students s ON sal.id = s.salon_id
        INNER JOIN users u ON s.users_id = u.id
        INNER JOIN calificaciones_generales g ON g.students_id = s.users_id
        LEFT JOIN calificaciones_periodos p ON g.id = p.calificacion_general_id
        LEFT JOIN asignaturas a ON g.asignatura_id = a.id
        LEFT JOIN periodos per ON p.periodo_id = per.id
        ORDER BY a.nombre, u.first_name, u.apellido, p.periodo_id;
    `;

    const [rows] = await db.query(sqlQuery);
    return rows;
  } catch (error) {
    console.error("Error fetching notas for admin:", error);
    throw error; // Deja que el controlador maneje este error
  }
};

// Obtener todos los periodos
Notas.getPeriodos = async (result) => {
  try {
    const sqlQuery = `
      SELECT id, nombre 
      FROM periodos
      ORDER BY id;
    `;

    const [rows] = await db.query(sqlQuery);

    if (rows.length === 0) {
      return result({ message: "No se encontraron periodos." }, null);
    }

    result(null, rows);
  } catch (error) {
    console.error("Error al obtener periodos:", error.message);
    result(error, null);
  }
};

// Crear una nueva nota
Notas.createNota = async (nota, teacherId, result) => {
  const connection = await db.getConnection();
  const sqlInsert = `
          INSERT INTO calificaciones_periodos (
            calificacion_general_id,
            periodo_id,
            calificacion,
            simbolo_carita,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, NOW(), NOW());
        `;
  const sqlUpdatePromedio = `
          UPDATE calificaciones_generales
          SET promedio_final = ?
          WHERE id = ?;
        `;

  try {
    await connection.beginTransaction();

    // Verificar si el profesor es director de un salón
    const [salonDirector] = await connection.query(
      `SELECT id, grado FROM salones WHERE director_id = ?`,
      [teacherId]
    );

    if (salonDirector.length === 0) {
      throw new Error(
        "Solo los profesores directores de salón pueden agregar notas."
      );
    }

    const salonGrado = salonDirector[0].grado
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s/g, "");

    // Verificar si el estudiante pertenece al salón del profesor
    const [studentCheck] = await connection.query(
      `SELECT * FROM students WHERE users_id = ? AND salon_id = ?`,
      [nota.students_id, salonDirector[0].id]
    );

    if (studentCheck.length === 0) {
      throw new Error(
        "El estudiante no pertenece al salón del profesor director."
      );
    }

    // Determinar si el grado es de preescolar
    const esPreescolar = ["prejardin", "jardin", "transicion", "parvulos"].includes(
      salonGrado
    );

    // Obtener o crear entrada en `calificaciones_generales`
    const [generalGrade] = await connection.query(
      `SELECT id, tipo_calificacion FROM calificaciones_generales WHERE students_id = ? AND asignatura_id = ?`,
      [nota.students_id, nota.asignatura_id]
    );

    let calificacionesGeneralesId;
    let tipoCalificacion;

    if (generalGrade.length === 0) {
      tipoCalificacion = esPreescolar ? "carita" : "numerica";

      const [insertGeneral] = await connection.query(
        `INSERT INTO calificaciones_generales (
                students_id,
                asignatura_id,
                tipo_calificacion,
                created_at,
                updated_at
              ) VALUES (?, ?, ?, NOW(), NOW());`,
        [nota.students_id, nota.asignatura_id, tipoCalificacion]
      );
      calificacionesGeneralesId = insertGeneral.insertId;
    } else {
      calificacionesGeneralesId = generalGrade[0].id;
      tipoCalificacion = generalGrade[0].tipo_calificacion;
    }

    // Validar que no se pueda crear una nota para el mismo periodo y asignatura
    const [existingPeriod] = await connection.query(
      `SELECT * FROM calificaciones_periodos 
       WHERE calificacion_general_id = ? AND periodo_id = ?`,
      [calificacionesGeneralesId, nota.periodo_id]
    );

    if (existingPeriod.length > 0) {
      throw new Error(
        `Ya existe una nota registrada para el periodo ${nota.periodo_id} de esta asignatura.`
      );
    }

    // Validar que no se puedan saltar periodos
    const [lastCompletedPeriod] = await connection.query(
      `SELECT MAX(periodo_id) AS max_periodo_id
       FROM calificaciones_periodos 
       WHERE calificacion_general_id = ?`,
      [calificacionesGeneralesId]
    );

    const maxCompletedPeriodId = lastCompletedPeriod[0].max_periodo_id || 0;

    if (nota.periodo_id > maxCompletedPeriodId + 1) {
      throw new Error(
        `Debe completar el periodo ${
          maxCompletedPeriodId + 1
        } antes de registrar este periodo.`
      );
    }

    // Validar y determinar la calificación
    let calificacion = nota.calificacion;
    let simboloCarita = null;

    if (tipoCalificacion === "carita") {
      const simboloValido = ["feliz", "contento", "intermedio", "triste"].includes(
        calificacion
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
      );

      if (!simboloValido) {
        throw new Error(
          "La calificación basada en caritas debe ser 'feliz', 'contento','intermedio' o 'triste'."
        );
      }

      simboloCarita = calificacion
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      calificacion = { feliz: 5.0, contento: 4.0 ,intermedio: 3.0, triste: 1.0 }[
        simboloCarita
      ];
    } else {
      if (
        typeof calificacion !== "number" ||
        calificacion < 1.0 ||
        calificacion > 5.0
      ) {
        throw new Error("La calificación numérica debe estar entre 1.0 y 5.0.");
      }
    }

    // Insertar la nota en el periodo
    await connection.query(sqlInsert, [
      calificacionesGeneralesId,
      nota.periodo_id,
      tipoCalificacion === "carita" ? null : calificacion,
      simboloCarita
    ]);

    // // Recalcular promedio final si es necesario
    // const [calificacionesPeriodos] = await connection.query(
    //   `SELECT AVG(calificacion) AS promedio, COUNT(*) AS total_periodos
    //          FROM calificaciones_periodos
    //          WHERE calificacion_general_id = ?`,
    //   [calificacionesGeneralesId]
    // );

    // Obtener todas las notas del estudiante en esa asignatura
    const [calificacionesPeriodos] = await connection.query(
      `SELECT calificacion FROM calificaciones_periodos WHERE calificacion_general_id = ?`,
      [calificacionesGeneralesId]
    );

    // const promedioFinal =
    //   calificacionesPeriodos[0].total_periodos === 4
    //     ? calificacionesPeriodos[0].promedio
    //     : null;

    // Solo calcular promedio final si hay notas de los 4 periodos
    const promedioFinal =
      calificacionesPeriodos.length === 4
        ? Math.round(
            (calificacionesPeriodos.reduce(
              (acc, curr) => acc + curr.calificacion,
              0
            ) /
              4) *
              10
          ) / 10
        : null;

    if (promedioFinal !== null) {
      await connection.query(sqlUpdatePromedio, [
        promedioFinal,
        calificacionesGeneralesId,
      ]);
    }

    await connection.commit();
    result(null, {
      notaID: calificacionesGeneralesId,
      promedio_final: promedioFinal,
      message: `Nota agregada para el periodo ${nota.periodo_id}.`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear la nota:", error.message);
    result(error, null);
  } finally {
    connection.release();
  }
};

Notas.updateNota = async (notaId, updatedNota, teacherId, result) => {
  const connection = await db.getConnection();
  const sqlUpdate = `
        UPDATE calificaciones_periodos
        SET
          calificacion = ?,
          simbolo_carita = ?,
          updated_at = NOW()
        WHERE id = ?;
      `;
  const sqlUpdatePromedio = `
        UPDATE calificaciones_generales
        SET promedio_final = ?
        WHERE id = ?;
      `;

  try {
    await connection.beginTransaction();

    // Verificar si el profesor es director de un salón
    const [salonDirector] = await connection.query(
      `SELECT id, grado FROM salones WHERE director_id = ?`,
      [teacherId]
    );

    if (salonDirector.length === 0) {
      throw new Error(
        "Solo los profesores directores de salón pueden actualizar notas."
      );
    }

    const salonGrado = salonDirector[0].grado
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s/g, ""); // Quitar espacios, tildes y normalizar

    // Verificar si la nota existe y pertenece a un estudiante del salón del director
    const [generalGrade] = await connection.query(
      `SELECT c.id AS general_id, p.calificacion_general_id, c.tipo_calificacion
         FROM calificaciones_periodos p
         JOIN calificaciones_generales c ON p.calificacion_general_id = c.id
         WHERE p.id = ?`,
      [notaId]
    );

    if (generalGrade.length === 0) {
      throw new Error("No se encontró la nota para actualizar.");
    }

    const calificacionesGeneralesId = generalGrade[0].general_id;
    const tipoCalificacion = generalGrade[0].tipo_calificacion;

    const generalId = generalGrade[0].general_id;
    const newAsignaturaId = updatedNota.asignatura_id;

    // Verificar si se está cambiando el estudiante o la asignatura
    const [generalOriginal] = await connection.query(
      `SELECT students_id, asignatura_id FROM calificaciones_generales WHERE id = ?`,
      [generalId]
    );
    const { asignatura_id: oldAsignaturaId, students_id: studentIdOriginal } = generalOriginal[0];

    const cambiaAsignatura = newAsignaturaId !== oldAsignaturaId;

    if (cambiaAsignatura) {
      // Verificar que no exista otra nota general para ese estudiante y asignatura
      const [existeNotaDuplicada] = await connection.query(
        `SELECT id FROM calificaciones_generales 
         WHERE students_id = ? AND asignatura_id = ? AND id != ?`,
         [studentIdOriginal, newAsignaturaId, generalId]
      );

      if (existeNotaDuplicada.length > 0) {
        throw new Error("Ya existe una nota registrada para este estudiante en esa asignatura.");
      }

      // Actualizar calificaciones_generales con nuevos datos
      await connection.query(
        `UPDATE calificaciones_generales 
         SET asignatura_id = ?
         WHERE id = ?`,
        [newAsignaturaId, generalId]
      );
    }

    // Validar y determinar la nueva calificación
    let calificacion = updatedNota.calificacion;
    let simboloCarita = null;

    if (tipoCalificacion === "carita") {
      // Validar que el símbolo sea válido
      const simboloValido = ["feliz", "contento", "intermedio", "triste"].includes(
        calificacion
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
      );

      if (!simboloValido) {
        throw new Error(
          "La calificación basada en caritas debe ser 'feliz', 'contento', 'intermedio' o 'triste'."
        );
      }

      simboloCarita = calificacion
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      calificacion = { feliz: 5.0, contento: 4.0, intermedio: 3.0, triste: 1.0 }[
        simboloCarita
      ];
    } else {
      // Validar que la calificación numérica esté dentro del rango permitido
      if (
        typeof calificacion !== "number" ||
        calificacion < 1.0 ||
        calificacion > 5.0
      ) {
        throw new Error("La calificación numérica debe estar entre 1.0 y 5.0.");
      }
    }

    // Actualizar la calificación en el periodo
    await connection.query(sqlUpdate, [
      tipoCalificacion === "carita" ? null : calificacion,
      tipoCalificacion === "carita" ? simboloCarita : null,
      notaId,
    ]);
    

    // Obtener todas las notas del estudiante en esa asignatura
    const [calificacionesPeriodos] = await connection.query(
      `SELECT calificacion FROM calificaciones_periodos WHERE calificacion_general_id = ?`,
      [calificacionesGeneralesId]
    );

    // // Recalcular el promedio final para la asignatura
    // const [periodos] = await connection.query(
    //   `SELECT AVG(calificacion) AS promedio
    //        FROM calificaciones_periodos
    //        WHERE calificacion_general_id = ?`,
    //   [calificacionesGeneralesId]
    // );

    // Solo calcular promedio final si hay notas de los 4 periodos
    const promedioFinal =
      calificacionesPeriodos.length === 4
        ? Math.round(
            (calificacionesPeriodos.reduce(
              (acc, curr) => acc + curr.calificacion,
              0
            ) /
              4) *
              10
          ) / 10
        : null;

    // const promedioFinal = periodos[0].promedio || null;

    // Actualizar el promedio final en calificaciones_generales
    await connection.query(sqlUpdatePromedio, [
      promedioFinal,
      calificacionesGeneralesId,
    ]);

    // Confirmar la transacción
    await connection.commit();

    result(null, {
      message: "Nota actualizada correctamente.",
      promedio_final: promedioFinal,
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await connection.rollback();
    console.error("Error al actualizar la nota:", error.message);
    result(error, null);
  } finally {
    // Liberar la conexión
    connection.release();
  }
};

Notas.deleteNota = async (notaId, teacherId, result) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verificar si el profesor es director de un salón
    const [salonDirector] = await connection.query(
      `SELECT id, grado FROM salones WHERE director_id = ?`,
      [teacherId]
    );

    if (salonDirector.length === 0) {
      throw new Error(
        "Solo los profesores directores de salón pueden eliminar notas."
      );
    }

    // Verificar si la calificación pertenece a un estudiante del salón del profesor
    const [notaCheck] = await connection.query(
      `SELECT p.calificacion_general_id, p.periodo_id, c.students_id, c.asignatura_id
         FROM calificaciones_periodos p
         INNER JOIN calificaciones_generales c ON p.calificacion_general_id = c.id
         INNER JOIN students s ON c.students_id = s.users_id
         WHERE p.id = ? AND s.salon_id = ?`,
      [notaId, salonDirector[0].id]
    );

    if (notaCheck.length === 0) {
      throw new Error(
        "La nota no pertenece al salón del profesor director o no existe."
      );
    }

    const { calificacion_general_id } = notaCheck[0];

    // Eliminar la nota del periodo
    await connection.query(`DELETE FROM calificaciones_periodos WHERE id = ?`, [
      notaId,
    ]);

    // Verificar si quedan periodos asociados a la calificación general
    const [remainingPeriodos] = await connection.query(
      `SELECT COUNT(*) AS total FROM calificaciones_periodos WHERE calificacion_general_id = ?`,
      [calificacion_general_id]
    );

    if (remainingPeriodos[0].total === 0) {
      // Si no quedan periodos, eliminar la calificación general
      await connection.query(
        `DELETE FROM calificaciones_generales WHERE id = ?`,
        [calificacion_general_id]
      );
    } 
    // else {
    //   // Recalcular el promedio final si quedan periodos
    //   const [promedioData] = await connection.query(
    //     `SELECT AVG(calificacion) AS promedio
    //      FROM calificaciones_periodos
    //      WHERE calificacion_general_id = ?`,
    //     [calificacion_general_id]
    //   );

    //   const promedioFinal = promedioData[0].promedio || null;

    //   await connection.query(
    //     `UPDATE calificaciones_generales SET promedio_final = ? WHERE id = ?`,
    //     [promedioFinal, calificacion_general_id]
    //   );
    // }
    
    const sqlUpdatePromedio = `
      UPDATE calificaciones_generales
      SET promedio_final = ?
      WHERE id = ?;
    `;

    // Si quedan menos de 4 notas, borrar el promedio final
    const promedioFinal =
      remainingPeriodos[0].total === 4
        ? Math.round(
            (
              await connection.query(
                `SELECT AVG(calificacion) AS promedio FROM calificaciones_periodos WHERE calificacion_general_id = ?`,
                [calificacion_general_id]
              )
            )[0][0].promedio * 10
          ) / 10
        : null;

    await connection.query(sqlUpdatePromedio, [
      promedioFinal,
      calificacion_general_id,
    ]);

    await connection.commit();
    result(null, {
      message: "Nota eliminada correctamente.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al eliminar la nota:", error.message);
    result(error, null);
  } finally {
    connection.release();
  }
};

module.exports = Notas;

const db = require("../config/db");

const Agenda = {};

// Crear un nuevo evento
Agenda.createEvento = async (evento, result) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Insertar el evento en la base de datos
    const [eventoResult] = await connection.query(
      `
      INSERT INTO agendas (users_id, asignatura_id, salon_id, titulo, fecha, descripcion, es_evento_general, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        evento.users_id,
        evento.asignatura_id || null,
        evento.salon_id || null,
        evento.titulo,
        evento.fecha,
        evento.descripcion,
        evento.es_evento_general,
        new Date(),
        new Date(),
      ]
    );

    if (!eventoResult || !eventoResult.insertId) {
      throw new Error("No se recibió insertId después de la inserción.");
    }

    const eventoId = eventoResult.insertId;
    console.log(`✅ Evento creado correctamente con ID: ${eventoId}`);

    // Insertar fotos asociadas al evento
    // if (fotos && fotos.length > 0) {
    //   const fotoValues = fotos.map((foto) => [
    //     eventoId,
    //     foto,
    //     new Date(),
    //     new Date(),
    //   ]);
    //   await connection.query(
    //     `
    //     INSERT INTO fotos_eventos (agenda_id, image, created_at, updated_at)
    //     VALUES ?
    //     `,
    //     [fotoValues]
    //   );
    //   console.log(`✅ Se han insertado ${fotos.length} imágenes en la BD`);
    // }

    await connection.commit();
    result(null, {
      insertId: eventoId,
      message: "Evento creado correctamente.",
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Error al crear evento:", err);
    result(err, null);
  } finally {
    connection.release();
  }
};
// Actualizar un evento
Agenda.updateEvento = async (eventoId, evento, fotos, result) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verificar si el evento existe en la BD
    const [existingEventoRows] = await connection.query(
      `SELECT * FROM agendas WHERE id = ?`,
      [eventoId]
    );

    if (existingEventoRows.length === 0) {
      console.error("Error: Evento no encontrado en la BD");
      throw new Error("Evento no encontrado.");
    }

    const existingEvento = existingEventoRows[0];

    if (!Array.isArray(fotos)) {
      console.log(
        "Advertencia: fotos no es un array, inicializando como array vacío."
      );
      fotos = [];
    }

    // Actualizar los datos del evento
    await connection.query(
      `UPDATE agendas
       SET titulo = ?, fecha = ?, descripcion = ?, salon_id = ?, asignatura_id = COALESCE(?, asignatura_id), es_evento_general = ?, updated_at = ?
       WHERE id = ?`,
      [
        evento.titulo || existingEvento.titulo,
        evento.fecha || existingEvento.fecha,
        evento.descripcion || existingEvento.descripcion,
        evento.salon_id !== undefined
          ? evento.salon_id
          : existingEvento.salon_id,
          evento.asignatura_id !== undefined && evento.asignatura_id !== ''
          ? evento.asignatura_id
          : null, // 👈 Si es '', se convierte en NULL, si no, se mantiene el existente
        evento.es_evento_general !== undefined
          ? evento.es_evento_general
          : existingEvento.es_evento_general,
        new Date(),
        eventoId,
      ]
    );

    // Insertar nuevas fotos en la BD sin borrar las anteriores
    if (fotos.length > 0) {
      console.log("🚀 Fotos para insertar en la BD:", fotos); // 👈 LOG IMPORTANTE
      const fotoValues = fotos.map((foto) => [
        eventoId,
        foto,
        new Date(),
        new Date(),
      ]);

      await connection.query(
        `INSERT INTO fotos_eventos (agenda_id, image, created_at, updated_at) VALUES ?`,
        [fotoValues]
      );
    }

    await connection.commit();
    result(null, {
      success: true,
      message: "Evento actualizado correctamente.",
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Error en al actualizar eventos", err);
    result(err, null);
  } finally {
    connection.release();
  }
};

// Eliminar un evento
Agenda.deleteEvento = async (eventoId, result) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Eliminar las fotos asociadas al evento
    await connection.query(`DELETE FROM fotos_eventos WHERE agenda_id = ?`, [
      eventoId,
    ]);

    // Eliminar el evento
    await connection.query(`DELETE FROM agendas WHERE id = ?`, [eventoId]);

    await connection.commit();
    result(null, { message: "Evento eliminado correctamente." });
  } catch (err) {
    await connection.rollback();
    result(err, null);
  } finally {
    connection.release();
  }
};
// Obtener todos los eventos
// Agenda.getEventos = async (result) => {
//   try {
//     const [eventos] = await db.query(`
//         SELECT
//           agendas.id,
//           agendas.users_id,
//           agendas.titulo,
//           agendas.fecha,
//           agendas.descripcion,
//           agendas.es_evento_general,
//           agendas.created_at,
//           agendas.updated_at,
//           salones.nombre AS salon_nombre,
//           asignaturas.nombre AS asignatura_nombre,
//           GROUP_CONCAT(fotos_eventos.image) AS fotos
//         FROM agendas
//           LEFT JOIN salones ON agendas.salon_id = salones.id
//           LEFT JOIN asignaturas ON agendas.asignatura_id = asignaturas.id
//           LEFT JOIN fotos_eventos ON agendas.id = fotos_eventos.agenda_id
//         GROUP BY agendas.id
//         ORDER BY agendas.created_at DESC
//       `);
//     result(null, eventos);
//   } catch (err) {
//     result(err, null);
//   }
// };

Agenda.getEventos = async (userId, result) => {
  try {
    // Aumentar el límite de concatenación en la sesión
    await db.query("SET SESSION group_concat_max_len = 1000000");

    //  Obtener el rol del usuario y su información relevante
    const [usuario] = await db.query(
      `SELECT u.rol_id, s.salon_id, t.id AS teacher_id
       FROM users u
       LEFT JOIN students s ON u.id = s.users_id
       LEFT JOIN teachers t ON u.id = t.users_id
       WHERE u.id = ?;`,
      [userId]
    );

    if (!usuario.length) {
      return result({ message: "Usuario no encontrado." }, null);
    }

    const { rol_id, salon_id } = usuario[0];

    //  Ajustar la consulta SQL según el rol del usuario
    const query =
      rol_id === 3 // Estudiante: Solo ve eventos generales y eventos de su salón
        ? `
          SELECT 
            a.id, 
            a.users_id, 
            a.titulo, 
            a.fecha, 
            a.descripcion, 
            a.es_evento_general, 
            a.created_at, a.updated_at, 
            s.nombre AS salon_nombre, 
            asig.nombre AS asignatura_nombre, 
            GROUP_CONCAT(fe.image) AS fotos
          FROM agendas a
            LEFT JOIN salones s ON a.salon_id = s.id
            LEFT JOIN asignaturas asig ON a.asignatura_id = asig.id
            LEFT JOIN fotos_eventos fe ON a.id = fe.agenda_id
          WHERE (a.es_evento_general = 1 OR a.salon_id = ?)
          GROUP BY a.id
          ORDER BY a.created_at DESC
        `
        : rol_id === 2 // Profesor: Solo ve eventos generales y eventos creados por él
        ? `
          SELECT 
            a.id, 
            a.users_id, 
            a.titulo, 
            a.fecha, 
            a.descripcion, 
            a.es_evento_general, 
            a.created_at, a.updated_at, 
            s.nombre AS salon_nombre, 
            asig.nombre AS asignatura_nombre, 
            GROUP_CONCAT(fe.image) AS fotos
          FROM agendas a
            LEFT JOIN salones s ON a.salon_id = s.id
            LEFT JOIN asignaturas asig ON a.asignatura_id = asig.id
            LEFT JOIN fotos_eventos fe ON a.id = fe.agenda_id
          WHERE (a.es_evento_general = 1 OR a.users_id = ?)
          GROUP BY a.id
          ORDER BY a.created_at DESC
        `
        : `
          SELECT 
            a.id, 
            a.users_id, 
            a.titulo, 
            a.fecha, 
            a.descripcion, 
            a.es_evento_general, 
            a.created_at, a.updated_at, 
            s.nombre AS salon_nombre, 
            asig.nombre AS asignatura_nombre, 
            GROUP_CONCAT(fe.image) AS fotos
          FROM agendas a
            LEFT JOIN salones s ON a.salon_id = s.id
            LEFT JOIN asignaturas asig ON a.asignatura_id = asig.id
            LEFT JOIN fotos_eventos fe ON a.id = fe.agenda_id
          GROUP BY a.id
          ORDER BY a.created_at DESC
        `;

    const params = rol_id === 3 ? [salon_id] : rol_id === 2 ? [userId] : [];

    const [eventos] = await db.query(query, params);

    const eventosFormateados = eventos.map((evento) => ({
      ...evento,
      fotos: evento.fotos ? evento.fotos.split(",") : [], // Convierte fotos en un arreglo
    }));
    result(null, eventosFormateados);
  } catch (err) {
    result(err, null);
  }
};

// Obtener eventos por fecha
// Agenda.getEventosPorFecha = async (fecha, result) => {
//   try {
//     const [eventos] = await db.query(
//       `
//         SELECT
//           agendas.id,
//           agendas.users_id,
//           agendas.titulo,
//           agendas.fecha,
//           agendas.descripcion,
//           agendas.es_evento_general,
//           agendas.created_at,
//           agendas.updated_at,
//           salones.nombre AS salon_nombre,
//           asignaturas.nombre AS asignatura_nombre,
//           GROUP_CONCAT(fotos_eventos.image) AS fotos
//         FROM agendas
//           LEFT JOIN salones ON agendas.salon_id = salones.id
//           LEFT JOIN asignaturas ON agendas.asignatura_id = asignaturas.id
//           LEFT JOIN fotos_eventos ON agendas.id = fotos_eventos.agenda_id
//         WHERE DATE(agendas.fecha) = ?
//         GROUP BY agendas.id
//         `,
//       [fecha]
//     );
//     result(null, eventos);
//   } catch (err) {
//     result(err, null);
//   }
// };

Agenda.getEventosPorFecha = async (fecha, userId, result) => {
  try {
    // 🔹 Obtener el rol del usuario y su salón (si es estudiante)
    const [usuario] = await db.query(
      `SELECT u.rol_id, s.salon_id, s.id AS student_id
       FROM users u
       LEFT JOIN students s ON u.id = s.users_id
       WHERE u.id = ?;`,
      [userId]
    );

    if (!usuario.length) {
      return result({ message: "Usuario no encontrado." }, null);
    }

    const { rol_id, salon_id } = usuario[0];

    // 🔹 Ajustar la consulta SQL según el rol del usuario
    const query =
      rol_id === 3 // Estudiante: Solo ve eventos generales y eventos de su salón
        ? `
          SELECT 
            a.id, 
            a.users_id, 
            a.titulo, 
            a.fecha, 
            a.descripcion, 
            a.es_evento_general, 
            a.created_at, a.updated_at, 
            s.nombre AS salon_nombre, 
            asig.nombre AS asignatura_nombre, 
            GROUP_CONCAT(fe.image) AS fotos
          FROM agendas a
            LEFT JOIN salones s ON a.salon_id = s.id
            LEFT JOIN asignaturas asig ON a.asignatura_id = asig.id
            LEFT JOIN fotos_eventos fe ON a.id = fe.agenda_id
          WHERE DATE(a.fecha) = ?
          AND (a.es_evento_general = 1 OR a.salon_id = ?)
          GROUP BY a.id
        `
        : rol_id === 2 // Profesor: Solo ve eventos generales y eventos creados por él
        ? `
          SELECT 
            a.id, 
            a.users_id, 
            a.titulo, 
            a.fecha, 
            a.descripcion, 
            a.es_evento_general, 
            a.created_at, a.updated_at, 
            s.nombre AS salon_nombre, 
            asig.nombre AS asignatura_nombre, 
            GROUP_CONCAT(fe.image) AS fotos
          FROM agendas a
            LEFT JOIN salones s ON a.salon_id = s.id
            LEFT JOIN asignaturas asig ON a.asignatura_id = asig.id
            LEFT JOIN fotos_eventos fe ON a.id = fe.agenda_id
          WHERE DATE(a.fecha) = ?
          AND (a.es_evento_general = 1 OR a.users_id = ?)
          GROUP BY a.id
        `
        : `
          SELECT 
            a.id, 
            a.users_id, 
            a.titulo, 
            a.fecha, 
            a.descripcion, 
            a.es_evento_general, 
            a.created_at, a.updated_at, 
            s.nombre AS salon_nombre, 
            asig.nombre AS asignatura_nombre, 
            GROUP_CONCAT(fe.image) AS fotos
          FROM agendas a
            LEFT JOIN salones s ON a.salon_id = s.id
            LEFT JOIN asignaturas asig ON a.asignatura_id = asig.id
            LEFT JOIN fotos_eventos fe ON a.id = fe.agenda_id
          WHERE DATE(a.fecha) = ?
          GROUP BY a.id
        `;

    const params =
      rol_id === 3
        ? [fecha, salon_id]
        : rol_id === 2
        ? [fecha, userId]
        : [fecha];

    const [eventos] = await db.query(query, params);

    result(null, eventos);
  } catch (err) {
    result(err, null);
  }
};

Agenda.getEventosPorID = async (eventoId, result) => {
  try {
    // 1. Obtener los datos del evento
    const [eventos] = await db.query(
      `SELECT 
        agendas.id,
        agendas.users_id,
        agendas.titulo,
        agendas.fecha,
        agendas.descripcion,
        agendas.es_evento_general,
        agendas.created_at,
        agendas.updated_at,
        agendas.salon_id,
        agendas.asignatura_id,
        salones.nombre AS salon_nombre,
        asignaturas.nombre AS asignatura_nombre
      FROM agendas
      LEFT JOIN salones ON agendas.salon_id = salones.id
      LEFT JOIN asignaturas ON agendas.asignatura_id = asignaturas.id
      WHERE agendas.id = ?`,
      [eventoId]
    );

    if (eventos.length === 0) {
      return result({ message: "Evento no encontrado" }, null);
    }

    // 2. Obtener todas las fotos asociadas a este evento
    const [fotos] = await db.query(
      `SELECT image FROM fotos_eventos WHERE agenda_id = ?`,
      [eventoId]
    );

    // 3. Agregar las fotos al evento
    const eventoConFotos = {
      ...eventos[0],
      fotos: fotos.map((f) => f.image), // Convertir a un array de URLs
    };

    result(null, [eventoConFotos]);
  } catch (err) {
    console.error("Error al obtener evento:", err);
    result(err, null);
  }
};

module.exports = Agenda;

const db = require("../config/db");
const bcrypt = require("bcryptjs");
const {
  cloudinary,
  generateCloudinaryFileName,
} = require("../utils/cloudinary"); // Ajusta la ruta según tu estructura de carpetas
const sendEmail = require("../services/emailService");
const path = require("path");

const User = {};

User.getAllStudents = async (result) => {
  const sql = `
        SELECT
            u.id AS user_id,
            u.image,
            u.correo,
            u.first_name,
            u.second_name,
            u.apellido,
            u.celular,
            u.fecha_nacimiento,
            s.nombre AS salon_nombre,
            s.grado AS salon_grado
        FROM
            users u
        INNER JOIN students st ON u.id = st.users_id
        LEFT JOIN salones s ON st.salon_id = s.id
        WHERE
            u.rol_id = 3;
    `;

  try {
    const [rows] = await db.query(sql);

    // Formatear la fecha en el backend
    const formattedRows = rows.map((row) => ({
      ...row,
      fecha_nacimiento: new Intl.DateTimeFormat("en-CA").format(
        new Date(row.fecha_nacimiento)
      ), // Devuelve en formato YYYY-MM-DD
    }));

    result(null, formattedRows);
  } catch (err) {
    console.error("Error al obtener estudiantes:", err);
    result(err, null);
  }
};

User.getAllTeachers = async (result) => {
  const sql = `
    SELECT 
        u.id AS user_id,
        u.image,
        u.correo,
        u.first_name,
        u.second_name,
        u.apellido,
        u.celular,
        u.fecha_nacimiento,
        s.nombre AS salon_nombre,
        a.nombre AS asignatura_nombre,
        sd.nombre AS salon_director
    FROM users u
    INNER JOIN teachers t ON u.id = t.users_id
    LEFT JOIN profesores_has_asignaturas_has_salones phas ON t.id = phas.teachers_id
    LEFT JOIN salones s ON phas.salon_id = s.id
    LEFT JOIN asignaturas a ON phas.asignatura_id = a.id
    LEFT JOIN salones sd ON sd.director_id = t.id
    WHERE u.rol_id = 2;
  `;

  try {
    const [rows] = await db.query(sql);

    // Agrupar los datos por profesor
    const teachersMap = rows.reduce((acc, row) => {
      if (!acc[row.user_id]) {
        acc[row.user_id] = {
          user_id: row.user_id,
          image: row.image,
          correo: row.correo,
          first_name: row.first_name,
          second_name: row.second_name,
          apellido: row.apellido,
          celular: row.celular,
          fecha_nacimiento: new Intl.DateTimeFormat("es-ES").format(
            new Date(row.fecha_nacimiento)
          ),
          salon_director: row.salon_director || null,
          asignaciones: [],
        };
      }

      // Agregar la asignación (salón y materia) al profesor actual
      if (row.salon_nombre && row.asignatura_nombre) {
        acc[row.user_id].asignaciones.push({
          salon_nombre: row.salon_nombre,
          asignatura_nombre: row.asignatura_nombre,
        });
      }

      return acc;
    }, {});

    // Convertir el mapa en un array
    const formattedData = Object.values(teachersMap);

    result(null, formattedData);
  } catch (err) {
    console.error("Error al obtener profesores:", err);
    result(err, null);
  }
};

// Obtener todas las asignaturas
User.getAllAsignaturas = async (result) => {
  const sql = "SELECT id, nombre, descripcion FROM asignaturas";
  try {
    const [rows] = await db.query(sql);
    result(null, rows);
  } catch (err) {
    console.error("Error al obtener asignaturas:", err);
    result(err, null);
  }
};

// Obtener todos los salones
User.getAllSalones = async (result) => {
  const sql = "SELECT id, nombre, grado, director_id FROM salones";
  try {
    const [rows] = await db.query(sql);
    result(null, rows);
  } catch (err) {
    console.error("Error al obtener salones:", err);
    result(err, null);
  }
};

// Modelo para obtener el salón por director
User.getSalonByDirector = async (directorId, result) => {
  try {
    const sqlQuery = `
      SELECT 
        sal.id AS salon_id,
        sal.nombre AS salon_nombre,
        sal.grado AS salon_grado,
        sal.director_id
      FROM salones sal
      WHERE sal.director_id = ?
    `;

    const [rows] = await db.query(sqlQuery, [directorId]);

    if (rows.length === 0) {
      return result(
        { message: "El director no tiene un salón asignado." },
        null
      );
    }

    result(null, rows[0]); // Devolver el primer salón encontrado
  } catch (error) {
    console.error("Error al obtener el salón por director:", error.message);
    result(error, null);
  }
};

User.createUser = async (userData, result) => {
  const sqlInsertUser = `
    INSERT INTO users (
        rol_id,
        image,
        correo,
        first_name,
        second_name,
        apellido,
        celular,
        fecha_nacimiento,
        password,
        estado,
        created_at,
        updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', NOW(), NOW())
  `;

  const connection = await db.getConnection(); // Obtener conexión del pool

  try {
    await connection.beginTransaction(); // Iniciar transacción

    // Generar y cifrar la contraseña predeterminada
    const generatePassword = (first_name) =>
      `${first_name}${new Date().getFullYear()}`;
    const hashedPassword = await bcrypt.hash(
      generatePassword(userData.first_name),
      10
    );

    // Insertar el usuario en la base de datos
    const [userResult] = await connection.query(sqlInsertUser, [
      1, // rol_id = 1 (Rector)
      null, // Imagen se actualizará después de la subida
      userData.correo,
      userData.first_name,
      userData.second_name || null,
      userData.apellido,
      userData.celular,
      userData.fecha_nacimiento,
      hashedPassword,
    ]);

    const userId = userResult.insertId; // Obtener el ID del usuario creado

    await connection.commit(); // Confirmar transacción
    result(null, { userId });
  } catch (err) {
    await connection.rollback(); // Revertir cambios en caso de error
    result(err, null);
  } finally {
    connection.release(); // Liberar conexión
  }
};

// Crear un nuevo profesor y su información asociada
User.createUserTeacher = async (teacher, result) => {
  const sqlInsertUser = `
    INSERT INTO users (
        rol_id,
        image,
        correo,
        first_name,
        second_name,
        apellido,
        celular,
        fecha_nacimiento,
        password,
        estado,
        created_at,
        updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?, ?)
    `;

  const sqlInsertTeacher = `
        INSERT INTO teachers (
            users_id,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?)
    `;

  const sqlUpdateSalonDirector = `
        UPDATE salones
        SET director_id = ?
        WHERE id = ?
    `;

  const sqlInsertTeacherAssignments = `
        INSERT INTO profesores_has_asignaturas_has_salones (
            teachers_id,
            asignatura_id,
            salon_id,
            created_at,
            updated_at
        )
        VALUES ?
    `;

  const connection = await db.getConnection(); // Obtén una conexión del pool
  try {
    await connection.beginTransaction(); // Inicia la transacción

    // Validar existencia de las asignaciones (asignatura_id y salon_id)
    for (const asignacion of teacher.asignaciones) {
      const [asignatura] = await connection.query(
        `SELECT id FROM asignaturas WHERE id = ?`,
        [asignacion.asignatura_id]
      );
      if (!asignatura.length) {
        throw new Error(
          `La asignatura con ID ${asignacion.asignatura_id} no existe.`
        );
      }

      const [salon] = await connection.query(
        `SELECT id FROM salones WHERE id = ?`,
        [asignacion.salon_id]
      );
      if (!salon.length) {
        throw new Error(`El salón con ID ${asignacion.salon_id} no existe.`);
      }
    }

    // Generar y cifrar la contraseña
    const generarPassword = (first_name) =>
      `${first_name}${new Date().getFullYear()}`;
    const hashedPassword = await bcrypt.hash(
      generarPassword(teacher.first_name),
      10
    );

    // Inserta en la tabla `users` con la imagen inicial como `null`
    const [userResult] = await connection.query(sqlInsertUser, [
      teacher.rol_id,
      null, // Se actualizará después de subir la imagen
      teacher.correo,
      teacher.first_name,
      teacher.second_name,
      teacher.apellido,
      teacher.celular,
      teacher.fecha_nacimiento,
      hashedPassword,
      new Date(),
      new Date(),
    ]);

    const userId = userResult.insertId; // ID del usuario insertado

    // Inserta en la tabla `teachers`
    const [teacherResult] = await connection.query(sqlInsertTeacher, [
      userId,
      new Date(),
      new Date(),
    ]);

    const teacherId = teacherResult.insertId; // ID del profesor insertado

    // Validar y actualizar el salón seleccionado con el director asignado
    if (teacher.director_salon) {
      const [validSalon] = await connection.query(
        `SELECT id FROM salones WHERE id = ?`,
        [teacher.director_salon]
      );

      if (!validSalon.length) {
        throw new Error(`El salón con ID ${teacher.director_salon} no existe.`);
      }

      // Actualizar el salón con el director asignado
      await connection.query(sqlUpdateSalonDirector, [
        teacherId,
        teacher.director_salon,
      ]);
    }

    // Inserta las asignaciones en la tabla `profesores_has_asignaturas_has_salones`
    const values = teacher.asignaciones.map((asignacion) => [
      teacherId,
      asignacion.asignatura_id,
      asignacion.salon_id,
      new Date(),
      new Date(),
    ]);

    if (values.length > 0) {
      await connection.query(sqlInsertTeacherAssignments, [values]);
    }

    await connection.commit(); // Confirma la transacción

    // Devolver el ID del usuario y del profesor
    result(null, { userId, teacherId });
  } catch (err) {
    await connection.rollback(); // Revertir la transacción en caso de error
    result(err, null);
  } finally {
    connection.release(); // Libera la conexión al pool
  }
};

// Actualizar la URL de la imagen en la base de datos
User.updateUserImage = async (userId, imageUrl) => {
  const sqlUpdateImage = `
        UPDATE users
        SET image = ?, updated_at = ?
        WHERE id = ?
    `;
  try {
    await db.query(sqlUpdateImage, [imageUrl, new Date(), userId]);
  } catch (err) {
    throw new Error(
      `Error al actualizar la URL de la imagen para el usuario con ID ${userId}: ${err.message}`
    );
  }
};

// Crear un nuevo estudiante y su información asociada
User.createUserStudent = async (student, result) => {
  const sqlInsertUser = `
    INSERT INTO users (
        rol_id,
        image,
        correo,
        first_name,
        second_name,
        apellido,
        celular,
        fecha_nacimiento,
        password,
        estado,
        created_at,
        updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?, ?)
    `;

  const sqlInsertStudent = `
        INSERT INTO students (
            users_id,
            salon_id,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?)
    `;

  const connection = await db.getConnection(); // Obtén una conexión del pool
  try {
    await connection.beginTransaction(); // Inicia la transacción

    // Generar y cifrar la contraseña
    const generarPassword = (first_name) =>
      `${first_name}${new Date().getFullYear()}`;
    const hashedPassword = await bcrypt.hash(
      generarPassword(student.first_name),
      10
    );

    // Inserta en la tabla `users` con la imagen inicial como `null`
    const [userResult] = await connection.query(sqlInsertUser, [
      student.rol_id,
      null, // Se actualizará después de subir la imagen
      student.correo,
      student.first_name,
      student.second_name,
      student.apellido,
      student.celular,
      student.fecha_nacimiento,
      hashedPassword,
      new Date(),
      new Date(),
    ]);

    const userId = userResult.insertId;

    // Valida que el salón exista
    if (student.salon_id) {
      const [validSalon] = await connection.query(
        `SELECT id FROM salones WHERE id = ?`,
        [student.salon_id]
      );
    
      if (!validSalon.length) {
        throw new Error(`El salón con ID ${student.salon_id} no existe.`);
      }
    }
    

    // Inserta en la tabla `students`
    const [studentResult] = await connection.query(sqlInsertStudent, [
      userId,
      student.salon_id,
      new Date(),
      new Date(),
    ]);

    const studentId = studentResult.insertId;

    await connection.commit(); // Confirma la transacción

    // Devolver el ID del usuario y del estudiante
    result(null, { userId, studentId });
  } catch (err) {
    await connection.rollback(); // Revertir la transacción en caso de error
    result(err, null);
  } finally {
    connection.release(); // Libera la conexión al pool
  }
};

// EN DESARROLLO
User.updateStudentSalon = async (studentId, newSalonId, result) => {
  const sqlUpdateStudentSalon = `
        UPDATE students
        SET salon_id = ?, updated_at = ?
        WHERE id = ?
    `;

  const connection = await db.getConnection(); // Conexión del pool

  try {
    await connection.beginTransaction(); // Inicia la transacción

    // Validar que el nuevo salón existe
    const [validSalon] = await connection.query(
      `SELECT id FROM salones WHERE id = ?`,
      [newSalonId]
    );

    if (!validSalon.length) {
      throw new Error(`El salón con ID ${newSalonId} no existe.`);
    }

    // Actualizar el salón del estudiante
    const [updateResult] = await connection.query(sqlUpdateStudentSalon, [
      newSalonId,
      new Date(),
      studentId,
    ]);

    if (updateResult.affectedRows === 0) {
      throw new Error(`El estudiante con ID ${studentId} no fue encontrado.`);
    }

    await connection.commit(); // Confirma la transacción

    result(null, { success: true, message: "Salón actualizado correctamente" });
  } catch (err) {
    await connection.rollback(); // Revertir transacción en caso de error
    result(err, null);
  } finally {
    connection.release(); // Libera la conexión al pool
  }
};

// Actualizar usuario y su información asociada
User.updateUser = async (id, userData, rectorId, result) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar que el rector es quien realiza la acción
    const [rector] = await connection.query(
      `SELECT id, rol_id FROM users WHERE id = ? AND rol_id = 1`,
      [rectorId]
    );
    if (!rector.length)
      throw new Error("Solo el rector puede realizar esta acción.");

    // Verificar que el usuario existe
    const [user] = await connection.query(`SELECT * FROM users WHERE id = ?`, [
      id,
    ]);
    if (!user.length) throw new Error("Usuario no encontrado.");
    const existingUser = user[0];

    // Manejo de imagen: Solo subir nueva imagen si se proporciona un archivo y es diferente a la actual
    let imageUrl = existingUser.image || null;
    if (userData.imageFile) {
      if (
        !existingUser.image ||
        existingUser.image !== userData.imageFile.originalname
      ) {
        // Eliminar imagen anterior si existe
        if (existingUser.image) {
          const publicId = existingUser.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }

        // Subir la nueva imagen
        const folder =
          existingUser.rol_id === 2
            ? "teachers"
            : existingUser.rol_id === 3
            ? "students"
            : "users";
        const customFileName = generateCloudinaryFileName(
          userData.first_name || existingUser.first_name,
          userData.apellido || existingUser.apellido
        );
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: customFileName,
              overwrite: true,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          uploadStream.end(userData.imageFile.buffer); // Enviar buffer del archivo
        });

        imageUrl = uploadResult.secure_url; // Actualizar la URL de la imagen
      }
    }

    // Verificar si cambia el correo o el primer nombre
    let passwordUpdated = false;
    let newPassword = existingUser.password;
    if (userData.first_name && userData.first_name !== existingUser.first_name) {
      newPassword = await bcrypt.hash(`${userData.first_name}${new Date().getFullYear()}`, 10);
      passwordUpdated = true;
    }

    // Actualizar datos del usuario
    const sqlUpdateUser = `
            UPDATE users
            SET
                first_name = ?,
                second_name = ?,
                apellido = ?,
                correo = ?,
                celular = ?,
                fecha_nacimiento = ?,
                image = ?,
                estado = ?,
                updated_at = ?,
                password = ?
            WHERE id = ?
        `;
    await connection.query(sqlUpdateUser, [
      userData.first_name || existingUser.first_name,
      userData.second_name || null,
      userData.apellido || existingUser.apellido,
      userData.correo || existingUser.correo,
      userData.celular || existingUser.celular,
      userData.fecha_nacimiento || existingUser.fecha_nacimiento,
      imageUrl,
      userData.estado || existingUser.estado,
      new Date(),
      newPassword,
      id,
    ]);

    // Validar si es profesor
    const [teacher] = await connection.query(
      `SELECT * FROM teachers WHERE users_id = ?`,
      [id]
    );
    if (teacher.length) {
      const directorSalon =
        userData.director_salon === "null" || userData.director_salon === ""
          ? null
          : userData.director_salon;
      if (directorSalon === null) {
        // Limpiar la asignación de director del salón si es null o vacío
        await connection.query(
          `UPDATE salones SET director_id = NULL WHERE director_id = ?`,
          [teacher[0].id]
        );
      } else {
        // Verificar si el salón existe antes de asignar el director
        const [salon] = await connection.query(
          `SELECT id FROM salones WHERE id = ?`,
          [userData.director_salon]
        );

        if (!salon.length) {
          throw new Error(
            `El salón con ID ${userData.director_salon} no existe.`
          );
        }

        // Verificar si el `director_id` ya está asignado a otro salón
        await connection.query(
          `UPDATE salones SET director_id = NULL WHERE director_id = ?`,
          [teacher[0].id]
        );

        // Actualizar el salón con el nuevo director
        const sqlUpdateSalonDirector = `
                    UPDATE salones
                    SET director_id = ?
                    WHERE id = ?
                `;
        await connection.query(sqlUpdateSalonDirector, [
          teacher[0].id,
          userData.director_salon,
        ]);
      }

      // Manejo de asignaturas
      if (userData.asignaciones !== undefined) {
        let asignacionesArray = [];

        // Convertir asignaciones a array si es un string
        if (typeof userData.asignaciones === "string") {
          asignacionesArray = JSON.parse(userData.asignaciones);
        } else {
          asignacionesArray = userData.asignaciones;
        }

        // Eliminar asignaciones actuales del profesor
        await connection.query(
          `DELETE FROM profesores_has_asignaturas_has_salones WHERE teachers_id = ?`,
          [teacher[0].id]
        );

        // Insertar nuevas asignaciones solo si el array no está vacío
        if (asignacionesArray.length > 0) {
          const values = asignacionesArray.map((asignacion) => [
            teacher[0].id,
            asignacion.asignatura_id,
            asignacion.salon_id,
            new Date(),
            new Date(),
          ]);

          const sqlInsertAssignments = `
            INSERT INTO profesores_has_asignaturas_has_salones (
              teachers_id,
              asignatura_id,
              salon_id,
              created_at,
              updated_at
            )
            VALUES ?
          `;
          await connection.query(sqlInsertAssignments, [values]);
        }
      }
    }

    // Validar si es estudiante y actualizar el salón
    const [student] = await connection.query(
      `SELECT * FROM students WHERE users_id = ?`,
      [id]
    );
    if (student.length) {
      const salonId = userData.salon_id === "null" ? null : userData.salon_id;
      if (salonId === null || salonId === "") {
        // Si el salón es null o vacío, desasignamos el salón
        await connection.query(
          `UPDATE students SET salon_id = NULL, updated_at = ? WHERE users_id = ?`,
          [new Date(), id]
        );
      } else {
        // Verificamos si el salón existe antes de asignarlo
        const [salon] = await connection.query(
          `SELECT id FROM salones WHERE id = ?`,
          [userData.salon_id]
        );

        if (!salon.length) {
          throw new Error(`El salón con ID ${userData.salon_id} no existe.`);
        }

        // Asignamos el salón al estudiante
        await connection.query(
          `UPDATE students SET salon_id = ?, updated_at = ? WHERE users_id = ?`,
          [userData.salon_id, new Date(), id]
        );
      }
    }

    // Enviar correo si el usuario cambia su correo o su nombre (nueva contraseña)
    if (userData.correo !== existingUser.correo || passwordUpdated) {
      const templatePath = path.join(__dirname, "../templates/emailTemplate.html");

      const replacements = {
        nombreCompleto: `${userData.first_name || existingUser.first_name} ${userData.apellido || existingUser.apellido}`,
        correo: userData.correo || existingUser.correo,
        password: passwordUpdated ? `${userData.first_name}${new Date().getFullYear()}` : `${userData.first_name}${new Date().getFullYear()}`,
      };

      try {
        await sendEmail(userData.correo || existingUser.correo, "Actualización de credenciales", templatePath, replacements);
      } catch (error) {
        console.error("Error al enviar correo de actualización:", error);
      }
    }

    await connection.commit();
    result(null, {
      success: true,
      message: "Usuario actualizado correctamente.",
    });
  } catch (err) {
    await connection.rollback();
    result(err, null);
  } finally {
    connection.release();
  }
};

// Eliminar usuario y su información asociada
User.deleteUser = async (userId, result) => {
  const connection = await db.getConnection(); // Obtén una conexión para manejar transacciones
  try {
    await connection.beginTransaction(); // Inicia una transacción

    // Verificar si el usuario existe
    const [user] = await connection.query(
      `SELECT id, rol_id FROM users WHERE id = ?`,
      [userId]
    );
    if (user.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    // Eliminar dependencias según el rol del usuario
    const userRole = user[0].rol_id;

    if (userRole === 2) {
      // Profesor
      // Eliminar asignaciones de materias y salones
      await connection.query(
        `DELETE FROM profesores_has_asignaturas_has_salones WHERE teachers_id IN (SELECT id FROM teachers WHERE users_id = ?)`,
        [userId]
      );
      // Eliminar registros de la tabla `teachers`
      await connection.query(`DELETE FROM teachers WHERE users_id = ?`, [
        userId,
      ]);
    } else if (userRole === 3) {
      // Estudiante
      // Eliminar registros de la tabla `students`
      await connection.query(`DELETE FROM students WHERE users_id = ?`, [
        userId,
      ]);
    }

    // Eliminar al usuario de la tabla `users`
    const [deleteResult] = await connection.query(
      `DELETE FROM users WHERE id = ?`,
      [userId]
    );

    if (deleteResult.affectedRows === 0) {
      throw new Error("No se pudo eliminar el usuario.");
    }

    await connection.commit(); // Confirmar la transacción
    result(null, { success: true, message: "Usuario eliminado correctamente" });
  } catch (err) {
    await connection.rollback(); // Revertir la transacción en caso de error
    result(err, null);
  } finally {
    connection.release(); // Liberar la conexión
  }
};

//Login
User.findByEmail = async (correo) => {
  const sql = `
        SELECT
            U.id,
            U.rol_id,
            U.correo,
            U.password,
            U.first_name,
            U.second_name,
            U.apellido,
            U.image,
            U.celular,
            U.fecha_nacimiento,
            U.estado,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', CONVERT(R.id, char),
                    'name', R.name
                )
            ) AS roles,
            S.id AS director_salon, -- Nuevo: ID del salón que dirige el profesor
            St.salon_id -- ID del salón al que pertenece el estudiante
        FROM
            users AS U
        LEFT JOIN
            roles AS R ON U.rol_id = R.id
        LEFT JOIN
            teachers AS T ON T.users_id = U.id
        LEFT JOIN
            salones AS S ON S.director_id = T.id -- Relación con el salón que dirige el profesor
        LEFT JOIN
            students AS St ON St.users_id = U.id
        WHERE
            U.correo = ?
        GROUP BY
            U.id, S.id, St.salon_id;
    `;

  try {
    const [rows] = await db.query(sql, [correo]);
    return rows[0]; // Devuelve el primer resultado o undefined si no hay coincidencias
  } catch (err) {
    console.error("Error al buscar usuario por correo:", err);
    throw err;
  }
};

// Obtener un usuario por su ID
User.getUserById = async (id, result) => {
  try {
    const sql = `
        SELECT
            U.id,
            U.rol_id,
            U.correo,
            U.password,
            U.first_name,
            U.second_name,
            U.apellido,
            U.image,
            U.celular,
            U.fecha_nacimiento,
            U.estado,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'asignatura_id', phas.asignatura_id,
                    'salon_id', phas.salon_id
                )
                ) AS asignaciones,
            S.id AS director_salon, -- Nuevo: ID del salón que dirige el profesor
            St.salon_id -- ID del salón al que pertenece el estudiante
            FROM
                users AS U
        LEFT JOIN
            teachers AS T ON U.id = T.users_id
        LEFT JOIN
            salones AS S ON S.director_id = T.id
        LEFT JOIN
            profesores_has_asignaturas_has_salones phas ON T.id = phas.teachers_id
        LEFT JOIN
            students AS St ON St.users_id = U.id
        WHERE
            U.id = ?
        GROUP BY
        U.id, S.id, St.salon_id;
      `;

    const [rows] = await db.query(sql, [id]);
    if (rows.length > 0) {
      result(null, rows[0]);
    } else {
      result({ message: "Usuario no encontrado." }, null);
    }
  } catch (err) {
    console.error("Error al obtener usuario por ID:", err);
    result(err, null);
  }
};

// Actualizar contraseña
User.updatePassword = async (correo, hashedPassword) => {
  await db.query(
    `UPDATE users SET password = ?, updated_at = ? WHERE correo = ?`,
    [hashedPassword, new Date(), correo]
  );
};

module.exports = User;

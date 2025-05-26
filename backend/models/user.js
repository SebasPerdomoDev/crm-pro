const db = require("../config/db");
const bcrypt = require("bcryptjs");

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
            U.last_name,
            U.phone,
            U.age,
            U.estado,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', CONVERT(R.id, char),
                    'name', R.name
                )
            ) AS roles
        FROM users U
        JOIN roles R ON U.rol_id = R.id
        WHERE U.correo = ?
    `;

  try {
    const [rows] = await db.query(sql, [correo]);
    return rows[0]; // Devuelve el primer resultado o undefined si no hay coincidencias
  } catch (err) {
    console.error("Error al buscar usuario por correo:", err);
    throw err;
  }
};

User.userCreate = async (userData, result) => {
  const sqlInsertUser = `
    INSERT INTO users (
        rol_id,
        correo,
        first_name,
        second_name,
        last_name,
        phone,
        age,
        password,
        estado,
        created_at,
        updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo', NOW(), NOW())
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
      userData.rol_id,
      userData.correo,
      userData.first_name,
      userData.second_name || null,
      userData.last_name,
      userData.phone,
      userData.age,
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

User.update = (id, userData, result) => {
  const sql = `
    UPDATE users SET
      rol_id = ?, correo = ?, first_name = ?, second_name = ?, last_name = ?,
      phone = ?, age = ?, updated_at = NOW()
    WHERE id = ?
  `;
  db.query(sql, [
    userData.rol_id,
    userData.correo,
    userData.first_name,
    userData.second_name || null,
    userData.last_name,
    userData.phone,
    userData.age,
    id
  ], (err, res) => {
    if (err) return result(err, null);
    result(null, { id, ...userData });
  });
};

User.delete = (id, result) => {
  db.query('DELETE FROM users WHERE id = ?', [id], (err, res) => {
    if (err) return result(err, null);
    result(null, res);
  });
};


module.exports = User;

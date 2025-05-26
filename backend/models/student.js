const db = require("../config/db");

const Student = {};

// Obtener estudiantes del salón dirigido por un profesor
Student.getStudentsByDirector = async (directorId, result) => {
  try {
    // Consulta para obtener estudiantes asociados al salón dirigido por el director
    const [rows] = await db.query(
      `SELECT 
            s.id AS student_id,
            u.id AS user_id,
            u.image,
            u.first_name,
            u.second_name,
            u.apellido,
            u.correo,
            u.celular,
            DATE_FORMAT(u.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
            sal.nombre AS salon_nombre,
            sal.grado AS salon_grado
          FROM students s
          INNER JOIN users u ON s.users_id = u.id
          INNER JOIN salones sal ON s.salon_id = sal.id
          WHERE sal.director_id = ?`,
      [directorId]
    );

    if (rows.length > 0) {
      result(null, rows);
    } else {
      result(
        { message: "No se encontraron estudiantes para este director" },
        null
      );
    }
  } catch (error) {
    console.error("Error al obtener estudiantes por director:", error);
    result(error, null);
  }
};

Student.getSalon = async (userId, result) => {
  try{
    const [salon] = await db.query(
      `
        SELECT 
        s.nombre AS salon_nombre,
        s.grado
      FROM students st
      INNER JOIN salones s ON st.salon_id = s.id
      WHERE st.users_id = ?
        `,
      [userId]
    );
    if (salon.length > 0) {
      result(null, salon);
    } else {
      result({ message: "No se encontró salón para el estudiante" }, null);
    }
  }
  catch (error) {
    console.error("Error al obtener salon del estudiante:", error);
    result(error, null);
  }
};
module.exports = Student;

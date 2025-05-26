const db = require("../config/db"); // Database connection

const Teacher = {};

Teacher.getCourses = async (userId, result) => {
  try{

    const [courses] = await db.query(
      `
      SELECT 
        a.nombre AS asignatura,
        s.nombre AS salon_nombre,
        s.grado
      FROM profesores_has_asignaturas_has_salones phas
      INNER JOIN asignaturas a ON phas.asignatura_id = a.id
      INNER JOIN salones s ON phas.salon_id = s.id
      INNER JOIN teachers t ON phas.teachers_id = t.id
      WHERE t.users_id = ?
      `,
      [userId]
    );
    if (courses.length > 0) {
      result(null, courses);
    } else {
      result({ message: "No se encontró cursos del profesor." }, null);
    }
  } catch (error) {
    console.error("Error al obtener cursos:", error);
    result(error, null);
  }
}

module.exports = Teacher;

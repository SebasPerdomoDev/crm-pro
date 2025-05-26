const db = require("../config/db");
const Student = require("../models/student");

module.exports = {
  // Obtener estudiantes por director
  async getStudentsByDirector(req, res) {
    try {
      const userId = req.user.id; // ID del usuario logeado

      // Obtener el ID del teacher asociado al usuario logeado
      const [teacher] = await db.query(
        `SELECT id FROM teachers WHERE users_id = ?`,
        [userId]
      );

      if (teacher.length === 0) {
        return res.status(404).json({
          success: false,
          message: "El usuario no está registrado como profesor",
        });
      }

      const teacherId = teacher[0].id;

      // Obtener estudiantes asociados al salón dirigido por el profesor
      Student.getStudentsByDirector(teacherId, (err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message:
              err.message || "No se encontraron estudiantes para este director",
          });
        }

        res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (error) {
      console.error("Error al obtener estudiantes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message || error,
      });
    }
  },
  async getSalon(req, res) {
    const userId = req.user.id;

    try {
      await Student.getSalon(userId, (err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: err.message || "Salón no encontrado",
          });
        }
        res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message || error,
      });
    }
  },
};

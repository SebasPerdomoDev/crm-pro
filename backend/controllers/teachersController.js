const Teacher = require("../models/teachers");

module.exports = {
  async getCourses(req, res) {
    const userId = req.user.id;

    try {
      await Teacher.getCourses(userId, (err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: err.message || "Cursos no encontrados",
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

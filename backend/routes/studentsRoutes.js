const studentsController = require('../controllers/studentsController');
const { verifyRole, verifyToken } = require("../middlewares/authMiddleware"); // Importar middleware de autenticación

module.exports = (app) => {
    // GET -> OBTENER DATOS
    app.get('/api/students/getStudentsByDirector', verifyToken, verifyRole(2), studentsController.getStudentsByDirector);
    app.get('/api/students/salon', verifyToken, studentsController.getSalon);
}
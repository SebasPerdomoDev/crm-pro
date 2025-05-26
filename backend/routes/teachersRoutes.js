const teachersController = require('../controllers/teachersController');
const { verifyToken } = require("../middlewares/authMiddleware"); // Importar middleware de autenticación

module.exports = (app) => {
    // GET -> OBTENER DATOS
    app.get('/api/teachers/courses', verifyToken, teachersController.getCourses);
}
const asignaturasRoutes = require('../controllers/asignaturasController');
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware"); // Importar middleware de autenticación

module.exports = (app) => {
    app.post("/api/asignaturas", verifyToken, verifyRole(1), asignaturasRoutes.createAsignatura);
    app.put("/api/asignaturas/:id", verifyToken, verifyRole(1), asignaturasRoutes.updateAsignatura);
    app.delete("/api/asignaturas/:id", verifyToken, verifyRole(1), asignaturasRoutes.deleteAsignatura);
}
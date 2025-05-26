const salonesRoutes = require('../controllers/salonesController');
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware"); // Importar middleware de autenticación

module.exports = (app, upload) => {
    app.post('/api/salones', verifyToken, verifyRole(2), upload.single('horario_image'), salonesRoutes.subirHorario);
    app.get("/api/salones/:salon_id/horario", verifyToken, salonesRoutes.obtenerHorario);
    app.post("/api/createSalones", verifyToken, verifyRole(1), salonesRoutes.createSalon);
    app.delete("/api/salones/:id", verifyToken, verifyRole(1), salonesRoutes.deleteSalon);
}
const { verifyToken } = require("../middlewares/authMiddleware");
const agendasController = require("../controllers/agendasController");

module.exports = (app, upload) => {
    app.post("/api/agendas", verifyToken, upload.array("fotos", 20), agendasController.crearEvento);
    app.get("/api/agendas", verifyToken, agendasController.obtenerEventos);
    app.get("/api/agendas/fecha/:fecha", verifyToken, agendasController.obtenerEventosPorFecha);
    app.get("/api/agendas/id/:id", verifyToken, agendasController.obtenerEventosPorID);
    app.put("/api/agendas/:id", verifyToken, upload.array("fotos", 20), agendasController.actualizarEvento); // Actualizar evento
    app.delete("/api/agendas/:id", verifyToken, agendasController.eliminarEvento); // Eliminar evento
}
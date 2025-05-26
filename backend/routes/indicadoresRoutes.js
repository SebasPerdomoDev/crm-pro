const indicadoresController = require("../controllers/indicadoresController");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

module.exports = (app) => {

    // POST - Crear nuevo indicador
    app.post("/api/indicadores", verifyToken, verifyRole(2), indicadoresController.createIndicador);

    // PUT - Actualizar indicador
    app.put("/api/indicadores/:id", verifyToken, verifyRole(2), indicadoresController.updateIndicador);

    // DELETE - Eliminar indicador
    app.delete("/api/indicadores/:periodoId/:salonId", verifyToken, verifyRole(2), indicadoresController.deleteIndicador);

    // GET - Obtener indicadores del docente autenticado
    app.get("/api/indicadores/docente", verifyToken, verifyRole(2), indicadoresController.getIndicadoresByDocente);

    app.get("/api/indicadores/:periodoId/:salonId", verifyToken, indicadoresController.indicadoresByPeriodoSalon);


}

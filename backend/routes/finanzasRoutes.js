const finanzasRoutes = require("../controllers/finanzasController");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

module.exports = (app) => {
    // GET -> OBTENER DATOS
    app.get('/api/finanzas', verifyToken, finanzasRoutes.getFinanzas);
    app.get('/api/finanzas/:id', verifyToken,  verifyRole(1), finanzasRoutes.getFinanzaId);
    // POST -> CREAR DATOS
    app.post('/api/createFinanzas', verifyToken, verifyRole(1), finanzasRoutes.createFinanza);
    // PUT -> ACTUALIZAR DATOS
    app.put('/api/finanzas/:id', verifyToken, verifyRole(1), finanzasRoutes.updateFinanza);
    // DELETE -> ELIMINAR DATOS
    app.delete('/api/finanzas/:id', verifyToken, verifyRole(1), finanzasRoutes.deleteFinanza);
}
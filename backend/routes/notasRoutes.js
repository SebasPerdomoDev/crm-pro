const notasRoutes = require('../controllers/notasController');
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware"); // Importar middleware de autenticación

module.exports = (app) => {

    // GET -> OBTENER DATOS
    app.get('/api/notas/estudiante', verifyToken, verifyRole(3), notasRoutes.getNotasByStudent);
    app.get('/api/notas/asignatura/:asignaturaId', notasRoutes.getNotasByAsignatura);
    app.get('/api/notas/director', verifyToken, verifyRole(2), notasRoutes.getNotasByDirector);
    app.get('/api/notas/periodo/:periodoId', notasRoutes.getNotasByPeriodo);
    app.get('/api/notas/periodos' , verifyToken, notasRoutes.getPeriodos);
    app.get('/api/notas/grado', verifyToken, notasRoutes.getNotasByGrado);
    app.get('/api/notas/rector', verifyToken, verifyRole(1), notasRoutes.getNotasForAdmin);
    // POST -> CREAR DATOS
    app.post('/api/notas', verifyToken, verifyRole(2), notasRoutes.createNota);
    // PUT -> ACTUALIZAR DATOS
    app.put('/api/notas/:id', verifyToken, verifyRole(2), notasRoutes.updateNota);
    // DELETE -> ELIMINAR DATOS
    app.delete('/api/notas/eliminar/:id', verifyToken, verifyRole(2), notasRoutes.deleteNota);
}
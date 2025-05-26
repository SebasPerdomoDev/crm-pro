const boletinController = require("../controllers/boletinController");
const { verifyToken } = require("../middlewares/authMiddleware"); // Importar middleware de autenticación

module.exports = (app) => {
    // GET -> OBTENER DATOS

    app.get('/api/boletin', verifyToken, boletinController.getAllBoletines);
    app.get('/api/boletin/director', verifyToken, boletinController.getBoletinesByDirector);
    app.get('/api/boletin/preescolar/:studentId/:periodoId', verifyToken, boletinController.generarBoletinPreescolar);

    app.get('/api/boletin/primaria/:studentId/:periodoId', verifyToken, boletinController.generarBoletinPrimaria);

    app.post('/api/boletin', verifyToken, boletinController.createBoletin);

    app.put('/api/boletin', verifyToken, boletinController.updateBoletin);
    
    app.get('/api/observaciones/:students_id/:periodo_id', boletinController.getObservacion)
    
    app.delete('/api/boletin/:students_id/:periodo_id', verifyToken, boletinController.deleteBoletin);
    
    //Configuracion visibilidad
    app.get('/api/config/visibilidad', verifyToken, boletinController.getBoletinesVisibles)
    app.put('/api/config/visibilidad', verifyToken, boletinController.setBoletinesVisibles)
}

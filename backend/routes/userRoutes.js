const usersController = require('../controllers/usersController');
const { verifyRole, verifyToken } = require("../middlewares/authMiddleware"); // Importar middleware de autenticación

module.exports = (app, upload) => {
    // GET -> OBTENER DATOS
    app.get('/api/users/getStudents', usersController.getAllStudents);
    app.get('/api/users/getTeachers', usersController.getAllTeachers);
    app.get("/api/asignaturas", usersController.getAllAsignaturas);
    app.get("/api/salones", usersController.getAllSalones);
    app.get("/api/salon/director", verifyToken, usersController.getSalonByDirector);
    app.get("/api/users/:id", usersController.getUserById);
    // POST -> ALMACENAR DATOS
    app.post("/api/users/createTeacher", verifyToken, verifyRole(1), upload.single('image'), usersController.createUserTeacher);
    app.post("/api/users/createStudent", verifyToken, verifyRole(1), upload.single('image'), usersController.createUserStudent); 
    app.post("/api/users/createUser", upload.single('image'), usersController.createUser);
    app.post('/api/users/login', usersController.login);
    // PUT -> ACTUALIZAR DATOS
    app.put('/api/students/salon', usersController.updateStudentSalon);
    app.put('/api/users/update/:id', verifyToken, verifyRole(1), upload.single('image'), usersController.updateUser);
    // DELETE -> ELIMINAR DATOS
    app.delete('/api/users/:id', verifyToken, verifyRole(1), usersController.deleteUser);
}
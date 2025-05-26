const usersController = require('../controllers/usersController');
const { verifyToken } = require("../middlewares/authMiddleware");

module.exports = (app, upload) => {
    app.get("/api/users", usersController.getAllUsers);
    app.get("/api/users/:id", usersController.getUserById);
    app.post("/api/users", upload.none(), usersController.createUser);
    app.post("/api/users/login", usersController.login);
    app.put("/api/users/:id", verifyToken, upload.none(),usersController.updateUser);
    app.delete("/api/users/:id", verifyToken, usersController.deleteUser);
};

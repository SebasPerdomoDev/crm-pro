const roleController = require("../controllers/rolsController");
const { verifyToken } = require("../middlewares/authMiddleware");

module.exports = (app) => {
  // Obtener todos los roles
  app.get("/api/roles", roleController.getAllRoles);

  // Obtener un rol por ID
  app.get("/api/roles/:id", roleController.getRoleById);

  // Crear un nuevo rol
  app.post("/api/roles", verifyToken, roleController.createRole);

  // Actualizar un rol existente
  app.put("/api/roles/:id", verifyToken, roleController.updateRole);

  // Eliminar un rol
  app.delete("/api/roles/:id", verifyToken, roleController.deleteRole);
};

const db = require("../config/db");
const Role = require("../models/rol");

module.exports = {
  // Obtener todos los roles
  async getAllRoles(req, res) {
    try {
      Role.getAll((err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al obtener los roles",
            error: err.message || err,
          });
        }

        res.status(200).json({
          success: true,
          message: "Roles obtenidos correctamente",
          data,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },

  // Obtener rol por ID
  async getRoleById(req, res) {
    try {
      const { id } = req.params;
      Role.getById(id, (err, data) => {
        if (err || !data) {
          return res.status(404).json({
            success: false,
            message: "Rol no encontrado",
          });
        }

        res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },

  // Crear nuevo rol
  async createRole(req, res) {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "El nombre del rol es requerido.",
      });
    }

    try {
      Role.create({ name }, (err, data) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Error al crear el rol.",
            error: err.message || err,
          });
        }

        res.status(201).json({
          success: true,
          message: "Rol creado exitosamente.",
          data,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },

  // Actualizar un rol
  async updateRole(req, res) {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "El nombre del rol es requerido.",
      });
    }

    try {
      Role.update(id, { name }, (err, data) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Error al actualizar el rol.",
            error: err.message || err,
          });
        }

        res.status(200).json({
          success: true,
          message: "Rol actualizado correctamente.",
          data,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },

  // Eliminar rol
  async deleteRole(req, res) {
    const { id } = req.params;

    try {
      Role.delete(id, (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Error al eliminar el rol.",
            error: err.message || err,
          });
        }

        res.status(200).json({
          success: true,
          message: "Rol eliminado correctamente.",
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },
};

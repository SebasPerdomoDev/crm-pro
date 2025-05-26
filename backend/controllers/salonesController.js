const db = require("../config/db");
const Salon = require("../models/salon");
const { cloudinary } = require("../utils/cloudinary"); // Configura Cloudinary

module.exports = {
  async createSalon(req, res) {
    const salonData = req.body;

    if (!salonData.nombre || !salonData.grado) {
      return res
        .status(400)
        .json({ success: false, message: "Nombre y grado son obligatorios." });
    }

    Salon.createSalon(salonData, async (err, data) => {
      if (err) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Error al crear el salón.",
            error: err,
          });
      }

      //  Subir imagen del horario si se proporciona
      if (req.file) {
        try {
          const uploadResult = await cloudinary.uploader.upload_stream(
            { folder: "salones" },
            async (error, result) => {
              if (!error) {
                await Salon.updateHorarioImage(data.salonId, result.secure_url);
              }
            }
          );
          uploadResult.end(req.file.buffer);
        } catch (error) {
          console.error("Error al subir imagen a Cloudinary:", error);
        }
      }

      res
        .status(201)
        .json({ success: true, message: "Salón creado correctamente.", data });
    });
  },


  //  Eliminar un salón
  async deleteSalon(req, res) {
    const { salonId } = req.params;

    Salon.deleteSalon(salonId, (err, data) => {
      if (err) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Error al eliminar el salón.",
            error: err,
          });
      }
      res
        .status(200)
        .json({ success: true, message: "Salón eliminado correctamente." });
    });
  },

  // Subir imagen del horario
  async subirHorario(req, res) {
    const { salon_id } = req.body;
    const userId = req.user.id;
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "La imagen del horario es requerida.",
        });
      }

      // Obtener el ID del teacher asociado al usuario logeado
      const [director] = await db.query(
        `SELECT id FROM teachers WHERE users_id = ?`,
        [userId]
      );

      if (director.length === 0) {
        return res.status(404).json({
          success: false,
          message: "El usuario no está registrado como profesor",
        });
      }

      const directorId = director[0].id;

      // Validar que el director_id del salón sea el mismo que el ID del teacher
      const [salon] = await db.query(
        `SELECT id, director_id FROM salones WHERE id = ?`,
        [salon_id]
      );

      if (salon.length === 0) {
        return res.status(404).json({
          success: false,
          message: `El salón con ID ${salon_id} no existe.`,
        });
      }

      if (salon[0].director_id !== directorId) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para subir el horario de este salón.",
        });
      }

      // Subir imagen a Cloudinary
      const customFileName = `horarios/salon_${salon_id}_director_${directorId}`;
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "horarios",
              public_id: customFileName,
              overwrite: true,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });
      };

      const uploadResult = await streamUpload(req.file.buffer);
      const imageUrl = uploadResult.secure_url;

      // Actualizar la URL del horario en la base de datos
      Salon.updateHorarioImage(salon_id, imageUrl, (err, data) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Error al actualizar el horario.",
            error: err.message || err,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Horario actualizado correctamente.",
          data,
        });
      });
    } catch (error) {
      console.error("Error interno al subir horario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },
  async obtenerHorario(req, res) {
    const { salon_id } = req.params; // ID del salón desde los parámetros

    try {
      // Obtener la URL de la imagen del horario
      Salon.getHorarioImage(salon_id, (err, data) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para ver el horario o no existe.",
            error: err.message || err,
          });
        }

        if (!data) {
          return res.status(404).json({
            success: false,
            message: "El horario no está disponible para este salón.",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Horario obtenido correctamente.",
          data,
        });
      });
    } catch (error) {
      console.error("Error interno al obtener horario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },
};

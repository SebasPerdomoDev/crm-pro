const db = require("../config/db");
const Finanzas = require("../models/finanzas");
const sendEmail = require("../services/emailService"); // Importar función de envío de correos
const path = require("path");

module.exports = {
  // GET -> OBTENER DATOS
  getFinanzas(req, res) {
    const userId = req.user.id; //  ID del usuario logueado
    const rolId = req.user.rol_id; // Rol del usuario

    try {
      Finanzas.getFinanzas(userId, rolId, (err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al obtener los pagos.",
            error: err.message,
          });
        }

        return res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (error) {
      console.error("Error al obtener finanzas:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },
  // GET -> OBTENER DATOS POR ID
  getFinanzaId(req, res) {
    const finanzaId = req.params.id;
    // Verificar si el usuario tiene rol de rector (rol_id = 1)
    if (req.user.rol_id !== 1) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede realizar esta acción.",
      });
    }
    Finanzas.getFinanzaById(finanzaId, (err, data) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error al obtener los pagos.",
          error: err.message,
        });
      }
      res.status(200).json({
        success: true,
        data: data,
      });
    });
  },
  // POST -> CREAR DATOS
  async createFinanza(req, res) {
    const finanza = req.body;

    // Verificar que el usuario que realiza la acción es el rector
    if (req.user.rol_id !== 1) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede realizar esta acción.",
      });
    }

    // Validar campos requeridos
    if (
      !finanza.students_id ||
      !finanza.monto ||
      !finanza.fecha ||
      !finanza.razon_pago
    ) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos.",
      });
    }

    try {
      // Verificar que students_id existe en la tabla students
      const [student] = await db.query(
        `SELECT u.correo, u.first_name, u.second_name, u.apellido
         FROM users u
         INNER JOIN students s ON u.id = s.users_id
         WHERE s.users_id = ?`,
        [finanza.students_id]
      );

      if (student.length === 0) {
        return res.status(400).json({
          success: false,
          message: `El estudiante con ID ${finanza.students_id} no existe.`,
        });
      }

      Finanzas.createFinanza(finanza, async (err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Ocurrió un error al crear la finanza.",
            error: err.message || err,
          });
        }

        res.status(201).json({
          success: true,
          message: "Pago creado correctamente.",
          data,
        });

        const studentInfo = student[0];

        // Configurar la plantilla de correo
        const templatePath = path.join(
          __dirname,
          "../templates/nuevaFinanza.html"
        );
        const replacements = {
          nombreCompleto: `${studentInfo.first_name} ${studentInfo.second_name} ${studentInfo.apellido}`,
          monto: finanza.monto,
          fecha: finanza.fecha,
          razonPago: finanza.razon_pago,
        };

        try {
          const emailSent = await sendEmail(
            studentInfo.correo,
            "Nuevo Pago Registrado",
            templatePath,
            replacements
          );

          if (!emailSent) {
            console.error("Error al enviar correo al estudiante.");
          } else {
            console.log(
              `Correo enviado correctamente a: ${studentInfo.correo}`
            );
          }
        } catch (error) {
          console.error("Error al enviar correo:", error);
        }
      });
    } catch (error) {
      console.error("Error al crear finanza:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
      });
    }
  },
  // PUT -> ACTUALIZAR DATOS
  async updateFinanza(req, res) {
    try {
      const { id } = req.params;
      if (req.user.rol_id !== 1) {
        return res.status(403).json({
          success: false,
          message: "Solo el rector puede actualizar finanzas.",
        });
      }

      const updatedData = req.body;
      Finanzas.updateFinanza(
        id,
        updatedData,
        req.user.id,
        async (err, data) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Error al actualizar la finanza.",
              error: err.message || err,
            });
          }

          res.status(200).json({
            success: true,
            message: "Pago actualizado exitosamente.",
            data: data.data,
          });

          //  Obtener correo del estudiante
          const [studentData] = await db.query(
            `SELECT u.correo, u.first_name, u.second_name, u.apellido
                FROM users u
                INNER JOIN students s ON u.id = s.users_id
                INNER JOIN pagos p ON s.users_id = p.students_id
                WHERE p.id = ?`,
            [id]
          );

          if (studentData.length > 0) {
            const student = studentData[0];

            const templatePath = path.join(
              __dirname,
              "../templates/nuevaFinanza.html"
            );
            const replacements = {
              nombreCompleto: `${student.first_name} ${
                student.second_name || ""
              } ${student.apellido}`,
              monto: updatedData.monto,
              fecha: updatedData.fecha,
              razonPago: updatedData.razon_pago,
              estado: "Actualizado",
            };

            await sendEmail(
              student.correo,
              "💰 Pago Actualizado",
              templatePath,
              replacements
            );
          }
        }
      );
    } catch (error) {
      console.error("Error al actualizar finanza:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
      });
    }
  },

  async deleteFinanza(req, res) {
    const { id } = req.params;
    if (req.user.rol_id !== 1) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede eliminar finanzas.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pago eliminado correctamente.",
    });

    try {
      const [pagoInfo] = await db.query(
        `SELECT u.correo, u.first_name, u.second_name, u.apellido 
            FROM users u
            INNER JOIN students s ON u.id = s.users_id
            INNER JOIN pagos p ON s.users_id = p.students_id
            WHERE p.id = ?`,
        [id]
      );

      const student = pagoInfo[0];

      await Finanzas.deleteFinanza(id, async (err, data) => {
        await sendEmail(
          student.correo,
          "💰 Pago Eliminado",
          "../templates/nuevaFinanza.html",
          { nombreCompleto: student.first_name, estado: "Eliminado" }
        );
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Error interno del servidor." });
    }
  },
};

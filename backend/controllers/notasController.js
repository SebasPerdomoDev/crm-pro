const db = require("../config/db");
const Notas = require("../models/notas");
const sendEmail = require("../services/emailService"); // Importar función de envío de correos
const path = require("path");
const caritasMap = {
  feliz: "😊",     // Equivalente a FaSmile
  contento: "😊",  
  intermedio: "😐", // Equivalente a FaMeh
  triste: "☹️"     // Equivalente a FaFrown
};
module.exports = {
  async getNotasByAsignatura(req, res) {
    const { asignaturaId } = req.params;
    try {
      await Notas.getNotasByAsignatura(asignaturaId, (err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (error) {
      console.error(
        "Error al obtener calificaciones por asignatura:",
        error.message
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener calificaciones por asignatura.",
      });
    }
  },

  async getNotasByStudent(req, res) {
    const userId = req.user.id;

    // Verificar si el usuario tiene rol de rector (rol_id = 1)
    if (req.user.rol_id !== 3) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede realizar esta acción.",
      });
    }

    try {
      await Notas.getNotasByStudent(userId, (err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (error) {
      console.error(
        "Error al obtener calificaciones por estudiante:",
        error.message
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener calificaciones por estudiante.",
      });
    }
  },

  async getNotasByDirector(req, res) {
    const userId = req.user.id; // ID del usuario logeado
    // Verificar si el usuario tiene rol de rector (rol_id = 2)
    if (req.user.rol_id !== 2) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede realizar esta acción.",
      });
    }
    try {
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

      await Notas.getNotasByDirector(directorId, (err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (error) {
      console.error(
        "Error al obtener calificaciones por director:",
        error.message
      );
      return res.status(500).json({
        success: false,
        message: "Error interno al obtener calificaciones por director.",
      });
    }
  },

  async getNotasByPeriodo(req, res) {
    const { periodoId } = req.params;
    try {
      await Notas.getNotasByPeriodo(periodoId, (err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (error) {
      console.error(
        "Error al obtener calificaciones por periodo:",
        error.message
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener calificaciones por periodo.",
      });
    }
  },

  async getNotasByGrado(req, res) {
    const { grado } = req.params;
    try {
      await Notas.getNotasByGrado(grado, (err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (error) {
      console.error(
        "Error al obtener calificaciones por grado:",
        error.message
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener calificaciones por grado.",
      });
    }
  },

  async getNotasForAdmin(req, res) {
    if (req.user.rol_id !== 1) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede realizar esta acción.",
      });
    }

    try {
      const notas = await Notas.getNotasForAdmin(); // Llamar al modelo
      return res.status(200).json({
        success: true,
        data: notas,
      });
    } catch (error) {
      console.error(
        "Error al obtener calificaciones para el administrador:",
        error.message
      );
      return res.status(500).json({
        success: false,
        message: "Error al obtener calificaciones para el administrador.",
      });
    }
  },

  // Obtener todos los periodos
  async getPeriodos(req, res) {
    // Verificar si el usuario tiene rol de rector (rol_id = 1)
    // if (req.user.rol_id !== 2) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Solo el rector puede realizar esta acción.",
    //   });
    // }
    try {
      await Notas.getPeriodos((err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (error) {
      console.error("Error al obtener los periodos:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error al obtener los periodos.",
      });
    }
  },

  async createNota(req, res) {
    const nota = req.body;
    const userId = req.user.id; // ID del usuario logueado

    // Verificar si el usuario tiene rol de profesor (rol_id = 2)
    if (req.user.rol_id !== 2) {
      return res.status(403).json({
        success: false,
        message: "Solo los profesores pueden agregar notas.",
      });
    }

    try {
      const directorInfo = await Notas.isDirector(userId);
      if (!directorInfo) {
        return res.status(403).json({
          success: false,
          message:
            "Solo los profesores directores de salón pueden agregar notas.",
        });
      }

      const teacherId = directorInfo.teacher_id;
      await Notas.createNota(nota, teacherId, async (err, result) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        res.status(201).json({
          success: true,
          message: "Nota creada correctamente.",
          data: result,
        });

        // Obtener el correo del estudiante junto con el nombre de la asignatura y el periodo
        const [studentData] = await db.query(
          `SELECT u.correo, u.first_name, u.second_name, u.apellido,
              a.nombre AS asignatura_nombre, p.nombre AS periodo_nombre
            FROM users u
            INNER JOIN students s ON u.id = s.users_id
            INNER JOIN calificaciones_generales cg ON s.users_id = cg.students_id
            INNER JOIN asignaturas a ON cg.asignatura_id = a.id
            INNER JOIN calificaciones_periodos cp ON cg.id = cp.calificacion_general_id
            INNER JOIN periodos p ON cp.periodo_id = p.id
            WHERE s.users_id = ? AND cp.periodo_id = ?`,
          [nota.students_id, nota.periodo_id]
        );

        if (studentData.length > 0) {
          const student = studentData[0];

          //  Convertir la calificación a emoji si es tipo "carita"
          let calificacionTexto = nota.calificacion || nota.simbolo_carita;
          if (caritasMap[calificacionTexto]) {
              calificacionTexto = caritasMap[calificacionTexto]; // Convertir a emoji
          }

          // Configurar la plantilla de correo con los nombres correctos
          // const templatePath = path.join(
          //   __dirname,
          //   "../templates/nuevaNota.html"
          // );
          // const replacements = {
          //   nombreCompleto: `${student.first_name} ${
          //     student.second_name || ""
          //   } ${student.apellido}`,
          //   asignatura: student.asignatura_nombre, // Se obtiene el nombre de la asignatura
          //   periodo: student.periodo_nombre, // Se obtiene el nombre del periodo
          //   calificacion: calificacionTexto,
          // };

          // try {
          //   const emailSent = await sendEmail(
          //     student.correo,
          //     "Nueva Nota Registrada",
          //     templatePath,
          //     replacements
          //   );

          //   if (!emailSent) {
          //     console.error("Error al enviar correo al estudiante.");
          //   } else {
          //     console.log(`Correo enviado correctamente a: ${student.correo}`);
          //   }
          // } catch (error) {
          //   console.error("Error al enviar correo:", error);
          // }
        }
      });
    } catch (error) {
      console.error("Error al crear la nota:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error interno al crear la nota.",
      });
    }
  },

  async updateNota(req, res) {
    const { id } = req.params;
    const updatedNota = req.body;
    const userId = req.user.id; // ID del usuario logueado
    // Verificar si el usuario tiene rol de rector (rol_id = 1)
    if (req.user.rol_id !== 2) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede realizar esta acción.",
      });
    }

    try {
      const directorInfo = await Notas.isDirector(userId);

      if (!directorInfo) {
        return res.status(403).json({
          success: false,
          message:
            "Solo los profesores directores de salón pueden actualizar notas.",
        });
      }

      //  Obtener los datos del estudiante y asignatura
      const [studentData] = await db.query(
        `SELECT u.correo, u.first_name, u.second_name, u.apellido, 
            a.nombre AS asignatura_nombre, p.nombre AS periodo_nombre
          FROM users u
          INNER JOIN students s ON u.id = s.users_id
          INNER JOIN calificaciones_generales cg ON s.users_id = cg.students_id
          INNER JOIN asignaturas a ON cg.asignatura_id = a.id
          INNER JOIN calificaciones_periodos cp ON cg.id = cp.calificacion_general_id
          INNER JOIN periodos p ON cp.periodo_id = p.id
          WHERE s.users_id = ? AND cp.periodo_id = ?`,
        [updatedNota.students_id, updatedNota.periodo_id]
      );

      const teacherId = directorInfo.teacher_id;

      await Notas.updateNota(
        id,
        updatedNota,
        teacherId,
        async (err, result) => {
          if (err) {
            return res.status(400).json({
              success: false,
              message: err.message,
            });
          }

          res.status(200).json({
            success: true,
            message: "Nota actualizada correctamente.",
            data: result,
          });

          if (studentData.length > 0) {
            const student = studentData[0];

            //  Convertir la calificación a emoji si es tipo "carita"
            let calificacionTexto = updatedNota.calificacion || updatedNota.simbolo_carita;
            if (caritasMap[calificacionTexto]) {
                calificacionTexto = caritasMap[calificacionTexto]; // Convertir a emoji
            }

            //  Enviar correo de actualización de nota
            // const templatePath = path.join(
            //   __dirname,
            //   "../templates/nuevaNota.html"
            // );
            // const replacements = {
            //   nombreCompleto: `${student.first_name} ${
            //     student.second_name || ""
            //   } ${student.apellido}`,
            //   asignatura: student.asignatura_nombre,
            //   periodo: student.periodo_nombre,
            //   calificacion: calificacionTexto,
            // };

            // await sendEmail(
            //   student.correo,
            //   "📚 Nota Actualizada",
            //   templatePath,
            //   replacements
            // );
          }
        }
      );
    } catch (error) {
      console.error("Error al actualizar la nota:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error interno al actualizar la nota.",
      });
    }
  },

  async deleteNota(req, res) {
    const { id } = req.params; // ID de la nota (periodo) a eliminar
    const userId = req.user.id; // ID del profesor logeado
    // Verificar si el usuario tiene rol de rector (rol_id = 1)
    if (req.user.rol_id !== 2) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede realizar esta acción.",
      });
    }
    try {
      // Obtener el ID del teacher asociado al usuario logeado
      const [teacher] = await db.query(
        `SELECT id FROM teachers WHERE users_id = ?`,
        [userId]
      );

      if (teacher.length === 0) {
        return res.status(404).json({
          success: false,
          message: "El usuario no está registrado como profesor",
        });
      }

      const [notaInfo] = await db.query(
        `SELECT cg.students_id, a.nombre AS asignatura_nombre, p.nombre AS periodo_nombre, u.correo, u.first_name, u.second_name, u.apellido
        FROM calificaciones_periodos cp
        INNER JOIN calificaciones_generales cg ON cp.calificacion_general_id = cg.id
        INNER JOIN asignaturas a ON cg.asignatura_id = a.id
        INNER JOIN periodos p ON cp.periodo_id = p.id
        INNER JOIN users u ON cg.students_id = u.id
        WHERE cp.id = ?`,
        [id]
      );

      const teacherId = teacher[0].id;

      await Notas.deleteNota(id, teacherId, async (err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: err.message,
          });
        }

        if (notaInfo.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Nota no encontrada.",
          });
        }

        res.status(200).json({
          success: true,
          message: data.message,
        });

        const student = notaInfo[0];

        //  Enviar correo de eliminación de nota
        // const templatePath = path.join(
        //   __dirname,
        //   "../templates/nuevaNota.html"
        // );
        // const replacements = {
        //   nombreCompleto: `${student.first_name} ${student.second_name || ""} ${
        //     student.apellido
        //   }`,
        //   asignatura: student.asignatura_nombre,
        //   periodo: student.periodo_nombre,
        //   calificacion: "Eliminada",
        // };

        // await sendEmail(
        //   student.correo,
        //   "📚 Nota Eliminada",
        //   templatePath,
        //   replacements
        // );

        
      });
    } catch (error) {
      console.error("Error al eliminar la nota:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error interno al eliminar la nota.",
      });
    }
  },
};

const Indicadores = require("../models/indicadores");
const db = require("../config/db");

module.exports = {
  // Crear indicador (solo profesores)
  async createIndicador(req, res) {
    const indicadores = req.body; // ahora espera un array [{ asignatura_id, periodo_id, descripcion }]
    const userId = req.user.id;
  
    if (req.user.rol_id !== 2) {
      return res.status(403).json({
        success: false,
        message: "Solo los profesores pueden crear indicadores.",
      });
    }
  
    try {
      const [[teacher]] = await db.query("SELECT id FROM teachers WHERE users_id = ?", [userId]);
      if (!teacher) {
        return res.status(403).json({
          success: false,
          message: "No estás registrado como profesor.",
        });
      }
  
      const [[salon]] = await db.query("SELECT id, grado FROM salones WHERE director_id = ?", [teacher.id]);
      if (!salon) {
        return res.status(403).json({
          success: false,
          message: "No tienes un salón asignado.",
        });
      }
  
      const grado = salon.grado.toLowerCase().trim();
      console.log(grado)

      // Mismo mapa del frontend
      const asignaturasPorGrado = {
        parvulos: [1, 4, 5, 6, 7, 8, 9, 10, 11],
        prejardin: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11],
        jardin: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11],
        transicion: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11],
      };

      const asignaturasEsperadas = asignaturasPorGrado[grado];
      if (!asignaturasEsperadas) {
        return res.status(400).json({
          success: false,
          message: `No se pudo identificar las asignaturas para el grado ${grado}.`,
        });
      }

      const tieneContenidoReal = (html) => {
        if (!html || typeof html !== "string") return false;
      
        const sinEtiquetas = html
          .replace(/<(ul|ol|li|br|p|div|span)[^>]*>/gi, "")  // quita etiquetas comunes sin contenido
          .replace(/<\/(ul|ol|li|br|p|div|span)>/gi, "")
          .replace(/<[^>]*>/g, "") // quita cualquier otra etiqueta HTML
          .replace(/&nbsp;/g, "")  // reemplaza espacios HTML
          .replace(/\s+/g, "");    // quita espacios reales
      
        return sinEtiquetas.length > 0;
      };
      
      // Verificar que todas las asignaturas estén en los datos enviados y que tengan descripción
      const faltantes = asignaturasEsperadas.filter((id) => {
        const match = indicadores.find((i) => Number(i.asignatura_id) === Number(id));
        const desc = match?.descripcion;
        return !match || !tieneContenidoReal(desc);
      });


      if (faltantes.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Debe diligenciar todos los indicadores antes de guardar.",
        });
      }

      // Crear solo los que no existen
      for (const indicador of indicadores) {
        const { asignatura_id, periodo_id, descripcion } = indicador;

        const yaExiste = await Indicadores.getIndicadorByAsignaturaPeriodoSalon(
          asignatura_id,
          periodo_id,
          salon.id
        );

        if (!yaExiste) {
          await Indicadores.createIndicador(asignatura_id, periodo_id, salon.id, descripcion);
        }
      }
  
      return res.status(201).json({
        success: true,
        message: "Indicadores guardados correctamente.",
      });
    } catch (error) {
      console.error("Error al crear los indicadores:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error interno al guardar los indicadores.",
      });
    }
  },

  // Editar un indicador
  async updateIndicador(req, res) {
    const { id } = req.params;
    // const userId = req.user.id;
    const { descripcion } = req.body;

    if (req.user.rol_id !== 2) {
      return res.status(403).json({
        success: false,
        message: "Solo los profesores pueden editar indicadores.",
      });
    }

    try {
      const [teacherData] = await db.query(
        "SELECT id FROM teachers WHERE users_id = ?",
        [req.user.id]
      );

      if (teacherData.length === 0) {
        return res.status(403).json({
          success: false,
          message: "No estás registrado como profesor.",
        });
      }

      const indicador = await Indicadores.getIndicadorById(id);
      if (!indicador) {
        return res.status(404).json({
          success: false,
          message: "Indicador no encontrado.",
        });
      }

      await Indicadores.updateIndicador(id, descripcion);

      return res.status(200).json({
        success: true,
        message: "Indicador actualizado correctamente.",
      });
    } catch (error) {
      console.error("Error al actualizar el indicador:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error interno al actualizar el indicador.",
      });
    }
  },

  // Eliminar un indicador
  async deleteIndicador(req, res) {
    const userId = req.user.id;
    const { periodoId, salonId } = req.params;

    if (req.user.rol_id !== 2) {
      return res.status(403).json({
        success: false,
        message: "Solo los profesores pueden eliminar indicadores.",
      });
    }

    try {
      const [teacherData] = await db.query(
        "SELECT id FROM teachers WHERE users_id = ?",
        [userId]
      );

      if (teacherData.length === 0) {
        return res.status(403).json({
          success: false,
          message: "No estás registrado como profesor.",
        });
      }

      const indicador = await Indicadores.getIndicadorByPeriodoSalon(periodoId, salonId);
      if (!indicador) {
        return res.status(404).json({
          success: false,
          message: "Indicador no encontrado.",
        });
      }

      await Indicadores.deleteIndicador(periodoId, salonId);

      return res.status(200).json({
        success: true,
        message: "Indicadores eliminados correctamente.",
      });
    } catch (error) {
      console.error("Error al eliminar los indicadores:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error interno al eliminar los indicadores.",
      });
    }
  },

  async indicadoresByPeriodoSalon(req, res) {
    const { periodoId, salonId } = req.params;
  
    try {
      const data = await Indicadores.getIndicadorByPeriodoSalon(periodoId, salonId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Error al obtener indicadores por periodo y salón:", error.message);
      res.status(500).json({ success: false, message: "Error interno al obtener indicadores." });
    }
  },  

  // Obtener indicadores de un profesor
  async getIndicadoresByDocente(req, res) {
    if (req.user.rol_id !== 2) {
      return res.status(403).json({
        success: false,
        message: "Solo los profesores pueden consultar sus indicadores.",
      });
    }

    try {
      const [teacherData] = await db.query(
        "SELECT id FROM teachers WHERE users_id = ?",
        [req.user.id]
      );

      if (teacherData.length === 0) {
        return res.status(403).json({
          success: false,
          message: "No estás registrado como profesor.",
        });
      }

      const teacherId = teacherData[0].id;
      const indicadores = await Indicadores.getIndicadoresByDocente(teacherId);

      return res.status(200).json({
        success: true,
        data: indicadores,
      });
    } catch (error) {
      console.error("Error al obtener los indicadores:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error interno al obtener los indicadores.",
      });
    }
  },
};

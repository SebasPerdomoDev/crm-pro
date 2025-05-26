const Boletin = require("../models/boletin");
const {
  generarPDF,
  cargarPlantillaBoletin,
} = require("../services/pdfService");
const {
  cloudinary
} = require("../utils/cloudinary");
const path = require("path");
const fs = require("fs");
const os = require("os");
const db = require("../config/db");

// Convertir logo a Base64 para que se muestre correctamente en el PDF
function getLogoBase64() {
  const logoPath = path.join(__dirname, "../src/img/logo arreglado.png"); // Ajusta la ruta
  if (fs.existsSync(logoPath)) {
    const image = fs.readFileSync(logoPath);
    return `data:image/png;base64,${image.toString("base64")}`;
  }
  return ""; // Si no se encuentra el logo, devolver vacío
}

// Convertir imagen a Base64
function getImageBase64(imagePath) {
  const filePath = path.join(__dirname, "../src/img", imagePath); // Ajusta la ruta según tu estructura
  if (fs.existsSync(filePath)) {
    const image = fs.readFileSync(filePath);
    return `data:image/png;base64,${image.toString("base64")}`;
  }
  return ""; // Retornar vacío si no se encuentra la imagen
}

const caritasMap = {
  feliz: getImageBase64("caritaFeliz.png"),
  contento: getImageBase64("caritaContento.png"), // Si tienes esta imagen
  intermedio: getImageBase64("caritaIntermedio.png"),
  triste: getImageBase64("caritaTriste.png"),
};

module.exports = {

  async getBoletinesVisibles(req, res){
    try {
      const visibles = await Boletin.getBoletinesVisibles();
      res.status(200).json({ success: true, visibles });
    } catch (err) {
      res.status(500).json({ success: false, message: "Error al obtener configuración." });
    }
  },

  async setBoletinesVisibles(req, res){
    if (![1].includes(req.user.rol_id)) {
      return res.status(403).json({ success: false, message: "No autorizado." });
    }
  
    try {
      const { visibles } = req.body;
      await Boletin.setBoletinesVisibles(visibles);
      res.status(200).json({ success: true, message: "Configuración actualizada." });
    } catch (err) {
      res.status(500).json({ success: false, message: "Error al actualizar." });
    }
  },

  async getAllBoletines(req, res) {
    try {
      const boletines = await Boletin.getAllBoletin();
      res.status(200).json({ success: true, data: boletines });
    } catch (error) {
      console.error("Error al obtener boletines:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener los boletines.",
      });
    }
  },

  async getBoletinesByDirector(req, res) {
    const userId = req.user.id;

    if (req.user.rol_id !== 2) {
      return res.status(403).json({
        success: false,
        message: "Solo el director puede realizar esta acción.",
      });
    }

    try {
      const [director] = await db.query(
        "SELECT id FROM teachers WHERE users_id = ?",
        [userId]
      );

      if (director.length === 0) {
        return res.status(404).json({
          success: false,
          message: "El usuario no está registrado como profesor.",
        });
      }

      const directorId = director[0].id;

      await Boletin.getBoletinesByDirector(directorId, (err, data) => {
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
      console.error("Error al obtener boletines por director:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error interno al obtener boletines por director.",
      });
    }
  },

  // **Crear o actualizar una observación**
  // async createOrUpdateBoletin(req, res) {
  //   try {
  //     const {
  //       students_id,
  //       periodo_id,
  //       observacion,
  //       cumplimiento_tareas,
  //       comportamiento_valores,
  //       inasistencias,
  //       comportamiento_numerico
  //     } = req.body;

  //     if (
  //       (!students_id || !periodo_id || !observacion || !inasistencias)
  //     ) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Todos los campos son obligatorios.",
  //       });
  //     }

  //     // Verificar si el estudiante tiene notas
  //     const notas = await Boletin.getCalificaciones(students_id, periodo_id);
  //     if (!notas || notas.length === 0) {
  //       return res.status(400).json({
  //         success: false,
  //         message:
  //           "No se puede crear el boletín porque el estudiante no tiene notas registradas.",
  //       });
  //     }

  //     const boletinExistente = await Boletin.getBoletin(
  //       students_id,
  //       periodo_id
  //     );
  //     if (boletinExistente) {
  //       return res.status(400).json({
  //         success: false,
  //         message:
  //           "Ya existe un boletín para este estudiante en el periodo seleccionado.",
  //       });
  //     }

  //     // Validar
  //     if (!comportamiento_numerico || comportamiento_numerico < 1 || comportamiento_numerico > 5) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "El comportamiento debe estar entre 1 y 5.",
  //       });
  //     }

  //     await Boletin.createBoletin(
  //       students_id,
  //       periodo_id,
  //       observacion,
  //       cumplimiento_tareas || null,
  //       comportamiento_valores || null,
  //       inasistencias,
  //       comportamiento_numerico || null
  //     );

  //     res.status(200).json({
  //       success: true,
  //       message: "Boletín creado correctamente.",
  //     });
  //   } catch (error) {
  //     console.error("Error al guardar la boletín:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Error interno al guardar la boletín.",
  //     });
  //   }
  // },

  async createBoletin(req, res) {
    try {
      const {
        students_id,
        periodo_id,
        observacion,
        cumplimiento_tareas,
        comportamiento_valores,
        inasistencias,
        comportamiento_numerico
      } = req.body;
  
      const boletinExistente = await Boletin.getBoletin(students_id, periodo_id);
      if (boletinExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un boletín para este estudiante en este periodo.",
        });
      }
  
      const notas = await Boletin.getCalificaciones(students_id, periodo_id);
      if (!notas || notas.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No se puede crear el boletín porque el estudiante no tiene notas registradas.",
        });
      }
  
      await Boletin.createBoletin(
        students_id,
        periodo_id,
        observacion,
        null,
        cumplimiento_tareas,
        comportamiento_valores,
        inasistencias,
        comportamiento_numerico
      );

      // ✅ Obtener el salón del estudiante
      const estudiante = await Boletin.getDatosEstudiante(students_id, periodo_id);
      await Boletin.recalcularPromediosYpuestos(estudiante.salon_id, periodo_id);
  
      res.status(200).json({
        success: true,
        message: "Boletín creado correctamente.",
      });
    } catch (error) {
      console.error("Error al crear boletín:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al crear el boletín.",
      });
    }
  },
  
  async updateBoletin(req, res) {
    try {
      const {
        students_id,
        periodo_id,
        observacion,
        cumplimiento_tareas,
        comportamiento_valores,
        inasistencias,
        comportamiento_numerico
      } = req.body;
  
      const boletin = await Boletin.getBoletin(students_id, periodo_id);
      if (!boletin) {
        return res.status(404).json({
          success: false,
          message: "El boletín no existe para este estudiante en este periodo.",
        });
      }
  
      await Boletin.updateBoletin(
        students_id,
        periodo_id,
        observacion,
        null,
        cumplimiento_tareas,
        comportamiento_valores,
        inasistencias,
        comportamiento_numerico
      );

      // Obtener el salón del estudiante
      const estudiante = await Boletin.getDatosEstudiante(students_id, periodo_id);
      await Boletin.recalcularPromediosYpuestos(estudiante.salon_id, periodo_id);
  
      res.status(200).json({
        success: true,
        message: "Boletín actualizado correctamente.",
      });
    } catch (error) {
      console.error("Error al actualizar boletín:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al actualizar el boletín.",
      });
    }
  },  

  // **Obtener una observación por estudiante y periodo**
  async getObservacion(req, res) {
    try {
      const { students_id, periodo_id } = req.params;

      if (!students_id || !periodo_id) {
        return res.status(400).json({
          success: false,
          message: "Se requiere students_id y periodo_id.",
        });
      }

      const observacion = await Boletin.getObservacion(students_id, periodo_id);

      if (!observacion) {
        return res.status(404).json({
          success: false,
          message: "No se encontró una boletín para este estudiante y período.",
        });
      }

      res.status(200).json({
        success: true,
        data: observacion,
      });
    } catch (error) {
      console.error("Error al obtener la boletín:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al obtener la boletín.",
      });
    }
  },

  // **Eliminar una observación**
  async deleteObservacion(req, res) {
    try {
      const { students_id, periodo_id } = req.params;

      if (!students_id || !periodo_id) {
        return res.status(400).json({
          success: false,
          message: "Se requiere students_id y periodo_id.",
        });
      }

      await Boletin.deleteObservacion(students_id, periodo_id);

      res.status(200).json({
        success: true,
        message: "Boletín eliminada correctamente.",
      });
    } catch (error) {
      console.error("Error al eliminar la boletín:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al eliminar la boletín.",
      });
    }
  },

  async generarBoletinPreescolar(req, res) {
    try {
      const { studentId, periodoId } = req.params;

      // Obtener observación general del profesor
      const observacionData = await Boletin.getBoletin(studentId, periodoId);
      const observacion =
        observacionData?.observacion || "No hay observacion registrada.";
      const cumplimientoTareas = observacionData?.cumplimiento_tareas || "N/A";
      const comportamientoValores =
        observacionData?.comportamiento_valores || "N/A";
      const inasistencias =
        observacionData?.inasistencias !== null
          ? observacionData.inasistencias
          : "0";
      const añoActual = new Date().getFullYear(); // Obtiene el año actual
      const firmaRectorBase64 = getImageBase64("firma_rector1.png");

      // Obtener los datos del boletín
      const datosBoletin = await Boletin.getBoletinByStudent(
        studentId,
        periodoId
      );
      if (!datosBoletin || datosBoletin.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No se encontraron calificaciones para este boletín.",
        });
      }

      // Asegurar que cada dato sea válido antes de usar `toUpperCase()`
      const estudiante = {
        nombre_completo: `${(
          datosBoletin[0].first_name || ""
        ).toUpperCase()} ${(
          datosBoletin[0].second_name || ""
        ).toUpperCase()} ${(datosBoletin[0].apellido || "").toUpperCase()}`,
        salon_nombre: (
          datosBoletin[0].salon_nombre || "SIN SALÓN"
        ).toUpperCase(),
        grado: (datosBoletin[0].grado || "SIN GRADO").toUpperCase(),
        periodo_nombre: (
          datosBoletin[0].periodo_nombre || "SIN PERIODO"
        ).toUpperCase(),
        director: datosBoletin[0].director_nombre || "NO ASIGNADO",
        observacion,
      };

      // Convertir valores en imágenes
      const cumplimientoTareasImg = caritasMap[cumplimientoTareas]
        ? `<img src="${caritasMap[cumplimientoTareas]}" width="60" height="60">`
        : "N/A";
      const comportamientoValoresImg = caritasMap[comportamientoValores]
        ? `<img src="${caritasMap[comportamientoValores]}" width="60" height="60">`
        : "N/A";

      // Agrupar asignaturas por dimensión
      const dimensiones = {
        "DIMENSIÓN COGNOSCITIVA": [],
        "DIMENSIÓN COMUNICATIVA": [],
        "DIMENSIÓN ESPIRITUAL": [],
        "DIMENSIÓN ESTÉTICA": [],
        "DIMENSIÓN CORPORAL": [],
      };

      datosBoletin.forEach((materia) => {
        const asignatura = (
          materia.asignatura_nombre || "SIN ASIGNATURA"
        ).toUpperCase();

        const competencia = materia.competencia_lograda || "Sin Información";

        let simbolo = caritasMap[materia.simbolo_carita]
          ? `<img src="${
              caritasMap[materia.simbolo_carita]
            }" width="60" height="60" alt="${materia.simbolo_carita}">`
          : "N/A"; // Si no encuentra una imagen, pone "N/A"

        let fila = `<tr>
                      <td>
                        <strong class="asignatura">${asignatura}:</strong></br>
                        <div class="competencia">${competencia}</div>
                      </td>
                      <td class="valoracion">${simbolo}</td>
                    </tr>`;

        const descripcionSinTildes = (materia.descripcion || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        if (descripcionSinTildes.includes("cognoscitiva")) {
          dimensiones["DIMENSIÓN COGNOSCITIVA"].push(fila);
        } else if (descripcionSinTildes.includes("comunicativa")) {
          dimensiones["DIMENSIÓN COMUNICATIVA"].push(fila);
        } else if (descripcionSinTildes.includes("espiritual")) {
          dimensiones["DIMENSIÓN ESPIRITUAL"].push(fila);
        } else if (descripcionSinTildes.includes("estetica")) {
          dimensiones["DIMENSIÓN ESTÉTICA"].push(fila);
        } else if (descripcionSinTildes.includes("corporal")) {
          dimensiones["DIMENSIÓN CORPORAL"].push(fila);
        }
      });

      // Generar tabla de calificaciones
      let tablaHTML = "";

      // Filtrar dimensiones con datos para evitar repeticiones innecesarias
      const dimensionesConDatos = Object.entries(dimensiones).filter(
        ([nombre, filas]) => filas.length > 0
      );

      dimensionesConDatos.forEach(([nombre, filas], index) => {
        tablaHTML += `
        <table class="grades-table" style="page-break-inside: auto;">
            <thead>
                <tr style="background-color: #11308C; color: white; -webkit-print-color-adjust: exact;">
                    <th>${nombre}</th>
                    <th>VALORACIÓN</th>
                </tr>
            </thead>
            <tbody>
                ${filas.join("")}
            </tbody>
        </table>`;
      });

      // Agregar los nuevos campos al final de la tabla
      tablaHTML += `
      <table class="grades-table" style="page-break-inside: avoid;">
          <thead>
              <tr style="background-color: #11308C; color: white; -webkit-print-color-adjust: exact;">
                  <th>ASPECTOS GENERALES</th>
                  <th>VALORACIÓN</th>
              </tr>
          </thead>
          <tbody>
              <tr>
                  <td><strong>CUMPLIMIENTO DE TAREAS Y COMPROMISOS:</strong></td>
                  <td>${cumplimientoTareasImg}</td>
              </tr>
              <tr>
                  <td><strong>COMPORTAMIENTO – VALORES:</strong></td>
                  <td>${comportamientoValoresImg}</td>
              </tr>
              <tr>
                  <td><strong>INASISTENCIA AL COLEGIO:</strong></td>
                  <td>${inasistencias}</td>
              </tr>
          </tbody>
      </table>`;
      // Asignar caritas a cada nivel de desempeño
      const caritaSuperior = caritasMap["feliz"];
      const caritaAlto = caritasMap["contento"];
      const caritaBasico = caritasMap["intermedio"];
      const caritaBajo = caritasMap["triste"];

      // Cargar plantilla HTML
      // Asegúrate de reemplazar solo la parte que se encarga de cargar la plantilla y reemplazar los valores

      const plantillaHTMLBruto = cargarPlantillaBoletin("BoletinPreescolar.html");

      const replacements = {
        "{{Boletingrado}}": estudiante.grado,
        "{{logo}}": getLogoBase64(),
        "{{carita_superior}}": caritaSuperior,
        "{{carita_alto}}": caritaAlto,
        "{{carita_basico}}": caritaBasico,
        "{{carita_bajo}}": caritaBajo,
        "{{nombre_estudiante}}": estudiante.nombre_completo,
        "{{grado}}": estudiante.grado,
        "{{periodo_nombre}}": estudiante.periodo_nombre,
        "{{año_actual}}": añoActual,
        "{{tabla_notas}}": tablaHTML,
        "{{observacion}}": estudiante.observacion,
        "{{director}}": estudiante.director,
        "{{firma_rector}}": firmaRectorBase64,
      };

      let plantillaHTML = plantillaHTMLBruto;
      for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"); // escapa caracteres
        plantillaHTML = plantillaHTML.replace(regex, value);
      }

      // Confirmar que el HTML resultante es correcto antes de generar el PDF
      // console.log(plantillaHTML.slice(0, 2000));

      // Guardar PDF en carpeta temporal
      const tempFilePath = path.join(
        os.tmpdir(),
        `boletin_${estudiante.nombre_completo}_${estudiante.periodo_nombre}.pdf`
      );
      const pdfBuffer = await generarPDF(plantillaHTML);
      fs.writeFileSync(tempFilePath, pdfBuffer);

      // Subir a Cloudinary
      const cloudinaryFileName = `boletin_${estudiante.nombre_completo}_${estudiante.periodo_nombre}`;
      const result = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: "raw",
        folder: "boletines",
        public_id: cloudinaryFileName,
        format: "pdf",
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        upload_preset: "boletines_publico",
      });

      const pdfUrl = result.secure_url;
      console.log(pdfUrl);

      // Guardar la URL en la base de datos
      await Boletin.savePDF(studentId, periodoId, pdfUrl);

      // Retornar el link del PDF generado
      return res.status(200).json({
        success: true,
        message: "Boletín generado correctamente.",
        pdfUrl,
      });
    } catch (error) {
      console.error("Error al generar el boletín:", error);
      res
        .status(500)
        .json({ success: false, message: "ERROR AL GENERAR EL BOLETÍN." });
    }
  },

  async generarBoletinPrimaria(req, res) {
    try {
      const { studentId, periodoId } = req.params;

      // Obtener información del boletín
      const observacionData = await Boletin.getBoletin(studentId, periodoId);
      const observacion =
        observacionData?.observacion ||
        "No hay observación registrada.";
      const inasistencias =
        observacionData?.inasistencias !== null
          ? observacionData.inasistencias
          : "0";
      const puesto_grupo = observacionData?.puesto_grupo !== null ? observacionData.puesto_grupo : 0;
      const promedio_final = observacionData?.promedio_final_periodo !== null ? observacionData.promedio_final_periodo : 0;
      const comportamiento = observacionData?.comportamiento_numerico || "N/A";
      const añoActual = new Date().getFullYear(); // Obtiene el año actual
      const firmaRectorBase64 = getImageBase64("firma_rector1.png");
      
      const datosBoletin = await Boletin.getBoletinByStudent(
        studentId,
        periodoId
      );
      if (!datosBoletin || datosBoletin.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No se encontraron datos para este boletín.",
        });
      }
      // Recalcular puestos y obtener el total actualizado
      const total = await Boletin.recalcularPromediosYpuestos(datosBoletin[0].salon_id, periodoId);
      // const { promedio, puesto, total } = await Boletin.getPromedioYPuesto(studentId, periodoId);
      // const calificaciones = datosBoletin
      //   .filter((m) => typeof m.calificacion === "number")
      //   .map((m) => m.calificacion);

      // if (observacionData?.comportamiento_numerico) {
      //   calificaciones.push(observacionData.comportamiento_numerico);
      // }

      // const promedio = calificaciones.length
      //   ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length
      //   : 0;

      // const { total } = await Boletin.recalcularPromediosYpuestos(studentId, periodoId);

      // function redondearPersonalizado(num) {
      //   const str = num.toString();
      //   const [entero, decimales = ""] = str.split(".");
      //   const dec1 = decimales[0] || "0";
      //   const dec2 = decimales[1] || "0";
      //   const dec3 = decimales[2] || "0";
      
      //   let resultado = Number(`${entero}.${dec1}${dec2}`);
      
      //   if (parseInt(dec3) >= 6) {
      //     resultado = Math.round((resultado + 0.01) * 100) / 100;
      //   }
      
      //   return resultado.toFixed(1);
      // }
      


      // Información del estudiante
      const estudiante = {
        nombre_completo: `${(
          datosBoletin[0].first_name || ""
        ).toUpperCase()} ${(
          datosBoletin[0].second_name || ""
        ).toUpperCase()} ${(datosBoletin[0].apellido || "").toUpperCase()}`,
        salon_nombre: (
          datosBoletin[0].salon_nombre || "SIN SALÓN"
        ).toUpperCase(),
        grado: (datosBoletin[0].grado || "SIN GRADO").toUpperCase(),
        periodo_nombre: (
          datosBoletin[0].periodo_nombre || "SIN PERIODO"
        ).toUpperCase(),
        director: (
          datosBoletin[0].director_nombre || "NO ASIGNADO"
        ),
        puesto_grupo,
        promedio_final,
        observacion,
      };

      // Orden fijo deseado
      const ordenAsignaturas = [
        "Ciencias naturales y educación ambiental",
        "Ciencias sociales, Historia, geografía y constitución",
        "Pensamiento numérico (matemáticas)",
        "Pensamiento geométrico",
        "Pensamiento estadístico",
        "Lengua castellana", // Exclusiva para grado primero
        "Lengua, ortografía y caligrafía", // 2 y 3
        "Plan lector y ortografía", //grado primero
        "Lenguas extranjeras (inglés)",
        "Educación religiosa, ética y valores", //2 y 3
        "Educación religiosa",//grado primero
        "Ética y valores", //grado primero
        "Educación artística", //grado 2 y 3
        "Tecnología e informática",
        "Educación física recreación y deporte",
        "Cátedra de la paz",
        "Cívica y urbanidad"
      ];

      // Reordenar los datos de las asignaturas
      const datosOrdenados = ordenAsignaturas.map(nombre =>
        datosBoletin.find(m => m.asignatura_nombre.trim().toLowerCase() === nombre.trim().toLowerCase())
      ).filter(Boolean); // Filtra nulos

      // Generar la tabla de asignaturas con calificaciones numéricas
      let tablaHTML = `
        <table class="grades-table">
            <thead style="background-color: #11308C; color: white; -webkit-print-color-adjust: exact;">
                <tr>
                    <th>ASIGNATURA</th>
                    <th>I.H</th>
                    <th>VALORACIÓN</th>
                    <th>DESEMPEÑO</th>
                </tr>
            </thead>
            <tbody>`;

      datosOrdenados.forEach((materia) => {
        const asignatura = materia.asignatura_nombre || "Sin Asignatura";
        const intensidadHoraria = materia.IH || "N/A";
        // const fallas = materia.inasistencias || "0";
        const calificacion = materia.calificacion || "N/A";

        let desempeno = "BAJO";
        if (calificacion >= 4.6) desempeno = "SUPERIOR";
        else if (calificacion >= 4.0) desempeno = "ALTO";
        else if (calificacion >= 3.0) desempeno = "BÁSICO";

        tablaHTML += `
                <tr>
                    <td>${asignatura}</td>
                    <td>${intensidadHoraria}</td>                    
                    <td>${calificacion}</td>
                    <td>${desempeno}</td>
                </tr>`;
      });

      // Agregar Comportamiento al final
      let desempenoComp = "BAJO";
      if (comportamiento >= 4.6) desempenoComp = "SUPERIOR";
      else if (comportamiento >= 4.0) desempenoComp = "ALTO";
      else if (comportamiento >= 3.0) desempenoComp = "BÁSICO";

      tablaHTML += `
              <tr>
                  <td colspan="2"><strong>Comportamiento</strong></td>
                  <td>${comportamiento}</td>
                  <td>${desempenoComp}</td>
              </tr>
              <tr>
                  <td colspan="2"><strong>Inasistencias</strong></td>
                  <td colspan="2">${inasistencias}</td>
              </tr>
            </tbody>
        </table>`;

      // Cargar la plantilla HTML y reemplazar datos
      let plantillaHTML = cargarPlantillaBoletin("BoletinPrimaria.html");

      plantillaHTML = plantillaHTML
        .replace("{{Boletingrado}}", estudiante.grado)
        .replace("{{logo}}", getLogoBase64())
        .replace("{{nombre_estudiante}}", estudiante.nombre_completo)
        .replace("{{grado}}", estudiante.grado)
        .replace("{{periodo_nombre}}", estudiante.periodo_nombre)
        .replace("{{año_actual}}", añoActual) // Año dinámico
        .replace("{{tabla_notas}}", tablaHTML)
        .replace("{{puesto_grupo}}", estudiante.puesto_grupo)
        .replace("{{total_estudiantes}}", total)
        .replace("{{promedio_final}}", estudiante.promedio_final)
        // .replace("{{promedio_final}}", redondearPersonalizado(promedio))
        .replace("{{observacion}}", estudiante.observacion)
        .replace("{{inasistencias}}", estudiante.inasistencias)
        .replace("{{director}}", estudiante.director)
        .replace("{{firma_rector}}", firmaRectorBase64);

      // Guardar PDF en carpeta temporal
      const tempFilePath = path.join(
        os.tmpdir(),
        `boletin_${estudiante.nombre_completo}_${estudiante.periodo_nombre}.pdf`
      );
      const pdfBuffer = await generarPDF(plantillaHTML);
      fs.writeFileSync(tempFilePath, pdfBuffer);

      // Subir a Cloudinary
      const cloudinaryFileName = `boletin_${estudiante.nombre_completo}_${estudiante.periodo_nombre}`;
      const result = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: "raw",
        folder: "boletines",
        public_id: cloudinaryFileName,
        format: "pdf",
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        upload_preset: "boletines_publico",
      });

      const pdfUrl = result.secure_url;
      console.log(pdfUrl);

      // Guardar la URL en la base de datos
      await Boletin.savePDF(studentId, periodoId, pdfUrl);

      // Retornar el link del PDF generado
      return res.status(200).json({
        success: true,
        message: "Boletín generado correctamente.",
        pdfUrl,
      });
    } catch (error) {
      console.error("Error al generar el boletín:", error);
      res
        .status(500)
        .json({ success: false, message: "ERROR AL GENERAR EL BOLETÍN." });
    }
  },

  async deleteBoletin(req, res) {
    try {
      const { students_id, periodo_id } = req.params;
  
      if (!students_id || !periodo_id) {
        return res.status(400).json({
          success: false,
          message: "Parámetros inválidos.",
        });
      }
  
      const boletinExistente = await Boletin.getBoletin(students_id, periodo_id);
      if (!boletinExistente) {
        return res.status(404).json({
          success: false,
          message: "El boletín no existe.",
        });
      }
  
      await Boletin.deleteBoletin(students_id, periodo_id);
  
      res.status(200).json({
        success: true,
        message: "Boletín eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error al eliminar boletín:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al eliminar el boletín.",
      });
    }
  }
  
};



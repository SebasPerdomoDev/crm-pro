const { cloudinary } = require("../utils/cloudinary");
const Agenda = require("../models/agendas");
const sharp = require("sharp");
const path = require("path");
const sendEmail = require("../services/emailService");
const db = require("../config/db");

// Obtener los correos según el tipo de evento
async function obtenerCorreosNotificacion(salon_id, es_evento_general) {
  let correos = [];
  try {
    if (es_evento_general === 1) {
      const [usuarios] = await db.query(`SELECT correo FROM users`);
      correos = usuarios.map((u) => u.correo);
    } else if (salon_id) {
      const [estudiantes] = await db.query(
        `SELECT u.correo FROM users u 
         INNER JOIN students s ON u.id = s.users_id 
         WHERE s.salon_id = ?`,
        [salon_id]
      );
      correos = estudiantes.map((e) => e.correo);
    }
  } catch (error) {
    console.error("Error obteniendo correos:", error);
  }
  return correos;
}

// Enviar notificación de evento
async function enviarCorreoEvento(evento, correos, accion) {
  const templatePath = path.join(__dirname, `../templates/Evento.html`);
  const replacements = {
    titulo: evento.titulo,
    fecha: evento.fecha,
    descripcion: evento.descripcion,
  };

  // Función para enviar correos con un retraso entre ellos
  const sendEmailsWithDelay = async (correos, delay = 3000) => {
    for (const correo of correos) {
      try {
        console.log(`Enviando correo a: ${correo}`);
        await sendEmail(
          correo,
          `📅 ${accion} de Evento`,
          templatePath,
          replacements
        );
        await new Promise((resolve) => setTimeout(resolve, delay)); // Espera antes de enviar el siguiente
      } catch (error) {
        console.error(`Error enviando correo a ${correo}:`, error);
      }
    }
  };

  sendEmailsWithDelay(correos, 5000); // 5 segundos entre cada correo
}

// Función para limpiar el título y eliminar caracteres especiales
const sanitizeTitleForCloudinary = (title) => {
  return title
    .normalize("NFD") // Eliminar acentos
    .replace(/[\u0300-\u036f]/g, "") // Remueve diacríticos (acentos, tildes)
    .replace(/[^a-zA-Z0-9_-]/g, "_") // Sustituir espacios y caracteres no permitidos
    .substring(0, 50); // Limitar longitud máxima
};

// 🔹 Función para comprimir imágenes con Sharp antes de subirlas a Cloudinary
const compressImage = async (buffer) => {
  return sharp(buffer)
    .resize({ width: 1200 }) // Ajustar el tamaño a un máximo de 1200px de ancho
    .toFormat("webp")
    .webp({ quality: 80 }) // Reducir la calidad al 80% sin perder demasiada definición
    .toBuffer();
};

// 🔹 Función para subir imágenes a Cloudinary con Streams
const uploadToCloudinary = async (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "eventos",
        public_id: publicId,
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

// 🔹 Función para dividir un array en "lotes" para evitar sobrecarga
// const chunkArray = (array, size) => {
//   return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
//     array.slice(i * size, i * size + size)
//   );
// };

// 🔹 Subir imágenes en lotes pequeños (grupos de 5 imágenes)
const subirImagenesEnLotes = async (files, titulo, fecha) => {
  let validImages = [];
  const batchSize = 5; // Número de imágenes que se suben en paralelo

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize); // Extrae 5 imágenes
    const batchPromises = batch.map(async (file, index) => {
      try {
        const sanitizedTitle = titulo.replace(/[^a-zA-Z0-9_-]/g, "_");
        const publicId = `eventos/${fecha}_${sanitizedTitle}_${i + index}`;
        const compressedBuffer = await compressImage(file.buffer);
        return await uploadToCloudinary(compressedBuffer, publicId);
      } catch (error) {
        console.error(`❌ Error al subir imagen:`, error);
        return null;
      }
    });

    // Esperar a que el lote termine antes de continuar
    const batchResults = await Promise.all(batchPromises);
    validImages.push(...batchResults.filter((url) => url !== null));
  }

  return validImages;
};

module.exports = {
  // Crear un evento
  async crearEvento(req, res) {
    const {
      titulo,
      fecha,
      descripcion,
      salon_id,
      asignatura_id,
      es_evento_general,
    } = req.body;
    const { id: userId, rol_id } = req.user;

    try {
      // Validaciones iniciales
      if (!titulo || !fecha || !descripcion) {
        return res.status(400).json({
          success: false,
          message: "El título, la fecha y la descripción son obligatorios.",
        });
      }

      // Convertir `es_evento_general` a número correctamente
      const esEventoGeneral =
        es_evento_general === "true" || es_evento_general === 1 ? 1 : 0;

      //  Reglas según el rol
      if (rol_id === 2) {
        if (!salon_id) {
          return res.status(400).json({
            success: false,
            message: "El salón es obligatorio para los profesores.",
          });
        }
        if (esEventoGeneral) {
          return res.status(403).json({
            success: false,
            message: "Los profesores no pueden crear eventos generales.",
          });
        }
      } else if (rol_id === 1) {
        if (!esEventoGeneral) {
          return res.status(400).json({
            success: false,
            message: "El rector solo puede crear eventos generales.",
          });
        }
        // if (salon_id || asignatura_id) {
        //   return res.status(400).json({
        //     success: false,
        //     message:
        //       "El rector no puede asignar un salón o asignatura a un evento.",
        //   });
        // }
      } else {
        return res.status(403).json({
          success: false,
          message: "No tienes permiso para crear eventos.",
        });
      }

      // // Validar imágenes
      // if (!req.files || req.files.length === 0) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Es necesario subir al menos una foto.",
      //   });
      // }

      // Subir fotos a Cloudinary
      // const uploadedImages = await Promise.all(
      //   req.files.map(async (file, index) => {
      //     const sanitizedTitle = sanitizeTitleForCloudinary(titulo); // Llamar la función
      //     const publicId = `eventos/${fecha}_${sanitizedTitle}_${index}`;
      //     try {
      //       const compressedBuffer = await compressImage(file.buffer);
      //       const uploadResult = await new Promise((resolve, reject) => {
      //         const uploadStream = cloudinary.uploader.upload_stream(
      //           {
      //             folder: "eventos",
      //             public_id: publicId,
      //             resource_type: "image",
      //             transformation: [
      //               { quality: "auto:eco", fetch_format: "auto" },
      //             ],
      //           },
      //           (error, result) => {
      //             if (error) return reject(error);
      //             resolve(result.secure_url);
      //           }
      //         );
      //         uploadStream.end(compressedBuffer);
      //       });

      //       return uploadResult;
      //     } catch (error) {
      //       console.error(` Error al subir imagen ${index}:`, error);
      //       return null;
      //     }
      //   })
      // );

      // Filtrar imágenes subidas exitosamente
      // const validImages = uploadedImages.filter((url) => url !== null);

      // 🔹 Subida de imágenes en lotes
      // let validImages = [];
      // if (req.files && req.files.length > 0) {
      //   validImages = await subirImagenesEnLotes(req.files, titulo, fecha);
      // }

      // console.log(`✅ ${validImages.length} imágenes subidas con éxito.`);

      // Construcción del objeto evento
      const evento = {
        users_id: userId,
        titulo,
        fecha,
        descripcion,
        salon_id: rol_id === 2 ? salon_id : null,
        asignatura_id: rol_id === 2 ? asignatura_id : null,
        es_evento_general: esEventoGeneral, // Convertido correctamente
      };

      // Guardar en la BD
      Agenda.createEvento(evento, async (err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al crear el evento.",
            error: err.message || err,
          });
        }

        if (!data || !data.insertId) {
          console.error("❌ Error: No se recibió insertId al crear evento.");
          return res.status(500).json({
            success: false,
            message: "Error interno: El evento no se creó correctamente.",
          });
        }

        const eventId = data.insertId;
        console.log(`✅ Evento creado correctamente con ID: ${eventId}`);

        // Enviar respuesta de éxito ANTES de enviar correos
        res.status(200).json({
          success: true,
          message:
            "Evento creado correctamente. Las imágenes se están subiendo en segundo plano.",
          data,
        });

        // 🔹 SUBIR IMÁGENES EN SEGUNDO PLANO
        setImmediate(async () => {
          if (req.files && req.files.length > 0) {
            console.log(`📤 Subiendo ${req.files.length} imágenes...`);

            const validImages = await subirImagenesEnLotes(
              req.files,
              titulo,
              fecha
            );

            console.log(`✅ ${validImages.length} imágenes subidas con éxito.`);

            // 🔹 ACTUALIZAR BD con URLs de imágenes
            await Agenda.updateEvento(
              data.insertId,
              evento,
              validImages,
              async (err) => {
                if (err) {
                  console.error("❌ Error al actualizar imágenes en BD:", err);
                } else {
                  console.log(
                    `✅ Se han insertado ${validImages.length} imágenes en la BD`
                  );
                }
              }
            );

            // 🔹 ENVIAR NOTIFICACIONES DESPUÉS DE SUBIR IMÁGENES
            const correos = await obtenerCorreosNotificacion(
              salon_id,
              esEventoGeneral
            );
            if (correos.length > 0) {
              setImmediate(() => enviarCorreoEvento(evento, correos, "Nuevo"));
            }
          }
        });

        // Obtener correos y enviar notificaciones en segundo plano
        // const correos = await obtenerCorreosNotificacion(
        //   salon_id,
        //   esEventoGeneral
        // );

        // if (correos.length === 0) {
        //   console.warn("No se encontraron correos para notificar.");
        // } else {
        //   setImmediate(() => enviarCorreoEvento(evento, correos, "Nuevo"));
        // }
      });
    } catch (error) {
      console.error("Error interno al crear evento:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },

  // Actualizar un evento
  async actualizarEvento(req, res) {
    const { id } = req.params; // ID del evento
    const userId = req.user.id; // ID del usuario logeado
    const {
      titulo,
      fecha,
      descripcion,
      salon_id,
      asignatura_id,
      es_evento_general,
    } = req.body;
    // console.log("📦 Archivos recibidos en el backend:", req.files); // LOG IMPORTANTE

    try {
      // 1. Verificar que el evento existe y pertenece al usuario logueado
      const [existingEventos] = await db.query(
        `SELECT * FROM agendas WHERE id = ?`,
        [id]
      );

      if (!existingEventos.length) {
        return res
          .status(404)
          .json({ success: false, message: "Evento no encontrado." });
      }

      const existingEvento = existingEventos[0];

      if (existingEvento.users_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "No tienes permiso para editar este evento.",
        });
      }

      // 2. Mantener valores existentes si no se proporcionan en la solicitud
      const updatedEvento = {
        titulo: titulo || existingEvento.titulo,
        fecha: fecha || existingEvento.fecha,
        descripcion: descripcion || existingEvento.descripcion,
        salon_id: salon_id !== undefined ? salon_id : existingEvento.salon_id,
        asignatura_id:
          asignatura_id !== undefined
            ? asignatura_id
            : existingEvento.asignatura_id,
        es_evento_general:
          es_evento_general !== undefined
            ? es_evento_general === "true"
              ? 1
              : 0 // Convertir "true"/"false" a 1/0
            : existingEvento.es_evento_general,
      };

      // Obtener el total de imágenes ya registradas en la BD
      // const [existingFotos] = await db.query(
      //   `SELECT COUNT(*) as total FROM fotos_eventos WHERE agenda_id = ?`,
      //   [id]
      // );

      // let totalImagenesPrevias = existingFotos[0].total; // Contador para nuevas imágenes

      // const fotos = [];

      // // 3. Subir nuevas fotos a Cloudinary si se proporcionan
      // if (req.files && req.files.length > 0) {
      //   for (let i = 0; i < req.files.length; i++) {
      //     const file = req.files[i];
      //     const sanitizedTitle = sanitizeTitleForCloudinary(
      //       updatedEvento.titulo
      //     );

      //     // Iniciar índice desde el último registrado en la BD
      //     const nuevoIndice = totalImagenesPrevias + i;

      //     const publicId = `eventos/${updatedEvento.fecha}_${sanitizedTitle}_${nuevoIndice}`;

      //     try {
      //       const compressedBuffer = await compressImage(file.buffer);
      //       const uploadResult = await new Promise((resolve, reject) => {
      //         const uploadStream = cloudinary.uploader.upload_stream(
      //           {
      //             folder: "eventos",
      //             public_id: publicId, // Asegura que el índice continúe sin sobrescribir
      //             resource_type: "image",
      //             transformation: [
      //               { quality: "auto:eco", fetch_format: "auto" },
      //             ],
      //           },
      //           (error, result) => {
      //             if (error) return reject(error);
      //             resolve(result.secure_url);
      //           }
      //         );
      //         uploadStream.end(compressedBuffer);
      //       });

      //       fotos.push(uploadResult); // Agregar URL a la lista de fotos
      //     } catch (error) {
      //       console.error(`❌ Error al subir imagen ${i}:`, error);
      //     }
      //   }
      // }

      // Filtrar imágenes subidas exitosamente
      // const validImages = uploadedImages.filter((url) => url !== null);

      // Llamar a la función para actualizar el evento en la BD
      Agenda.updateEvento(id, updatedEvento, [], async (err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al actualizar el evento.",
            error: err.message || err,
          });
        }

        res.status(200).json({
          success: true,
          message: "Evento actualizado correctamente.",
          data,
        });

        // Subir imágenes en segundo plano
        if (req.files && req.files.length > 0) {
          console.log(`📤 Subiendo ${req.files.length} imágenes...`);

          setImmediate(async () => {
            const validImages = await subirImagenesEnLotes(
              req.files,
              updatedEvento.titulo,
              updatedEvento.fecha
            );

            console.log(`✅ ${validImages.length} imágenes subidas con éxito.`);

            // 5️⃣ Insertar imágenes en la BD después de subirlas
            if (validImages.length > 0) {
              await Agenda.updateEvento(
                id,
                updatedEvento,
                validImages,
                async (err) => {
                  if (err) {
                    console.error(
                      "❌ Error al actualizar imágenes en BD:",
                      err
                    );
                  } else {
                    console.log(
                      `✅ Se han insertado ${validImages.length} imágenes en la BD`
                    );
                  }
                }
              );
            }

            // 6️⃣ Enviar correos de notificación después de la subida
            const correos = await obtenerCorreosNotificacion(
              updatedEvento.salon_id,
              updatedEvento.es_evento_general
            );
            if (correos.length > 0) {
              setImmediate(() =>
                enviarCorreoEvento(updatedEvento, correos, "Actualización")
              );
            }
          });
        }

        //  Enviar correos en segundo plano
        // const correos = await obtenerCorreosNotificacion(
        //   updatedEvento.salon_id,
        //   updatedEvento.es_evento_general
        // );
        // setImmediate(() =>
        //   enviarCorreoEvento(updatedEvento, correos, "Actualización")
        // );
      });
    } catch (error) {
      console.error("Error interno al actualizar evento:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },
  // Eliminar un evento
  async eliminarEvento(req, res) {
    const { id } = req.params; // ID del evento
    const userId = req.user.id; // ID del usuario logeado
    try {
      // 1. Verificar que el evento existe y pertenece al usuario logueado
      const [existingEventos] = await db.query(
        `SELECT * FROM agendas WHERE id = ?`,
        [id]
      );

      if (!existingEventos.length) {
        return res
          .status(404)
          .json({ success: false, message: "Evento no encontrado." });
      }

      const existingEvento = existingEventos[0];

      if (existingEvento.users_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "No tienes permiso para editar este evento.",
        });
      }

      // Eliminar el evento
      Agenda.deleteEvento(id, async (err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al eliminar el evento.",
            error: err.message || err,
          });
        }

        res.status(200).json({
          success: true,
          message: "Evento eliminado correctamente.",
          data,
        });
        // Enviar correos en segundo plano
        const correos = await obtenerCorreosNotificacion(
          existingEvento.salon_id,
          existingEvento.es_evento_general
        );
        setImmediate(() =>
          enviarCorreoEvento(existingEvento, correos, "Eliminación")
        );
      });
    } catch (error) {
      console.error("Error interno al eliminar evento:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },
  // Obtener todos los eventos
  async obtenerEventos(req, res) {
    const userId = req.user.id; // Obtener el ID del usuario autenticado

    try {
      Agenda.getEventos(userId, (err, eventos) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al obtener los eventos.",
            error: err.message || err,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Eventos obtenidos correctamente.",
          data: eventos,
        });
      });
    } catch (error) {
      console.error("Error interno al obtener eventos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },
  // Obtener eventos por fecha con filtro por rol
  async obtenerEventosPorFecha(req, res) {
    const { fecha } = req.params; // Fecha del evento
    const userId = req.user.id; // Usuario logueado

    try {
      Agenda.getEventosPorFecha(fecha, userId, (err, eventos) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al obtener los eventos.",
            error: err.message || err,
          });
        }

        // Convertir fotos en arreglo
        const eventosConFotos = eventos.map((evento) => ({
          ...evento,
          fotos: evento.fotos ? evento.fotos.split(",") : [],
        }));

        return res.status(200).json({
          success: true,
          message: "Eventos obtenidos correctamente.",
          data: eventosConFotos,
        });
      });
    } catch (error) {
      console.error("Error interno al obtener eventos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },
  // Obtener eventos por ID
  async obtenerEventosPorID(req, res) {
    const { id } = req.params; // La fecha se pasa como un parámetro en la URL

    try {
      Agenda.getEventosPorID(id, (err, eventos) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al obtener los eventos.",
            error: err.message || err,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Eventos obtenidos correctamente.",
          data: eventos,
        });
      });
    } catch (error) {
      console.error("Error interno al obtener eventos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },
};

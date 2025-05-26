const keys = require("../config/keys");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const path = require("path");
const sendEmail = require("../services/emailService");
const {
  cloudinary,
  generateCloudinaryFileName,
} = require("../utils/cloudinary"); // Configura Cloudinary
const db = require("../config/db");

module.exports = {
  // FALTA AGREGARLE LA LOGICA DE EL ESTADO DE ACTIVO O NO ACTIVO
  async login(req, res) {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        success: false,
        message: "El correo y la contraseña son requeridos.",
      });
    }

    try {
      const myUser = await User.findByEmail(correo);

      if (!myUser) {
        return res.status(401).json({
          success: false,
          message: "El email no fue encontrado.",
        });
      }

      if (myUser.estado !== "activo") {
        return res.status(403).json({
          success: false,
          message: "El usuario está desactivado. Contacte al administrador.",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, myUser.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "La contraseña es incorrecta.",
        });
      }

      const token = jwt.sign(
        {
          id: myUser.id,
          rol_id: myUser.rol_id,
          first_name: myUser.first_name,
          apellido: myUser.apellido,
        },
        keys.secretOrKey, // Clave secreta
        { expiresIn: "24h" } // Opcional: Duración del token
      );

      const data = {
        id: myUser.id,
        first_name: myUser.first_name,
        second_name: myUser.second_name,
        apellido: myUser.apellido,
        celular: myUser.celular,
        correo: myUser.correo,
        foto: myUser.image,
        session_token: token,
        roles: myUser.roles,
        rol_id: myUser.rol_id,
        director_salon: myUser.director_salon,
        salon_id: myUser.salon_id,
      };
      console.log("Token generado en login:", token);

      res.status(201).json({
        success: true,
        message: "El usuario fue autenticado.",
        data: data,
      });
    } catch (err) {
      console.error("Error en el login:", err);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: err.message,
      });
    }
  
  },
  // Obtener usuario por ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      User.getUserById(id, (err, data) => {
        if (err) {
          return res.status(404).json({
            success: false,
            message: err.message || "Error al obtener usuario.",
          });
        }
        res.status(200).json({
          success: true,
          data,
        });
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: err.message || err,
      });
    }
  },
  // Controlador para obtener todas las asignaturas
  getAllAsignaturas(req, res) {
    User.getAllAsignaturas((err, data) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error al obtener las asignaturas.",
          error: err.message || err,
        });
      }
      res.status(200).json({
        success: true,
        message: "Asignaturas obtenidas correctamente.",
        asignaturas: data,
      });
    });
  },

  // Controlador para obtener todos los salones
  getAllSalones(req, res) {
    User.getAllSalones((err, data) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error al obtener los salones.",
          error: err.message || err,
        });
      }
      res.status(200).json({
        success: true,
        message: "Salones obtenidos correctamente.",
        salones: data,
      });
    });
  },

  // Controlador para obtener el salón por director
  async getSalonByDirector(req, res) {
    try {
      const userId = req.user.id; // ID del usuario logeado

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

      const teacherId = teacher[0].id;
      await User.getSalonByDirector(teacherId, (err, data) => {
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
      console.error("Error al obtener el salón por director:", error.message);
      return res.status(500).json({
        success: false,
        message: "Error interno al obtener el salón por director.",
      });
    }
  },

  // CREAR USUARIOS
  async createUser(req, res) {
    const userData = req.body;
  
    // Validar datos requeridos
    if (!userData.correo || !userData.first_name || !userData.apellido || !userData.celular || !userData.fecha_nacimiento) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos.",
      });
    }
  
    try {
      // Crear el usuario en la base de datos
      User.createUser(userData, async (err, data) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Error al crear el usuario.",
            error: err.message || err,
          });
        }
  
        // Subir imagen a Cloudinary si se proporciona
        if (req.file) {
          try {
            const customFileName = `${userData.first_name}_${userData.second_name}_${userData.apellido}`;
            const streamUpload = (buffer) => {
              return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                  {
                    folder: "users",
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
  
            // Actualizar imagen en la base de datos
            await User.updateUserImage(data.userId, imageUrl);
          } catch (error) {
            console.error("Error al subir imagen a Cloudinary:", error);
          }
        }
  
        // Enviar correo de bienvenida con credenciales
        const templatePath = path.join(__dirname, "../templates/emailTemplate.html");
        const replacements = {
          nombreCompleto: `${userData.first_name} ${userData.second_name || ""} ${userData.apellido}`,
          correo: userData.correo,
          password: `${userData.first_name}${new Date().getFullYear()}`,
        };
  
        try {
          const emailSent = await sendEmail(userData.correo, "Bienvenido a la Plataforma", templatePath, replacements);
          if (!emailSent) {
            console.error("Error al enviar correo al usuario.");
          } else {
            console.log("Correo enviado correctamente a:", userData.correo);
          }
        } catch (error) {
          console.error("Error al enviar correo:", error);
        }
  
        // Responder al cliente con éxito
        return res.status(201).json({
          success: true,
          message: "Usuario creado correctamente.",
          data,
        });
      });
    } catch (error) {
      console.error("Error interno al crear usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },

  async createUserTeacher(req, res) {
    const teacher = req.body;

    // Convertir director_salon vacío en null
    teacher.director_salon = teacher.director_salon === "" || teacher.director_salon === "null" ? null : teacher.director_salon;

    // Verificar que el usuario que realiza la acción es el rector
    if (req.user.rol_id !== 1) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede realizar esta acción.",
      });
    }

    // Validar y convertir asignaciones a array
    try {
      teacher.asignaciones = JSON.parse(teacher.asignaciones || "[]");
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "El formato de 'asignaciones' es inválido. Debe ser un array.",
      });
    }

    // Validar campos requeridos
    if (
      !teacher.correo ||
      !teacher.first_name ||
      !teacher.apellido ||
      !teacher.celular ||
      !teacher.fecha_nacimiento
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Todos los campos son requeridos",
      });
    }

    // Asignar el rol predeterminado para profesores
    teacher.rol_id = 2;

    try {
      // Crear el profesor en la base de datos
      User.createUserTeacher(teacher, async (err, data) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Error al crear el profesor.",
            error: err.message || err,
          });
        }

        // Verificar si el director_salon es null y devolver "No Asignado" en la respuesta
        if (teacher.director_salon === null) {
          data.director_salon = "No Asignado";
        }

        // Si se proporcionó un archivo, subirlo a Cloudinary
        if (req.file) {
          try {
            const customFileName = generateCloudinaryFileName(
              teacher.first_name,
              teacher.apellido
            );
            const streamUpload = (buffer) => {
              return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                  {
                    folder: "teachers",
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

            // Actualizar la URL de la imagen en la base de datos
            await User.updateUserImage(data.userId, imageUrl);
          } catch (error) {
            console.error("Error al subir la imagen a Cloudinary:", error);
          }
        }

        // Responder al cliente con éxito
        res.status(201).json({
          success: true,
          message: "Profesor creado correctamente.",
          data,
        });

        // Enviar correo solo después de confirmar la creación exitosa
        const templatePath = path.join(
          __dirname,
          "../templates/emailTemplate.html"
        );
        const replacements = {
          nombreCompleto: `${teacher.first_name} ${teacher.second_name} ${teacher.apellido}`,
          correo: teacher.correo,
          password: `${teacher.first_name}${new Date().getFullYear()}`,
        };

        try {
          const emailSent = await sendEmail(
            teacher.correo,
            "Bienvenido a nuestra plataforma",
            templatePath,
            replacements
          );
          if (!emailSent) {
            console.error("Error al enviar correo al usuario.");
          } else {
            console.log("Correo enviado correctamente a:", teacher.correo);
          }
        } catch (error) {
          console.error("Error al enviar correo:", error);
        }
      });
    } catch (error) {
      console.error("Error interno al crear profesor:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },

  async createUserStudent(req, res) {
    const student = req.body;

    student.salon_id = student.salon_id === "" || student.salon_id === "null" ? null : student.salon_id;

    // Verificar que el usuario que realiza la acción es el rector
    if (req.user.rol_id !== 1) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede realizar esta acción.",
      });
    }

    // Validar los datos requeridos
    if (
      !student.correo ||
      !student.first_name ||
      !student.apellido ||
      !student.celular ||
      !student.fecha_nacimiento
    ) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos.",
      });
    }

    // Asignar el rol predeterminado para estudiantes
    student.rol_id = 3;

    try {
      // Crear el estudiante en la base de datos
      User.createUserStudent(student, async (err, data) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Error al crear el estudiante.",
            error: err.message || err,
          });
        }

        // Verificar si el salón es null y devolver "No Asignado" en la respuesta
        if (student.salon_id === null) {
          data.salon_id = "No Asignado";
        }

        // Si el usuario se creó correctamente, subir la imagen a Cloudinary si existe
        if (req.file) {
          try {
            const customFileName = generateCloudinaryFileName(
              student.first_name,
              student.apellido
            );
            const streamUpload = (buffer) => {
              return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                  {
                    folder: "students",
                    public_id: customFileName,
                    overwrite: true,
                  },
                  (error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                  }
                );
                stream.end(buffer);
              });
            };

            const uploadResult = await streamUpload(req.file.buffer);
            const imageUrl = uploadResult.secure_url;
            // Actualizar la URL de la imagen en la base de datos
            await User.updateUserImage(data.userId, imageUrl);
          } catch (error) {
            console.error("Error al subir la imagen a Cloudinary:", error);
          }
        }
        // Responder con éxito
        res.status(201).json({
          success: true,
          message: "Estudiante creado correctamente.",
          data,
        });
        // Enviar correo solo después de confirmar la creación exitosa
        // Ruta a la plantilla HTML
        const templatePath = path.join(
          __dirname,
          "../templates/emailTemplate.html"
        );

        // Reemplazos para la plantilla
        const replacements = {
          nombreCompleto: `${student.first_name} ${student.second_name} ${student.apellido}`, // Nombre completo
          correo: student.correo,
          password: `${student.first_name}${new Date().getFullYear()}`, // Genera la contraseña
        };

        try {
          // Enviar el correo
          const emailSent = await sendEmail(
            student.correo,
            "Bienvenido a nuestra plataforma",
            templatePath,
            replacements
          );

          if (!emailSent) {
            console.error("Error al enviar correo al usuario.");
          } else {
            console.log("Correo enviado correctamente a:", student.correo);
          }
        } catch (error) {
          console.error("Error al enviar correo:", error);
        }
      });
    } catch (error) {
      console.error("Error interno al crear estudiante:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: error.message || error,
      });
    }
  },

  // ACTUALIZAR USUARIOS

  updateStudentSalon(req, res) {
    const { studentId, newSalonId } = req.body;

    // Validar que los datos estén presentes
    if (!studentId || !newSalonId) {
      return res.status(400).json({
        success: false,
        message: "El ID del estudiante y el ID del nuevo salón son requeridos.",
      });
    }

    User.updateStudentSalon(studentId, newSalonId, (err, data) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error al actualizar el salón del estudiante",
          error: err.message || err,
        });
      }

      return res.status(200).json({
        success: true,
        message: data.message,
      });
    });
  },

  // Actualizar un usuario por su ID
  async updateUser(req, res) {
    try {
      const { id } = req.params;

      // Verificar si el usuario tiene rol de rector (rol_id = 1)
      if (req.user.rol_id !== 1) {
        return res.status(403).json({
          success: false,
          message: "Solo el rector puede realizar esta acción.",
        });
      }

      // Procesar los datos de actualización
      const updatedData = req.body;

      // Convertir asignaciones a un array si es un string
      if (updatedData.asignaciones) {
        try {
          updatedData.asignaciones = JSON.parse(updatedData.asignaciones);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message:
              "El formato de 'asignaciones' es inválido. Debe ser un array de objetos JSON.",
          });
        }
      }

      // Manejo del archivo de imagen
      if (req.file) {
        updatedData.imageFile = req.file;
      }

      // Llamar al modelo para realizar la actualización
      User.updateUser(id, updatedData, req.user.id, (err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al actualizar el usuario.",
            error: err.message || err,
          });
        }

        res.status(200).json({
          success: true,
          message: "Usuario actualizado correctamente.",
          data,
        });
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error: err.message || err,
      });
    }
  },

  // OBTENER USUARIOS (PROFESORES Y ESTUDIANTES)

  async getAllTeachers(req, res) {
    try {
      User.getAllTeachers((err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al obtener la lista de profesores.",
            error: err,
          });
        }

        res.status(200).json({
          success: true,
          message: "Lista de profesores obtenida correctamente.",
          data,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error,
      });
    }
  },

  async getAllStudents(req, res) {
    try {
      User.getAllStudents((err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al obtener la lista de estudiantes.",
            error: err,
          });
        }

        res.status(200).json({
          success: true,
          message: "Lista de estudiantes obtenida correctamente.",
          data,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
        error,
      });
    }
  },

  // ELIMINAR USUARIOS

  async deleteUser(req, res) {
    const userId = req.params.id;

    // Verificar que el usuario que realiza la acción es el rector
    if (req.user.rol_id !== 1) {
      return res.status(403).json({
        success: false,
        message: "Solo el rector puede realizar esta acción.",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "El ID del usuario es requerido",
      });
    }

    User.deleteUser(userId, (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Error al eliminar el usuario",
          error: err.message || err,
        });
      }

      res.status(200).json({
        success: true,
        message: "Usuario eliminado correctamente",
      });
    });
  },
};

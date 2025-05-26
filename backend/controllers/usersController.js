const keys = require("../config/keys");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
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

      // if (myUser.estado !== "activo") {
      //   return res.status(403).json({
      //     success: false,
      //     message: "El usuario está desactivado. Contacte al administrador.",
      //   });
      // }

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

    // Obtener todos los usuarios
  async getAllUsers(req, res) {
    try {
      User.getAll((err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error al obtener usuarios",
            error: err.message || err,
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
        message: "Error interno del servidor",
        error: error.message || error,
      });
    }
  },

  // Obtener un usuario por ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      User.getById(id, (err, data) => {
        if (err || !data) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado",
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
        message: "Error interno del servidor",
        error: error.message || error,
      });
    }
  },

  // Crear usuario genérico
  async createUser(req, res) {
    const userData = req.body;

    if (!userData.correo || !userData.first_name || !userData.last_name || !userData.phone || !userData.age) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos",
      });
    }

    try {
      User.userCreate(userData, (err, data) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Error al crear el usuario",
            error: err.message || err,
          });
        }
        res.status(201).json({
          success: true,
          message: "Usuario creado exitosamente",
          data,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message || error,
      });
    }
  },

  // Actualizar usuario por ID
  async updateUser(req, res) {
    const { id } = req.params;
    const userData = req.body;

    try {
      User.update(id, userData, (err, data) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: "Error al actualizar el usuario",
            error: err.message || err,
          });
        }
        res.status(200).json({
          success: true,
          message: "Usuario actualizado correctamente",
          data,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message || error,
      });
    }
  },

  // Eliminar usuario por ID
  async deleteUser(req, res) {
    const { id } = req.params;

    try {
      User.delete(id, (err) => {
        if (err) {
          return res.status(400).json({
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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message || error,
      });
    }
  },

  // CREAR USUARIOS
  // async createUser(req, res) {
  //   const userData = req.body;
  
  //   // Validar datos requeridos
  //   if (!userData.correo || !userData.first_name || !userData.apellido || !userData.celular || !userData.fecha_nacimiento) {
  //     return res.status(400).json({
  //       success: false,
  //       message: "Todos los campos son requeridos.",
  //     });
  //   }
  
  //   try {
  //     // Crear el usuario en la base de datos
  //     User.createUser(userData, async (err, data) => {
  //       if (err) {
  //         return res.status(400).json({
  //           success: false,
  //           message: "Error al crear el usuario.",
  //           error: err.message || err,
  //         });
  //       }
  
  //       // Subir imagen a Cloudinary si se proporciona
  //       if (req.file) {
  //         try {
  //           const customFileName = `${userData.first_name}_${userData.second_name}_${userData.apellido}`;
  //           const streamUpload = (buffer) => {
  //             return new Promise((resolve, reject) => {
  //               const stream = cloudinary.uploader.upload_stream(
  //                 {
  //                   folder: "users",
  //                   public_id: customFileName,
  //                   overwrite: true,
  //                 },
  //                 (error, result) => {
  //                   if (error) reject(error);
  //                   else resolve(result);
  //                 }
  //               );
  //               stream.end(buffer);
  //             });
  //           };
  
  //           const uploadResult = await streamUpload(req.file.buffer);
  //           const imageUrl = uploadResult.secure_url;
  
  //           // Actualizar imagen en la base de datos
  //           await User.updateUserImage(data.userId, imageUrl);
  //         } catch (error) {
  //           console.error("Error al subir imagen a Cloudinary:", error);
  //         }
  //       }
  
  //       // Enviar correo de bienvenida con credenciales
  //       const templatePath = path.join(__dirname, "../templates/emailTemplate.html");
  //       const replacements = {
  //         nombreCompleto: `${userData.first_name} ${userData.second_name || ""} ${userData.apellido}`,
  //         correo: userData.correo,
  //         password: `${userData.first_name}${new Date().getFullYear()}`,
  //       };
  
  //       try {
  //         const emailSent = await sendEmail(userData.correo, "Bienvenido a la Plataforma", templatePath, replacements);
  //         if (!emailSent) {
  //           console.error("Error al enviar correo al usuario.");
  //         } else {
  //           console.log("Correo enviado correctamente a:", userData.correo);
  //         }
  //       } catch (error) {
  //         console.error("Error al enviar correo:", error);
  //       }
  
  //       // Responder al cliente con éxito
  //       return res.status(201).json({
  //         success: true,
  //         message: "Usuario creado correctamente.",
  //         data,
  //       });
  //     });
  //   } catch (error) {
  //     console.error("Error interno al crear usuario:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Error interno del servidor.",
  //       error: error.message || error,
  //     });
  //   }
  // },


  // ACTUALIZAR USUARIOS


  // Actualizar un usuario por su ID
  // async updateUser(req, res) {
  //   try {
  //     const { id } = req.params;

  //     // Procesar los datos de actualización
  //     const updatedData = req.body;

  //     // Convertir asignaciones a un array si es un string
  //     if (updatedData.asignaciones) {
  //       try {
  //         updatedData.asignaciones = JSON.parse(updatedData.asignaciones);
  //       } catch (error) {
  //         return res.status(400).json({
  //           success: false,
  //           message:
  //             "El formato de 'asignaciones' es inválido. Debe ser un array de objetos JSON.",
  //         });
  //       }
  //     }

  //     // Manejo del archivo de imagen
  //     if (req.file) {
  //       updatedData.imageFile = req.file;
  //     }

  //     // Llamar al modelo para realizar la actualización
  //     User.updateUser(id, updatedData, req.user.id, (err, data) => {
  //       if (err) {
  //         return res.status(500).json({
  //           success: false,
  //           message: "Error al actualizar el usuario.",
  //           error: err.message || err,
  //         });
  //       }

  //       res.status(200).json({
  //         success: true,
  //         message: "Usuario actualizado correctamente.",
  //         data,
  //       });
  //     });
  //   } catch (err) {
  //     res.status(500).json({
  //       success: false,
  //       message: "Error interno del servidor.",
  //       error: err.message || err,
  //     });
  //   }
  // },
};

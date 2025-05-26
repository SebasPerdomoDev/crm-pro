const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const User = require('../models/user');  // Importar el modelo de usuario

module.exports = {
  validateToken: (req, res) => {
    const token = req.headers['authorization'];  // El token se pasa en el header como "Authorization"
    
    if (!token) {
      return res.status(403).json({  // 403 Forbidden
        success: false,
        message: 'No token provided'
      });
    }

    // Eliminar el prefijo "JWT" del token
    const tokenWithoutPrefix = token.replace('JWT ', '');

    // Verificar el token
    jwt.verify(tokenWithoutPrefix, keys.secretOrKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({  // 401 Unauthorized
          success: false,
          message: 'Failed to authenticate token'
        });
      }

      // Obtener el usuario desde la base de datos usando el método findById
      User.getUserById(decoded.id, (err, user) => {
        if (err || !user) {
          return res.status(404).json({  // 404 Not Found
            success: false,
            message: 'User not found'
          });
        }

        // Si el usuario existe, devolver los datos
        return res.status(200).json({
          success: true,
          message: 'Token is valid',
          user: {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            correo: user.correo,
            rol_id: user.rol_id,
            image: user.image,
            director_salon: user.director_salon,  // Solo para profesores
            salon_id: user.salon_id,  // Solo para estudiantes
          }
        });
      });
    });
  }
};

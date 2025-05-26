const jwt = require("jsonwebtoken");
const keys = require("../config/keys"); // Ruta a tus claves

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    // LOGS PARA DEPURACIÓN
    // console.log('Authorization Header:', req.headers['authorization']);
    // console.log('Token extraído:', token);

    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'Token no proporcionado.',
        });
    }
    
    // Si el token empieza con "Bearer ", lo eliminamos
    if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length).trim();
    }

    jwt.verify(token, keys.secretOrKey, (err, user) => {
        if (err) {
            console.error('Error al verificar el token:', err);
            return res.status(403).json({
                success: false,
                message: 'Token inválido o expirado.',
            });
        }

        // console.log('Token verificado correctamente. Payload:', user); // LOG PARA DEPURACIÓN
        req.user = user; // Asigna el payload del token al request
        next();
    });
};

const verifyRole = (requiredRole) => (req, res, next) => {
    if (req.user.rol_id !== requiredRole) {
        return res.status(403).json({
            success: false,
            message: "No tienes permiso para realizar esta acción.",
        });
    }
    next();
};

module.exports = {verifyRole, verifyToken};

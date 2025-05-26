const User = require("../models/user");
const bcrypt = require("bcryptjs");
const {
  generateAndStoreOTP,
  verifyOTP,
  sendOtpEmail,
} = require("../services/otpService");

module.exports = {
  // Enviar OTP
  async forgotPassword(req, res) {
    const { correo } = req.body;
    try {
      // Verificar si el correo está registrado
      const user = await User.findByEmail(correo);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Correo no registrado." });
      }

      // Generar OTP y enviar correo
      const otp = generateAndStoreOTP(correo);
      res
        .status(200)
        .json({ success: true, message: "OTP enviado al correo electrónico." });
      await sendOtpEmail(correo, otp);
    } catch (error) {
      console.error("Error en forgotPassword:", error);
      res
        .status(500)
        .json({ success: false, message: "Error al enviar el OTP." });
    }
  },

  // Verificar OTP
  async verificarOtp(req, res) {
    const { correo, otp } = req.body;
    try {
      verifyOTP(correo, otp);
      res
        .status(200)
        .json({ success: true, message: "OTP verificado correctamente." });
    } catch (error) {
      console.error("Error en verifyOtp:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Verificar OTP y restablecer contraseña
  async resetPassword(req, res) {
    const { correo, newPassword } = req.body;
    try {
      // Encriptar la nueva contraseña y actualizarla
      if (!newPassword || !correo) {
        throw new Error("Los argumentos son inválidos.");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.updatePassword(correo, hashedPassword);

      res.status(200).json({
        success: true,
        message: "Contraseña restablecida correctamente.",
      });
    } catch (error) {
      console.error("Error en resetPassword:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  },
};

const crypto = require("crypto");
const sendEmail = require("./emailService");

// Almacenamiento temporal de OTPs
const otpStore = {};

// Generar OTP y almacenarlo
function generateAndStoreOTP(correo) {
  const otp = Math.floor(100000 + Math.random() * 900000); // OTP de 6 dígitos
  const expirationTime = Date.now() + 2 * 60 * 1000; // 2 minutos de validez

  otpStore[correo] = { otp, expirationTime }; // Almacena el OTP en memoria
  console.log("OTP generado para", correo, otp);
  return otp;
}

// Verificar si la OTP es válida
const verifyOTP = (correo, otp) => {
  if (!otpStore[correo]) {
    throw new Error("No se ha generado un código OTP para este correo.");
  }

  const { otp: storedOtp, expirationTime } = otpStore[correo];

  if (Date.now() > expirationTime) {
    delete otpStore[correo]; // Limpia OTP si expiró
    throw new Error("El código OTP ha expirado.");
  }

  // Comparar ambos OTPs como strings para evitar problemas de tipo
  if (String(otp) !== String(storedOtp)) {
    throw new Error("El código OTP es incorrecto.");
  }

  // OTP válido, eliminarlo después de usarlo
  delete otpStore[correo];
};

// Enviar la OTP utilizando el `emailService`
const sendOtpEmail = async (correo, otp) => {
  const templatePath = "templates/otpTemplate.html"; // Ruta a la plantilla del correo
  const replacements = {
    otp,
  };

  const subject = "Código de recuperación de contraseña";
  const success = await sendEmail(correo, subject, templatePath, replacements);

  if (!success) {
    throw new Error("No se pudo enviar el correo de recuperación.");
  }
};

module.exports = { generateAndStoreOTP, verifyOTP, sendOtpEmail };

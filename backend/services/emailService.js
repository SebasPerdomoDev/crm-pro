const fs = require("fs");
const nodemailer = require("nodemailer");

// Configurar el transportador de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 465,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER || "pedrito01198765@gmail.com",
    pass: process.env.EMAIL_PASS || "xzurbdigkyodieqs",
  },
  tls: {
    rejectUnauthorized: false, // Soluciona el error del certificado
  },
});

// Función para leer y personalizar la plantilla HTML
const renderTemplate = (templatePath, replacements) => {
  let template = fs.readFileSync(templatePath, "utf8");
  for (const key in replacements) {
    template = template.replace(
      new RegExp(`{{${key}}}`, "g"),
      replacements[key]
    );
  }
  return template;
};

// Función para enviar correos
const sendEmail = async (to, subject, templatePath, replacements) => {
  try {
    const html = renderTemplate(templatePath, replacements);
    const info = await transporter.sendMail({
      from: 'Colegio Travesuras Con Amor" <tu-correo@gmail.com>', // Cambia el remitente si es necesario
      to,
      subject,
      html,
    });
    console.log("Correo enviado: %s", info.messageId); // Confirmación en consola
    return true;
  } catch (error) {
    console.error("Error al enviar correo:", error); // Muestra el error en consola
    return false;
  }
};

module.exports = sendEmail;

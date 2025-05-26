require("dotenv").config(); // Cargar .env

// Deshabilitar console.log en producción
if (process.env.NODE_ENV === "production") {
  console.log = function () {}; // Elimina logs en producción
  console.error = function () {}; // Opcional, elimina errores en producción
}

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const logger = require("morgan");
const passport = require("passport");
const app = express();
const http = require("http");
const server = http.createServer(app);
const multer = require("multer");

/*
RUTAS 
*/
const rolesRoutes = require("./routes/rolsRoutes");
const usersRoutes = require("./routes/userRoutes");
const agendasRoutes = require("./routes/agendasRoutes");

const port = process.env.PORT || 8080;

// Middleware
app.use(logger("dev")); // PARA QUE MUESTRE LOS MENSAJES DE LAS PETICIONES QUE SE
app.use(bodyParser.json({ extended: true })); // PARA QUE PUEDA INTERPRETAR LOS DATOS QUE VIENEN DE UN FORMULARIO
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" })); // PARA QUE PUEDA INTERPRETAR LOS DATOS QUE VIENEN DE UN FORMULARIO
app.use(express.urlencoded({ extended: true })); // PARA QUE PUEDA INTERPRETAR LOS DATOS QUE VIENEN DE UN FORMULARIO


// Configuración de CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",  // Permite peticiones desde el dominio del frontend en producción
    "http://192.168.20.7:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Permite enviar cookies o credenciales
};
app.use(cors(corsOptions));
// app.use(cors()); // PARA QUE PUEDA REALIZAR PETICIONES DESDE OTROS DOMINIOS

// Manejar solicitudes preflight
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// Configuración de Passport
app.use(passport.initialize());
app.use(passport.session());

require("./config/passport")(passport);

app.disable("x-powered-by"); // PARA QUE NO MUESTRE QUE TECNOLOGIA ESTA USANDO

app.set("port", port);


// Almacena temporalmente en la memoria
const storage = multer.memoryStorage(); // Puedes cambiarlo a diskStorage si prefieres
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limita archivos a 5MB
});



/*
LLAMADO RUTAS 
*/
rolesRoutes(app);
usersRoutes(app, upload);
agendasRoutes(app, upload);

//Configurar la IP en CMD ipconfig para correr el server en la red local
server.listen(port, "192.168.20.24" || "localhost", function () {
  console.log("Aplicacion de NodeJS " + port + " Iniciada...");
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).send(err.stack);
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

module.exports = {
  app: app,
  server: server,
};

// 200 - ES UN RESPUESTA EXITOSA
// 404 - SIGNIFICA QUE LA URL NO EXISTE
// 500 - ERROR INTERNO DEL SERVIDOR

# Travesuras Backend

Este es el repositorio del backend para la plataforma **Travesuras**, desarrollada con Node.js y Express. Este backend gestiona funcionalidades relacionadas con la aplicación, como la autenticación, la gestión de usuarios, y la integración con servicios externos como MercadoPago y Google Cloud Storage.

## Características

- API RESTful para la gestión de usuarios y autenticación.
- Autenticación JWT con **Passport**.
- Websockets con **Socket.IO** para comunicación en tiempo real.

## Requisitos

Antes de ejecutar el backend, asegúrate de tener las siguientes herramientas instaladas:

- [Node.js](https://nodejs.org/) (v14.x o superior recomendado)
- [MySQL](https://www.mysql.com/) (para la base de datos)

## Instalación

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/tuusuario/travesuras-backend.git
   cd travesuras-backend

2. Instala las dependencias:

En la carpeta del proyecto, ejecuta:

   npm install
Esto ejecutará la aplicación en el puerto especificado, o el puerto por defecto (3000). El backend estará disponible en http://localhost:3000 o en la IP configurada.

## Configuración
 Asegúrate de configurar correctamente las variables de entorno necesarias para el proyecto:

 -Puerto: Puedes cambiar el puerto predeterminado en server.js o usar una variable de entorno PORT.

## Dependencias
Este proyecto utiliza las siguientes dependencias:

-express: Framework web para Node.js.
-jsonwebtoken: Manejo de tokens JWT para la autenticación.
-bcryptjs: Cifrado de contraseñas.
-socket.io: Comunicación en tiempo real a través de WebSockets.
-mysql: Conexión con la base de datos MySQL.
-passport y passport-jwt: Estrategias de autenticación JWT.
-multer: Middleware para la carga de archivos.
-cors: Habilita la comunicación entre diferentes dominios.

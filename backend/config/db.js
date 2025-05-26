const mysql = require("mysql2/promise"); // Importa la versión "promise" para transacciones

// Configuración del pool de conexiones
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "crm_incihuila",
  waitForConnections: true,
  connectionLimit: 10, // Límite de conexiones en el pool
  queueLimit: 0, // Sin límite de cola
});

// Verificar la conexión
(async () => {
  try {
    const connection = await db.getConnection();
    await connection.ping(); // Verifica que la conexión es válida
    console.log("Conexión exitosa a la base de datos");
    connection.release(); // Libera la conexión al pool
  } catch (err) {
    console.error("Error al conectar a la base de datos:", err);
  }
})();
// Exporta el pool para usarlo en todo el proyecto
module.exports = db;

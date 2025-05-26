const db = require("../config/db");

const Boletin = {};


Boletin.getBoletinesVisibles = async () => {
  const [result] = await db.query(
    `SELECT valor FROM configuraciones WHERE clave = 'boletines_visibles'`
  );
  return result[0]?.valor === "true";
};

Boletin.setBoletinesVisibles = async (valor) => {
  await db.query(
    `UPDATE configuraciones SET valor = ? WHERE clave = 'boletines_visibles'`,
    [valor.toString()]
  );
};

Boletin.getAllBoletin = async () => {
  const [result] = await db.execute(`
        SELECT 
        b.id,
        b.students_id,
        b.periodo_id,
        b.observacion,
        b.cumplimiento_tareas,
        b.comportamiento_valores,
        b.inasistencias,
        CONCAT_WS(' ', u.first_name, u.second_name, u.apellido) AS nombre_estudiante,
        b.promedio_final_periodo,
        b.comportamiento_numerico,
        b.pdf_url,
        p.nombre AS periodo_nombre,
        s.grado
      FROM boletines b
      INNER JOIN users u ON u.id = b.students_id
      INNER JOIN students st ON st.users_id = u.id
      INNER JOIN salones s ON s.id = st.salon_id
      INNER JOIN periodos p ON p.id = b.periodo_id
      ORDER BY b.created_at DESC
      `);
  return result;
};

Boletin.getBoletinesByDirector = async (directorId, result) => {
  try {
    const sqlQuery = `
      SELECT 
        b.id,
        b.students_id,
        b.periodo_id,
        b.observacion,
        b.cumplimiento_tareas,
        b.comportamiento_valores,
        b.inasistencias,
        b.promedio_final_periodo,
        b.comportamiento_numerico,
        b.puesto_grupo,
        b.pdf_url,
        CONCAT_WS(' ', u.first_name, u.second_name, u.apellido) AS nombre_estudiante,
        p.nombre AS periodo_nombre,
        s.grado
      FROM salones s
      INNER JOIN students st ON s.id = st.salon_id
      INNER JOIN users u ON st.users_id = u.id
      INNER JOIN boletines b ON b.students_id = u.id
      INNER JOIN periodos p ON p.id = b.periodo_id
      WHERE s.director_id = ?
      ORDER BY p.id, u.first_name, u.apellido;
    `;

    const [rows] = await db.query(sqlQuery, [directorId]);

    if (rows.length === 0) {
      return result({ message: 'No se encontraron boletines para este director.' }, null);
    }

    result(null, rows);
  } catch (error) {
    console.error('Error al obtener boletines por director:', error.message);
    result(error, null);
  }
};

// Boletin.getPromedioYPuesto = async (userId, periodoId) => {
//   const [[studentRow]] = await db.query(
//     `SELECT id, salon_id FROM students WHERE users_id = ?`,
//     [userId]
//   );

//   if (!studentRow) return { promedio: 0, puesto: 0, total: 0 };

//   const studentId = studentRow.id;
//   const salonId = studentRow.salon_id;

//   const [rows] = await db.query(`
//     SELECT 
//       s.id AS student_id,
//       cp.calificacion,
//       b.comportamiento_numerico
//     FROM students s
//     LEFT JOIN calificaciones_generales cg ON cg.students_id = s.users_id
//     LEFT JOIN calificaciones_periodos cp ON cp.calificacion_general_id = cg.id AND cp.periodo_id = ?
//     LEFT JOIN boletines b ON b.students_id = s.users_id AND b.periodo_id = ?
//     WHERE s.salon_id = ?
//   `, [periodoId, periodoId, salonId]);

//   // Agrupar por estudiante
//   const agrupado = {};
//   for (const row of rows) {
//     if (!agrupado[row.student_id]) {
//       agrupado[row.student_id] = {
//         notas: [],
//         comportamiento: row.comportamiento_numerico
//       };
//     }
//     if (row.calificacion !== null) {
//       agrupado[row.student_id].notas.push(row.calificacion);
//     }
//   }

//   const estudiantes = Object.entries(agrupado).map(([id, data]) => {
//     const notas = data.notas.map(Number);
//     if (data.comportamiento !== null) notas.push(Number(data.comportamiento));
//     const promedio = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
//     return {
//       student_id: Number(id),
//       promedio
//     };
//   }).sort((a, b) => b.promedio - a.promedio);

//   const actual = estudiantes.find((e) => e.student_id === studentId);

//   return {
//     promedio: actual?.promedio || 0,
//     puesto: actual ? estudiantes.indexOf(actual) + 1 : 0,
//     total: estudiantes.length
//   };
// };




Boletin.recalcularPromediosYpuestos = async (salonId, periodoId) => {
  const redondearPersonalizado = (num) => {
    const str = num.toString();
    const [entero, decimales = ""] = str.split(".");
    const dec1 = decimales[0] || "0";
    const dec2 = decimales[1] || "0";
    const dec3 = decimales[2] || "0";

    let resultado = Number(`${entero}.${dec1}${dec2}`);
    if (parseInt(dec3) >= 6) {
      resultado = Math.round((resultado + 0.01) * 100) / 100;
    }

    return parseFloat(resultado.toFixed(1));
  };

  const [students] = await db.query(`
    SELECT s.id AS student_id, s.users_id
    FROM students s
    WHERE s.salon_id = ?
  `, [salonId]);

  const resultados = [];

  for (const estudiante of students) {
    const { student_id, users_id } = estudiante;

    const [rows] = await db.query(`
      SELECT 
        cp.calificacion,
        b.comportamiento_numerico
      FROM calificaciones_generales cg
      LEFT JOIN calificaciones_periodos cp 
        ON cp.calificacion_general_id = cg.id AND cp.periodo_id = ?
      LEFT JOIN boletines b 
        ON b.students_id = cg.students_id AND b.periodo_id = ?
      WHERE cg.students_id = ?
    `, [periodoId, periodoId, users_id]);

    const notas = rows
      .filter(r => typeof r.calificacion === "number")
      .map(r => Number(r.calificacion));

    const comportamiento = rows[0]?.comportamiento_numerico;
    if (comportamiento !== null && comportamiento !== undefined) {
      notas.push(Number(comportamiento));
    }

    const promedioBruto = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    const promedio = redondearPersonalizado(promedioBruto);

    resultados.push({ student_id, users_id, promedio });
  }

  resultados.sort((a, b) => b.promedio - a.promedio);
  const total = resultados.length;

  for (let i = 0; i < resultados.length; i++) {
    const { users_id, promedio } = resultados[i];
    const puesto = i + 1;

    await db.query(`
      UPDATE boletines 
      SET promedio_final_periodo = ?, puesto_grupo = ?
      WHERE students_id = ? AND periodo_id = ?
    `, [promedio, puesto, users_id, periodoId]);
  }

  return total;
};



// Obtener los datos del boletín por estudiante y periodo
Boletin.getBoletinByStudent = async (studentId, periodoId) => {
  try {
    const query = `
            SELECT 
                u.first_name, u.second_name, u.apellido,
                s.id AS student_id, s.salon_id, sal.nombre AS salon_nombre, sal.grado,
                p.id AS periodo_id, p.nombre AS periodo_nombre,
                a.id AS asignatura_id, a.nombre AS asignatura_nombre, a.descripcion, a.IH,
                cp.calificacion, cp.simbolo_carita, 
                cg.promedio_final, cg.tipo_calificacion,
                i.descripcion AS competencia_lograda,
                CONCAT_WS(' ', du.first_name, du.second_name, du.apellido) AS director_nombre
            FROM students s
            INNER JOIN users u ON s.users_id = u.id
            INNER JOIN salones sal ON s.salon_id = sal.id
            INNER JOIN periodos p ON p.id = ?
            INNER JOIN calificaciones_generales cg ON cg.students_id = s.users_id
            INNER JOIN calificaciones_periodos cp ON cp.calificacion_general_id = cg.id
            INNER JOIN asignaturas a ON cg.asignatura_id = a.id
            LEFT JOIN indicadores i 
              ON i.asignatura_id = a.id 
              AND i.periodo_id = p.id 
              AND i.salon_id = sal.id
            LEFT JOIN teachers t ON sal.director_id = t.id
            LEFT JOIN users du ON t.users_id = du.id
            WHERE s.users_id = ? AND cp.periodo_id = ?
            ORDER BY a.nombre;
        `;

    const [rows] = await db.query(query, [periodoId, studentId, periodoId]);
    return rows;
  } catch (error) {
    console.error("Error al obtener el boletín:", error.message);
    throw error;
  }
};


Boletin.getDatosEstudiante = async (studentId, periodoId) => {
  const query = `
        SELECT 
            u.first_name, u.second_name, u.apellido,
            s.id AS student_id, s.salon_id, sal.nombre AS salon_nombre, sal.grado,
            p.id AS periodo_id, p.nombre AS periodo_nombre
        FROM students s
        INNER JOIN users u ON s.users_id = u.id
        INNER JOIN salones sal ON s.salon_id = sal.id
        INNER JOIN periodos p ON p.id = ?
        WHERE s.users_id = ?;
    `;
  const [result] = await db.query(query, [periodoId, studentId]);
  return result.length > 0 ? result[0] : null;
};

Boletin.getCalificaciones = async (studentId, periodoId) => {
  const query = `
        SELECT 
            a.nombre AS asignatura_nombre, cp.calificacion, cp.simbolo_carita,
            cg.tipo_calificacion, cg.promedio_final
        FROM calificaciones_generales cg
        INNER JOIN calificaciones_periodos cp ON cp.calificacion_general_id = cg.id
        INNER JOIN asignaturas a ON cg.asignatura_id = a.id
        WHERE cg.students_id = ? AND cp.periodo_id = ?;
    `;
  const [result] = await db.query(query, [studentId, periodoId]);
  return result;
};


Boletin.createBoletin = async (
  studentsId,
  periodoId,
  observacion,
  pdfUrl,
  cumplimientoTareas,
  comportamientoValores,
  inasistencias,
  comportamientoNumerico
) => {
  const query = `
    INSERT INTO boletines 
    (students_id, periodo_id, observacion, cumplimiento_tareas, comportamiento_valores, inasistencias, comportamiento_numerico, pdf_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    studentsId,
    periodoId,
    observacion,
    cumplimientoTareas || null,
    comportamientoValores || null,
    inasistencias,
    comportamientoNumerico || null,
    pdfUrl || null,
  ];

  const [result] = await db.query(query, values);
  return result;
};

Boletin.updateBoletin = async (
  studentsId,
  periodoId,
  observacion,
  pdfUrl,
  cumplimientoTareas,
  comportamientoValores,
  inasistencias,
  comportamientoNumerico
) => {
  const query = `
    UPDATE boletines SET 
      observacion = ?, 
      cumplimiento_tareas = ?, 
      comportamiento_valores = ?, 
      inasistencias = ?, 
      comportamiento_numerico = ?, 
      pdf_url = ?, 
      updated_at = NOW()
    WHERE students_id = ? AND periodo_id = ?
  `;

  const values = [
    observacion,
    cumplimientoTareas || null,
    comportamientoValores || null,
    inasistencias,
    comportamientoNumerico || null,
    pdfUrl || null,
    studentsId,
    periodoId,
  ];

  const [result] = await db.query(query, values);
  return result;
};


// **Obtener una observación por estudiante y período**
Boletin.getBoletin = async (studentsId, periodoId) => {
  const query = `
        SELECT observacion, cumplimiento_tareas, comportamiento_valores, comportamiento_numerico, puesto_grupo, promedio_final_periodo, inasistencias, pdf_url FROM boletines
        WHERE students_id = ? AND periodo_id = ?;
    `;
  const [result] = await db.query(query, [studentsId, periodoId]);
  return result.length > 0 ? result[0] : null;
};

Boletin.getBoletinCompleto = async (studentId, periodoId) => {
  try {
    const query = `
            SELECT 
                u.first_name, u.second_name, u.apellido,
                s.id AS student_id, s.salon_id, sal.nombre AS salon_nombre, sal.grado,
                p.id AS periodo_id, p.nombre AS periodo_nombre,
                a.id AS asignatura_id, a.nombre AS asignatura_nombre, a.descripcion, a.IH,
                cp.calificacion, cp.simbolo_carita, 
                cg.promedio_final, cg.tipo_calificacion,
                b.observacion, b.cumplimiento_tareas, b.comportamiento_valores, b.puesto_grupo, b.promedio_final_periodo, b.inasistencias AS inasistencias_boletin,
                CONCAT_WS(' ', du.first_name, du.second_name, du.apellido) AS director_nombre
            FROM students s
            INNER JOIN users u ON s.users_id = u.id
            INNER JOIN salones sal ON s.salon_id = sal.id
            INNER JOIN periodos p ON p.id = ?
            LEFT JOIN boletines b ON b.students_id = s.users_id AND b.periodo_id = p.id
            LEFT JOIN calificaciones_generales cg ON cg.students_id = s.users_id
            LEFT JOIN calificaciones_periodos cp ON cp.calificacion_general_id = cg.id
            LEFT JOIN asignaturas a ON cg.asignatura_id = a.id
            LEFT JOIN teachers t ON sal.director_id = t.id
            LEFT JOIN users du ON t.users_id = du.id
            WHERE s.users_id = ?
            ORDER BY a.nombre;
        `;

    const [rows] = await db.query(query, [periodoId, studentId]);
    return rows;
  } catch (error) {
    console.error("Error en SQL:", error.message);
    throw error;
  }
};


// **Guardar la URL del PDF generado**
Boletin.savePDF = async (studentsId, periodoId, pdfUrl) => {
  const query = `
        UPDATE boletines 
        SET pdf_url = ?, updated_at = NOW()
        WHERE students_id = ? AND periodo_id = ?;
    `;
  await db.query(query, [pdfUrl, studentsId, periodoId]);
};


Boletin.deleteBoletin = async (studentsId, periodoId) => {
  const query = `DELETE FROM boletines WHERE students_id = ? AND periodo_id = ?`;
  const [result] = await db.query(query, [studentsId, periodoId]);
  return result;
};

module.exports = Boletin;

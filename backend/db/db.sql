USE travesuras_amor;

-- Tabla: roles
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(90) NOT NULL UNIQUE,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla: users
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rol_id BIGINT NOT NULL,
    image VARCHAR(255) NULL,
    correo VARCHAR(90) NOT NULL UNIQUE,
    first_name VARCHAR(90) NOT NULL,
    second_name VARCHAR(90) NULL,
    apellido VARCHAR(50) NOT NULL,
    celular VARCHAR(90) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    password VARCHAR(90) NOT NULL,
    estado ENUM('activo', 'no activo') DEFAULT 'activo',
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Tabla: teachers
CREATE TABLE teachers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    users_id BIGINT NOT NULL,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (users_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Tabla: salones
CREATE TABLE salones (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    grado VARCHAR(50) NOT NULL,
    director_id BIGINT NULL,
    horario_image VARCHAR(255) NULL,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (director_id) REFERENCES teachers(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: asignaturas
CREATE TABLE asignaturas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(60) NOT NULL,
    descripcion TEXT,
    IH INT NULL,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- Tabla: profesores_has_asignaturas_has_salones
CREATE TABLE profesores_has_asignaturas_has_salones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    teachers_id BIGINT NULL,
    asignatura_id BIGINT NULL,
    salon_id BIGINT NULL,
    created_at TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teachers_id) REFERENCES teachers(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salones(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Tabla: students
CREATE TABLE students (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    users_id BIGINT NOT NULL,
    salon_id BIGINT NULL,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (users_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salones(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Tabla: periodos
CREATE TABLE periodos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT NULL,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla: calificaciones_generales
CREATE TABLE calificaciones_generales (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    students_id BIGINT NOT NULL,
    asignatura_id BIGINT NOT NULL,
    promedio_final FLOAT NULL,
    tipo_calificacion ENUM('numerica', 'carita') NOT NULL,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (students_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON DELETE CASCADE
);

-- Tabla: calificaciones_periodos
CREATE TABLE calificaciones_periodos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calificacion_general_id BIGINT NOT NULL,
    periodo_id BIGINT NOT NULL,
    calificacion FLOAT NULL,
    inasistencias INT NULL,
    simbolo_carita ENUM('feliz', 'contento', 'intermedio', 'triste') NULL,
    competencias TEXT NULL,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (calificacion_general_id) REFERENCES calificaciones_generales(id) ON DELETE CASCADE,
    FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE
);

-- Tabla: pagos
CREATE TABLE pagos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    students_id BIGINT NOT NULL,
    monto FLOAT NOT NULL,
    fecha DATE NOT NULL,
    razon_pago VARCHAR(90) NOT NULL,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (students_id) REFERENCES students(id)
);

-- Tabla: agendas
CREATE TABLE agendas (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    users_id BIGINT NOT NULL,
    asignatura_id BIGINT NULL,
    salon_id BIGINT NULL,
    titulo VARCHAR(180) NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    es_evento_general BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (users_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salones(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Tabla: fotos_eventos
CREATE TABLE fotos_eventos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    agenda_id BIGINT NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agenda_id) REFERENCES agendas(id) ON DELETE CASCADE
);

CREATE TABLE boletines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    students_id BIGINT NOT NULL,
    periodo_id BIGINT NOT NULL,
    observacion TEXT NOT NULL,
    cumplimiento_tareas ENUM('feliz', 'contento', 'intermedio', 'triste') NULL,
    comportamiento_valores ENUM('feliz', 'contento', 'intermedio', 'triste') NULL,
    inasistencias INT NULL DEFAULT 0,
    pdf_url VARCHAR(255) NULL, -- URL del boletín si se desea almacenar el PDF generado
    created_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (students_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE
);
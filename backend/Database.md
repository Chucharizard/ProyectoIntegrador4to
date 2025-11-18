-- Tabla Rol
CREATE TABLE rol (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL,
    descripcion_rol VARCHAR(200),
    es_activo_rol BOOLEAN DEFAULT true
);

-- Tabla Empleado
CREATE TABLE empleado (
    ci_empleado VARCHAR(20) PRIMARY KEY,
    nombres_completo_empleado VARCHAR(120) NOT NULL,
    apellidos_completo_empleado VARCHAR(120) NOT NULL,
    correo_electronico_empleado VARCHAR(120) NOT NULL,
    fecha_nacimiento_empleado DATE,
    telefono_empleado VARCHAR(20),
    es_activo_empleado BOOLEAN DEFAULT true
);

-- Tabla Usuario
CREATE TABLE usuario (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ci_empleado VARCHAR(20) REFERENCES Empleado(ci_empleado),
    id_rol INTEGER REFERENCES Rol(id_rol),
    nombre_usuario VARCHAR(60) NOT NULL UNIQUE,
    contrasenia_usuario VARCHAR(256) NOT NULL,
    fecha_creacion_usuario TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    es_activo_usuario BOOLEAN DEFAULT true
);

-- Tabla Cliente
CREATE TABLE cliente (
    ci_cliente VARCHAR(20) PRIMARY KEY,
    nombres_completo_cliente VARCHAR(120) NOT NULL,
    apellidos_completo_cliente VARCHAR(120) NOT NULL,
    telefono_cliente VARCHAR(20),
    correo_electronico_cliente VARCHAR(120),
    preferencia_zona_cliente VARCHAR(200),
    presupuesto_max_cliente DECIMAL(12,2),
    origen_cliente VARCHAR(60),
    fecha_registro_cliente TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_usuario_registrador UUID REFERENCES Usuario(id_usuario)
);

-- Tabla Propietario
CREATE TABLE propietario (
    ci_propietario VARCHAR(20) PRIMARY KEY,
    nombres_completo_propietario VARCHAR(120) NOT NULL,
    apellidos_completo_propietario VARCHAR(120) NOT NULL,
    fecha_nacimiento_propietario DATE,
    telefono_propietario VARCHAR(20),
    correo_electronico_propietario VARCHAR(120),
    es_activo_propietario BOOLEAN DEFAULT true
);

-- Tabla Direccion
CREATE TABLE direccion (
    id_direccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calle_direccion VARCHAR(150) NOT NULL,
    ciudad_direccion VARCHAR(80) NOT NULL,
    zona_direccion VARCHAR(80),
    latitud_direccion DECIMAL(10,6),
    longitud_direccion DECIMAL(10,6)
);

-- Tabla Propiedad
CREATE TABLE propiedad (
    id_propiedad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_direccion UUID REFERENCES Direccion(id_direccion),
    ci_propietario VARCHAR(20) REFERENCES Propietario(ci_propietario),
    codigo_publico_propiedad VARCHAR(30) UNIQUE,
    titulo_propiedad VARCHAR(160) NOT NULL,
    descripcion_propiedad VARCHAR(1000),
    precio_publicado_propiedad DECIMAL(12,2),
    superficie_propiedad DECIMAL(12,2),
    tipo_operacion_propiedad VARCHAR(20),
    estado_propiedad VARCHAR(20),
    id_usuario_captador UUID REFERENCES Usuario(id_usuario),
    id_usuario_colocador UUID REFERENCES Usuario(id_usuario),
    fecha_captacion_propiedad DATE,
    fecha_publicacion_propiedad DATE,
    fecha_cierre_propiedad DATE,
    porcentaje_captacion_propiedad DECIMAL(5,2),
    porcentaje_colocacion_propiedad DECIMAL(5,2)
);

-- Tabla ImagenPropiedad
CREATE TABLE imagenpropiedad (
    id_imagen UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_propiedad UUID REFERENCES Propiedad(id_propiedad) ON DELETE CASCADE,
    url_imagen VARCHAR(400) NOT NULL,
    descripcion_imagen VARCHAR(200),
    es_portada_imagen BOOLEAN DEFAULT false,
    orden_imagen INTEGER DEFAULT 0
);

-- Tabla DocumentoPropiedad
CREATE TABLE documentopropiedad (
    id_documento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_propiedad UUID REFERENCES Propiedad(id_propiedad) ON DELETE CASCADE,
    tipo_documento VARCHAR(40),
    ruta_archivo_documento VARCHAR(400) NOT NULL,
    fecha_subida_documento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observaciones_documento VARCHAR(400)
);

-- Tabla CitaVisita
CREATE TABLE citavisita (
    id_cita UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_propiedad UUID REFERENCES Propiedad(id_propiedad),
    ci_cliente VARCHAR(20) REFERENCES Cliente(ci_cliente),
    id_usuario_asesor UUID REFERENCES Usuario(id_usuario),
    fecha_visita_cita TIMESTAMP WITH TIME ZONE NOT NULL,
    lugar_encuentro_cita VARCHAR(200),
    estado_cita VARCHAR(20),
    nota_cita VARCHAR(400),
    recordatorio_minutos_cita INTEGER DEFAULT 30
);

-- Tabla ContratoOperacion
CREATE TABLE contratooperacion (
    id_contrato_operacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_propiedad UUID REFERENCES Propiedad(id_propiedad),
    ci_cliente VARCHAR(20) REFERENCES Cliente(ci_cliente),
    id_usuario_colocador UUID REFERENCES Usuario(id_usuario),
    tipo_operacion_contrato VARCHAR(20),
    fecha_inicio_contrato DATE,
    fecha_fin_contrato DATE,
    estado_contrato VARCHAR(20),
    modalidad_pago_contrato VARCHAR(30),
    precio_cierre_contrato DECIMAL(12,2),
    fecha_cierre_contrato DATE,
    observaciones_contrato VARCHAR(400)
);

-- Tabla Pago
CREATE TABLE pago (
    id_pago UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_contrato_operacion UUID REFERENCES ContratoOperacion(id_contrato_operacion) ON DELETE CASCADE,
    monto_pago DECIMAL(12,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    numero_cuota_pago INTEGER,
    estado_pago VARCHAR(20)
);

-- Tabla DesempenoAsesor
CREATE TABLE desempenoasesor (
    id_desempeno UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario_asesor UUID REFERENCES Usuario(id_usuario),
    periodo_desempeno VARCHAR(20),
    captaciones_desempeno INTEGER DEFAULT 0,
    publicaciones_desempeno INTEGER DEFAULT 0,
    visitas_agendadas_desempeno INTEGER DEFAULT 0,
    operaciones_cerradas_desempeno INTEGER DEFAULT 0,
    tiempo_promedio_cierre_dias_desempeno INTEGER DEFAULT 0
);

-- Tabla GananciaEmpleado
CREATE TABLE gananciaempleado (
    id_ganancia UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_propiedad UUID REFERENCES Propiedad(id_propiedad),
    id_usuario_empleado UUID REFERENCES Usuario(id_usuario),
    tipo_operacion_ganancia VARCHAR(20),
    porcentaje_ganado_ganancia DECIMAL(5,2),
    dinero_ganado_ganancia DECIMAL(12,2),
    esta_concretado_ganancia BOOLEAN DEFAULT false,
    fecha_cierre_ganancia DATE
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuario_ci_empleado ON usuario(ci_empleado);
CREATE INDEX idx_usuario_id_rol ON usuario(id_rol);
CREATE INDEX idx_cliente_id_usuario_registrador ON Cliente(id_usuario_registrador);
CREATE INDEX idx_propiedad_id_direccion ON propiedad(id_direccion);
CREATE INDEX idx_propiedad_ci_propietario ON propiedad(ci_propietario);
CREATE INDEX idx_propiedad_id_usuario_captador ON propiedad(id_usuario_captador);
CREATE INDEX idx_propiedad_id_usuario_colocador ON propiedad(id_usuario_colocador);
CREATE INDEX idx_imagen_propiedad_id_propiedad ON imagenpropiedad(id_propiedad);
CREATE INDEX idx_documento_propiedad_id_propiedad ON documentopropiedad(id_propiedad);
CREATE INDEX idx_cita_visita_id_propiedad ON citavisita(id_propiedad);
CREATE INDEX idx_cita_visita_ci_cliente ON citavisita(ci_cliente);
CREATE INDEX idx_cita_visita_id_usuario_asesor ON citavisita(id_usuario_asesor);
CREATE INDEX idx_contrato_operacion_id_propiedad ON contratooperacion(id_propiedad);
CREATE INDEX idx_contrato_operacion_ci_cliente ON contratooperacion(ci_cliente);
CREATE INDEX idx_pago_id_contrato_operacion ON pago(id_contrato_operacion);
CREATE INDEX idx_desempeno_asesor_id_usuario_asesor ON desempenoasesor(id_usuario_asesor);
CREATE INDEX idx_ganancia_empleado_id_propiedad ON gananciaempleado(id_propiedad);
CREATE INDEX idx_ganancia_empleado_id_usuario_empleado ON gananciaempleado(id_usuario_empleado);
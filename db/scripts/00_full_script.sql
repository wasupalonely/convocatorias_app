/* =====================================================================
   Universidad Surcolombiana
   Sistema de Gestion de Convocatorias Institucionales
   Script SQL completo (SQL Server / T-SQL)
   ---------------------------------------------------------------------
   Contenido:
     1. Creacion de base de datos
     2. Esquema (tablas, claves, integridad referencial, normalizacion)
     3. Datos semilla de ejemplo (categorias)
   Nota: los usuarios semilla (incluido el ADMINISTRADOR) se crean desde
         la aplicacion para almacenar la contrasena con hash BCrypt.
   ===================================================================== */

-------------------------------------------------------------------------
-- 1. Base de datos
-------------------------------------------------------------------------
IF DB_ID('convocatorias_db') IS NULL
BEGIN
    CREATE DATABASE convocatorias_db;
END
GO

USE convocatorias_db;
GO

-------------------------------------------------------------------------
-- 2. Esquema
-------------------------------------------------------------------------

-- Usuarios -------------------------------------------------------------
IF OBJECT_ID('dbo.usuarios', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuarios (
        id              BIGINT IDENTITY(1,1)    NOT NULL,
        identificacion  VARCHAR(30)             NOT NULL,
        nombre          NVARCHAR(150)           NOT NULL,
        correo          VARCHAR(150)            NOT NULL,
        password_hash   VARCHAR(100)            NOT NULL,
        rol             VARCHAR(20)             NOT NULL,
        estado          VARCHAR(10)             NOT NULL CONSTRAINT DF_usuarios_estado DEFAULT 'ACTIVO',
        creado_en       DATETIMEOFFSET(6)            NOT NULL CONSTRAINT DF_usuarios_creado DEFAULT SYSUTCDATETIME(),
        actualizado_en  DATETIMEOFFSET(6)            NULL,
        CONSTRAINT PK_usuarios            PRIMARY KEY (id),
        CONSTRAINT UQ_usuarios_identif    UNIQUE (identificacion),
        CONSTRAINT UQ_usuarios_correo     UNIQUE (correo),
        CONSTRAINT CK_usuarios_rol        CHECK (rol IN ('ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE')),
        CONSTRAINT CK_usuarios_estado     CHECK (estado IN ('ACTIVO', 'INACTIVO'))
    );
END
GO

-- Convocatorias --------------------------------------------------------
IF OBJECT_ID('dbo.convocatorias', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.convocatorias (
        id                  BIGINT IDENTITY(1,1)    NOT NULL,
        nombre              NVARCHAR(200)           NOT NULL,
        descripcion         NVARCHAR(MAX)           NULL,
        fecha_inicio        DATE                    NOT NULL,
        fecha_fin           DATE                    NOT NULL,
        cupos_disponibles   INT                     NOT NULL,
        estado              VARCHAR(15)             NOT NULL CONSTRAINT DF_conv_estado DEFAULT 'BORRADOR',
        creado_en           DATETIMEOFFSET(6)            NOT NULL CONSTRAINT DF_conv_creado DEFAULT SYSUTCDATETIME(),
        actualizado_en      DATETIMEOFFSET(6)            NULL,
        CONSTRAINT PK_convocatorias         PRIMARY KEY (id),
        CONSTRAINT CK_conv_estado           CHECK (estado IN ('BORRADOR', 'PUBLICADA', 'CERRADA')),
        CONSTRAINT CK_conv_cupos            CHECK (cupos_disponibles >= 0),
        CONSTRAINT CK_conv_fechas           CHECK (fecha_fin >= fecha_inicio)
    );
END
GO

-- Categorias -----------------------------------------------------------
IF OBJECT_ID('dbo.categorias', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.categorias (
        id          BIGINT IDENTITY(1,1)    NOT NULL,
        nombre      NVARCHAR(100)           NOT NULL,
        descripcion NVARCHAR(300)           NULL,
        creado_en   DATETIMEOFFSET(6)            NOT NULL CONSTRAINT DF_cat_creado DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_categorias        PRIMARY KEY (id),
        CONSTRAINT UQ_categorias_nombre UNIQUE (nombre)
    );
END
GO

-- Relacion N:M Convocatoria <-> Categoria ------------------------------
IF OBJECT_ID('dbo.convocatoria_categoria', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.convocatoria_categoria (
        convocatoria_id BIGINT NOT NULL,
        categoria_id    BIGINT NOT NULL,
        CONSTRAINT PK_conv_cat PRIMARY KEY (convocatoria_id, categoria_id),
        CONSTRAINT FK_conv_cat_convocatoria FOREIGN KEY (convocatoria_id)
            REFERENCES dbo.convocatorias (id) ON DELETE CASCADE,
        CONSTRAINT FK_conv_cat_categoria FOREIGN KEY (categoria_id)
            REFERENCES dbo.categorias (id) ON DELETE CASCADE
    );
    CREATE INDEX IX_conv_cat_categoria ON dbo.convocatoria_categoria (categoria_id);
END
GO

-- Postulaciones --------------------------------------------------------
IF OBJECT_ID('dbo.postulaciones', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.postulaciones (
        id                 BIGINT IDENTITY(1,1)    NOT NULL,
        convocatoria_id    BIGINT                  NOT NULL,
        estudiante_id      BIGINT                  NOT NULL,
        estado             VARCHAR(12)             NOT NULL CONSTRAINT DF_post_estado DEFAULT 'PENDIENTE',
        observacion        NVARCHAR(500)           NULL,
        fecha_postulacion  DATETIMEOFFSET(6)            NOT NULL CONSTRAINT DF_post_fecha DEFAULT SYSUTCDATETIME(),
        actualizado_en     DATETIMEOFFSET(6)            NULL,
        CONSTRAINT PK_postulaciones     PRIMARY KEY (id),
        CONSTRAINT FK_post_convocatoria FOREIGN KEY (convocatoria_id)
            REFERENCES dbo.convocatorias (id),
        CONSTRAINT FK_post_estudiante   FOREIGN KEY (estudiante_id)
            REFERENCES dbo.usuarios (id),
        CONSTRAINT CK_post_estado       CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
        -- Un estudiante no puede postularse dos veces a la misma convocatoria
        CONSTRAINT UQ_post_unica        UNIQUE (convocatoria_id, estudiante_id)
    );
    CREATE INDEX IX_post_convocatoria ON dbo.postulaciones (convocatoria_id);
    CREATE INDEX IX_post_estudiante   ON dbo.postulaciones (estudiante_id);
    CREATE INDEX IX_post_estado       ON dbo.postulaciones (estado);
END
GO

-------------------------------------------------------------------------
-- 3. Datos semilla (categorias de ejemplo)
-------------------------------------------------------------------------
MERGE dbo.categorias AS destino
USING (VALUES
    (N'Investigación', N'Convocatorias de investigación y semilleros'),
    (N'Bienestar',     N'Programas de bienestar universitario'),
    (N'Académica',     N'Actividades académicas y monitorías'),
    (N'Deportiva',     N'Eventos y representaciones deportivas'),
    (N'Cultural',      N'Actividades artísticas y culturales')
) AS fuente (nombre, descripcion)
ON destino.nombre = fuente.nombre
WHEN NOT MATCHED THEN
    INSERT (nombre, descripcion) VALUES (fuente.nombre, fuente.descripcion);
GO

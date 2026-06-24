-- 1. Base de datos
-------------------------------------------------------------------------
IF DB_ID('convocatorias_db') IS NULL
BEGIN
    CREATE DATABASE convocatorias_db;
END
GO

USE convocatorias_db;
GO

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

-- Relacion N:M Convocatoria Categoria ------------------------------
IF OBJECT_ID('dbo.convocatoria_categoria', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.convocatoria_categoria (
        convocatoria_id BIGINT NOT NULL,
        categoria_id    BIGINT NOT NULL,
        CONSTRAINT PK_conv_cat PRIMARY KEY (convocatoria_id, categoria_id),
        -- Cascade del lado de la convocatoria: borrar una convocatoria limpia sus asociaciones.
        CONSTRAINT FK_conv_cat_convocatoria FOREIGN KEY (convocatoria_id)
            REFERENCES dbo.convocatorias (id) ON DELETE CASCADE,
        -- RESTRICT del lado de la categoria: no se puede borrar una categoria en uso.
        CONSTRAINT FK_conv_cat_categoria FOREIGN KEY (categoria_id)
            REFERENCES dbo.categorias (id)
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
        postulante_id      BIGINT                  NOT NULL,
        estado             VARCHAR(12)             NOT NULL CONSTRAINT DF_post_estado DEFAULT 'PENDIENTE',
        observacion        NVARCHAR(500)           NULL,
        fecha_postulacion  DATETIMEOFFSET(6)            NOT NULL CONSTRAINT DF_post_fecha DEFAULT SYSUTCDATETIME(),
        actualizado_en     DATETIMEOFFSET(6)            NULL,
        CONSTRAINT PK_postulaciones     PRIMARY KEY (id),
        CONSTRAINT FK_post_convocatoria FOREIGN KEY (convocatoria_id)
            REFERENCES dbo.convocatorias (id),
        CONSTRAINT FK_post_postulante   FOREIGN KEY (postulante_id)
            REFERENCES dbo.usuarios (id),
        CONSTRAINT CK_post_estado       CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
        -- Un postulante no puede postularse dos veces a la misma convocatoria
        CONSTRAINT UQ_post_unica        UNIQUE (convocatoria_id, postulante_id)
    );
    CREATE INDEX IX_post_convocatoria ON dbo.postulaciones (convocatoria_id);
    CREATE INDEX IX_post_postulante   ON dbo.postulaciones (postulante_id);
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

-------------------------------------------------------------------------
-- 4. Auditoria de cambios (tabla + triggers)        [migracion V5]
--    Registra INSERT/UPDATE/DELETE de usuarios, convocatorias y
--    postulaciones, con valores en JSON y el autor (usuario_app, propagado
--    por el backend via SESSION_CONTEXT; usuario_db = login de conexion).
-------------------------------------------------------------------------
IF OBJECT_ID('dbo.auditoria', 'U') IS NULL
CREATE TABLE dbo.auditoria (
    id                BIGINT IDENTITY(1,1)  NOT NULL,
    tabla             VARCHAR(50)           NOT NULL,
    registro_id       BIGINT                NULL,
    operacion         VARCHAR(10)           NOT NULL,
    datos_anteriores  NVARCHAR(MAX)         NULL,
    datos_nuevos      NVARCHAR(MAX)         NULL,
    usuario_app       NVARCHAR(150)         NULL,
    usuario_db        NVARCHAR(128)         NOT NULL CONSTRAINT DF_aud_userdb DEFAULT ORIGINAL_LOGIN(),
    fecha             DATETIMEOFFSET(6)     NOT NULL CONSTRAINT DF_aud_fecha  DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_auditoria PRIMARY KEY (id),
    CONSTRAINT CK_aud_operacion CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE'))
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_aud_tabla_registro')
    CREATE INDEX IX_aud_tabla_registro ON dbo.auditoria (tabla, registro_id);
GO

-- usuarios: se excluye password_hash del registro de auditoria por seguridad.
CREATE OR ALTER TRIGGER dbo.trg_aud_usuarios ON dbo.usuarios
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @app NVARCHAR(150) = CONVERT(NVARCHAR(150), SESSION_CONTEXT(N'app_user'));

    INSERT INTO dbo.auditoria (tabla, registro_id, operacion, datos_nuevos, datos_anteriores, usuario_app)
    SELECT 'usuarios', i.id,
           CASE WHEN EXISTS (SELECT 1 FROM deleted d WHERE d.id = i.id) THEN 'UPDATE' ELSE 'INSERT' END,
           (SELECT u.id, u.identificacion, u.nombre, u.correo, u.rol, u.estado, u.creado_en, u.actualizado_en
                FROM dbo.usuarios u WHERE u.id = i.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           (SELECT d.id, d.identificacion, d.nombre, d.correo, d.rol, d.estado, d.creado_en, d.actualizado_en
                FROM deleted d WHERE d.id = i.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           @app
    FROM inserted i;

    INSERT INTO dbo.auditoria (tabla, registro_id, operacion, datos_anteriores, usuario_app)
    SELECT 'usuarios', d.id, 'DELETE',
           (SELECT d2.id, d2.identificacion, d2.nombre, d2.correo, d2.rol, d2.estado, d2.creado_en, d2.actualizado_en
                FROM deleted d2 WHERE d2.id = d.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           @app
    FROM deleted d
    WHERE NOT EXISTS (SELECT 1 FROM inserted i WHERE i.id = d.id);
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_aud_convocatorias ON dbo.convocatorias
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @app NVARCHAR(150) = CONVERT(NVARCHAR(150), SESSION_CONTEXT(N'app_user'));

    INSERT INTO dbo.auditoria (tabla, registro_id, operacion, datos_nuevos, datos_anteriores, usuario_app)
    SELECT 'convocatorias', i.id,
           CASE WHEN EXISTS (SELECT 1 FROM deleted d WHERE d.id = i.id) THEN 'UPDATE' ELSE 'INSERT' END,
           (SELECT c.* FROM dbo.convocatorias c WHERE c.id = i.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           (SELECT d.* FROM deleted d WHERE d.id = i.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           @app
    FROM inserted i;

    INSERT INTO dbo.auditoria (tabla, registro_id, operacion, datos_anteriores, usuario_app)
    SELECT 'convocatorias', d.id, 'DELETE',
           (SELECT d2.* FROM deleted d2 WHERE d2.id = d.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           @app
    FROM deleted d
    WHERE NOT EXISTS (SELECT 1 FROM inserted i WHERE i.id = d.id);
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_aud_postulaciones ON dbo.postulaciones
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @app NVARCHAR(150) = CONVERT(NVARCHAR(150), SESSION_CONTEXT(N'app_user'));

    INSERT INTO dbo.auditoria (tabla, registro_id, operacion, datos_nuevos, datos_anteriores, usuario_app)
    SELECT 'postulaciones', i.id,
           CASE WHEN EXISTS (SELECT 1 FROM deleted d WHERE d.id = i.id) THEN 'UPDATE' ELSE 'INSERT' END,
           (SELECT p.* FROM dbo.postulaciones p WHERE p.id = i.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           (SELECT d.* FROM deleted d WHERE d.id = i.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           @app
    FROM inserted i;

    INSERT INTO dbo.auditoria (tabla, registro_id, operacion, datos_anteriores, usuario_app)
    SELECT 'postulaciones', d.id, 'DELETE',
           (SELECT d2.* FROM deleted d2 WHERE d2.id = d.id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
           @app
    FROM deleted d
    WHERE NOT EXISTS (SELECT 1 FROM inserted i WHERE i.id = d.id);
END;
GO

-------------------------------------------------------------------------
-- 5. Evento de estados de convocatoria (SP + Job de Agent)   [migracion V4]
--    Abre (BORRADOR->PUBLICADA) y cierra (PUBLICADA->CERRADA) por fecha.
--    El Job requiere SQL Server Agent habilitado (MSSQL_AGENT_ENABLED=true).
-------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_actualizar_estados_convocatorias
AS
BEGIN
    SET NOCOUNT ON;

    -- Identifica los cambios de este proceso en la auditoria (lo leen los triggers).
    EXEC sys.sp_set_session_context @key = N'app_user', @value = N'EVENTO-PROGRAMADO';

    DECLARE @hoy DATE = CAST(SYSUTCDATETIME() AS DATE);

    UPDATE dbo.convocatorias
        SET estado = 'PUBLICADA', actualizado_en = SYSUTCDATETIME()
        WHERE estado = 'BORRADOR' AND fecha_inicio <= @hoy AND fecha_fin >= @hoy;

    UPDATE dbo.convocatorias
        SET estado = 'CERRADA', actualizado_en = SYSUTCDATETIME()
        WHERE estado = 'PUBLICADA' AND fecha_fin < @hoy;
END;
GO

-- Job diario del Agent que ejecuta el SP. Idempotente y tolerante: si el Agent
-- no esta disponible no se rompe el script (el SP queda creado y es ejecutable).
BEGIN TRY
    IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = N'usco_actualizar_estados_convocatorias')
        EXEC msdb.dbo.sp_delete_job @job_name = N'usco_actualizar_estados_convocatorias';

    EXEC msdb.dbo.sp_add_job
        @job_name = N'usco_actualizar_estados_convocatorias',
        @description = N'Abre/cierra convocatorias segun su fecha de inicio y fin.',
        @enabled = 1;

    EXEC msdb.dbo.sp_add_jobstep
        @job_name = N'usco_actualizar_estados_convocatorias',
        @step_name = N'Ejecutar SP de estados',
        @subsystem = N'TSQL',
        @database_name = N'convocatorias_db',
        @command = N'EXEC dbo.sp_actualizar_estados_convocatorias;';

    EXEC msdb.dbo.sp_add_schedule
        @schedule_name = N'usco_diario_medianoche',
        @freq_type = 4,             -- diario
        @freq_interval = 1,
        @active_start_time = 100;   -- 00:01:00

    EXEC msdb.dbo.sp_attach_schedule
        @job_name = N'usco_actualizar_estados_convocatorias',
        @schedule_name = N'usco_diario_medianoche';

    EXEC msdb.dbo.sp_add_jobserver
        @job_name = N'usco_actualizar_estados_convocatorias',
        @server_name = N'(LOCAL)';
END TRY
BEGIN CATCH
    PRINT 'Aviso: no se pudo crear el Job del Agent (puede estar deshabilitado). '
        + 'El SP dbo.sp_actualizar_estados_convocatorias queda disponible. Detalle: ' + ERROR_MESSAGE();
END CATCH;
GO

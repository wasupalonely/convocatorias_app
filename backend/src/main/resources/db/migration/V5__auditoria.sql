-- Auditoria de cambios sobre las tablas sensibles (usuarios, convocatorias, postulaciones).
-- Triggers AFTER INSERT/UPDATE/DELETE registran que cambio, valores (JSON), cuando y QUIEN:
--   * usuario_app: usuario logueado de la aplicacion, propagado por el backend via SESSION_CONTEXT.
--                  Para los cambios del evento programado vale 'EVENTO-PROGRAMADO'.
--   * usuario_db:  login de conexion a la base (ORIGINAL_LOGIN(), normalmente 'sa').

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

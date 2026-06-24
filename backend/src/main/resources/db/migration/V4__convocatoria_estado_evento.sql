-- Evento programado: actualiza el estado de las convocatorias segun sus fechas.
--  - BORRADOR  -> PUBLICADA  cuando la fecha de inicio ya llego (y aun no termina).
--  - PUBLICADA -> CERRADA    cuando la fecha de fin ya paso.
-- Se implementa como stored procedure + un Job de SQL Server Agent que lo corre a diario.
-- El SP marca el cambio como 'EVENTO-PROGRAMADO' para que la auditoria identifique su origen.

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

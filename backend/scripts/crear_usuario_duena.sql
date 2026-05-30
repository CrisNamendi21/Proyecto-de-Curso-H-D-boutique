USE hdboutique;
GO

/*
    Script no destructivo para registrar la cuenta de DUENA en dbo.Usuarios.

    Antes de ejecutarlo, revisa que @ID_Empleado_Duena exista en dbo.Empleados.
    La contrasena real no se guarda aqui; solo se guarda el hash.
*/

DECLARE @ID_Empleado_Duena INT = 1;
DECLARE @Usuario_Duena NVARCHAR(80) = N'duena';
DECLARE @ContrasenaHash_Duena NVARCHAR(255) = N'affb37fd7ee3f2bdd39b4fcbb5dd6bb2d54126d2eaa15841b8861df6619f24b2';

IF OBJECT_ID('dbo.Usuarios', 'U') IS NULL
BEGIN
    RAISERROR('La tabla dbo.Usuarios no existe. Ejecuta primero el script de creacion de Usuarios.', 16, 1);
    RETURN;
END;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.Empleados
    WHERE ID_Empleado = @ID_Empleado_Duena
)
BEGIN
    RAISERROR('El ID_Empleado indicado para la duena no existe en dbo.Empleados.', 16, 1);
    RETURN;
END;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.Usuarios
    WHERE Usuario = @Usuario_Duena
       OR ID_Empleado = @ID_Empleado_Duena
)
BEGIN
    INSERT INTO dbo.Usuarios (
        ID_Empleado,
        Usuario,
        ContrasenaHash,
        Rol,
        Estado,
        FechaCreacion
    )
    VALUES (
        @ID_Empleado_Duena,
        @Usuario_Duena,
        @ContrasenaHash_Duena,
        N'DUENA',
        N'ACTIVO',
        GETDATE()
    );
END;
GO

SELECT
    u.ID_Usuario,
    u.ID_Empleado,
    e.Nombres,
    e.Apellidos,
    u.Usuario,
    u.Rol,
    u.Estado,
    u.FechaCreacion
FROM dbo.Usuarios u
INNER JOIN dbo.Empleados e
    ON e.ID_Empleado = u.ID_Empleado
WHERE u.Usuario = N'duena';
GO

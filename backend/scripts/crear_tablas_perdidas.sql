/*
  H&D Boutique - tablas para registro de pérdidas de inventario.

  Este script agrega dos tablas nuevas:
  - Perdidas: encabezado/auditoría de la pérdida.
  - DetallePerdidas: productos descontados en cada pérdida.

  No modifica ni elimina datos existentes. La rebaja de stock se realiza desde
  el backend cuando se registra una pérdida.
*/

IF OBJECT_ID(N'dbo.Perdidas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Perdidas (
        ID_Perdida INT IDENTITY(1,1) NOT NULL,
        ID_Proveedor INT NULL,
        ID_Compra INT NULL,
        ID_Empleado INT NULL,
        FechaRegistro DATE NOT NULL,
        Motivo NVARCHAR(150) NOT NULL,
        Observacion NVARCHAR(500) NULL,
        Estado NVARCHAR(50) NOT NULL CONSTRAINT DF_Perdidas_Estado DEFAULT N'Registrada',
        CONSTRAINT PK_Perdidas PRIMARY KEY (ID_Perdida),
        CONSTRAINT FK_Perdidas_Proveedores
            FOREIGN KEY (ID_Proveedor) REFERENCES dbo.Proveedores(ID_Proveedor),
        CONSTRAINT FK_Perdidas_Compras
            FOREIGN KEY (ID_Compra) REFERENCES dbo.Compras(ID_Compra),
        CONSTRAINT FK_Perdidas_Empleados
            FOREIGN KEY (ID_Empleado) REFERENCES dbo.Empleados(ID_Empleado)
    );
END;
GO

IF OBJECT_ID(N'dbo.DetallePerdidas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DetallePerdidas (
        ID_DetallePerdida INT IDENTITY(1,1) NOT NULL,
        ID_Perdida INT NOT NULL,
        ID_Producto INT NOT NULL,
        Cantidad INT NOT NULL,
        CostoUnitario DECIMAL(10,2) NOT NULL,
        CostoTotal DECIMAL(10,2) NOT NULL,
        CONSTRAINT PK_DetallePerdidas PRIMARY KEY (ID_DetallePerdida),
        CONSTRAINT FK_DetallePerdidas_Perdidas
            FOREIGN KEY (ID_Perdida) REFERENCES dbo.Perdidas(ID_Perdida),
        CONSTRAINT FK_DetallePerdidas_Productos
            FOREIGN KEY (ID_Producto) REFERENCES dbo.Productos(ID_Producto),
        CONSTRAINT CK_DetallePerdidas_Cantidad CHECK (Cantidad > 0),
        CONSTRAINT CK_DetallePerdidas_CostoUnitario CHECK (CostoUnitario > 0),
        CONSTRAINT CK_DetallePerdidas_CostoTotal CHECK (CostoTotal > 0)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Perdidas_FechaRegistro'
      AND object_id = OBJECT_ID(N'dbo.Perdidas')
)
BEGIN
    CREATE INDEX IX_Perdidas_FechaRegistro
    ON dbo.Perdidas (FechaRegistro);
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_DetallePerdidas_ID_Producto'
      AND object_id = OBJECT_ID(N'dbo.DetallePerdidas')
)
BEGIN
    CREATE INDEX IX_DetallePerdidas_ID_Producto
    ON dbo.DetallePerdidas (ID_Producto);
END;
GO

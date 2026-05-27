-- Script pendiente para guardar municipio en direcciones de clientes.
-- No fue ejecutado automaticamente por Codex.
-- Revisar primero en SQL Server Management Studio antes de aplicarlo.

IF COL_LENGTH('Direccion_clientes', 'ID_Municipio') IS NULL
BEGIN
    ALTER TABLE Direccion_clientes
    ADD ID_Municipio INT NULL;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Direccion_clientes_Municipios'
)
BEGIN
    ALTER TABLE Direccion_clientes
    ADD CONSTRAINT FK_Direccion_clientes_Municipios
    FOREIGN KEY (ID_Municipio)
    REFERENCES Municipios(ID_Municipio);
END;

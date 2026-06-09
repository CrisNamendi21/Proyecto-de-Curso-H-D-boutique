# Cambios de inventario, pérdidas y backup

## Stock inicial de productos

- La creación de productos ahora registra el producto como catálogo con `Stock = 0`.
- El formulario de productos ya no pide stock inicial.
- Las existencias solo cambian mediante compras recibidas, ventas registradas o pérdidas registradas.

## Módulo de pérdidas

- Se agregó el módulo `Pérdidas` para la dueña.
- Permite filtrar pérdidas por fecha, producto, proveedor y motivo.
- Permite registrar productos perdidos con cantidad, costo unitario, motivo y observación.
- Al guardar una pérdida, el backend valida stock disponible y descuenta la cantidad del producto.
- El colaborador no tiene acceso a este módulo; los endpoints requieren rol `duena`.

## Tablas nuevas de base de datos

Este cambio sí requiere tablas nuevas porque las pérdidas deben quedar auditadas sin mezclarse con compras o ventas:

- `Perdidas`: encabezado del registro, fecha, motivo, proveedor/compra/empleado opcionales y estado.
- `DetallePerdidas`: productos incluidos en la pérdida, cantidad, costo unitario y costo total.

Script SQL:

```text
backend/scripts/crear_tablas_perdidas.sql
```

El script usa validaciones `IF OBJECT_ID(...) IS NULL`, por lo que no elimina datos existentes.

## Backup SQL Server

Se agregó un script de backup:

```text
backend/scripts/backup_sqlserver.py
```

Uso recomendado:

```powershell
python backend/scripts/backup_sqlserver.py --dry-run
python backend/scripts/backup_sqlserver.py
```

Variables soportadas:

- `DB_SERVER`
- `DB_NAME`
- `DB_DRIVER`
- `DB_TRUSTED_CONNECTION`
- `DB_USER`
- `DB_PASSWORD`
- `BACKUP_DIR`

El backup se genera como archivo `.bak` con fecha y hora. Por defecto se guarda en `backups/`.

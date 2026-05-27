# Fase 5 - Productos / Inventario

## 1. Objetivo

Se conecto el modulo Productos / Inventario con datos reales del backend, se quitaron productos quemados y se corrigio el modal de agregar producto para usar categoria, talla y proveedor reales.

## 2. Archivos modificados

- `backend/app/routers/productos/producto_router.py`
  - `GET /productos/` ahora devuelve datos enriquecidos para inventario sin romper NuevaVenta.
  - Se agrego `GET /productos/resumen-inventario`.
  - Se agrego `POST /productos/registrar-completo`.

- `backend/app/schemas/productos/producto_schema.py`
  - Se agregaron campos de respuesta para categoria, talla, proveedor, costo y precio de venta calculado.
  - Se agrego el schema para crear producto completo.
  - Se agrego el schema de resumen de inventario.

- `frontend/src/api/api.js`
  - Se agregaron helpers para inventario, categorias, tallas, proveedores y creacion completa de producto.

- `frontend/src/pages/duena/Productos/Productos.jsx`
  - Se quitaron productos quemados.
  - Se reemplazo categoria automatica por select de categorias reales.
  - Se agregaron selects reales de talla y proveedor.
  - Se conectaron tarjetas, listado y filtros con datos reales.
  - Se conecto el guardado con `POST /productos/registrar-completo`.

- `frontend/src/pages/duena/Productos/Productos.css`
  - Se agregaron estilos minimos para mensajes, estado inactivo y modal con scroll interno.

## 3. Datos reales mostrados

La pantalla ahora muestra datos desde SQL Server por medio de FastAPI:

- Total de productos.
- Valor del inventario.
- Productos bajos en stock.
- Productos sin stock.
- Listado de productos.
- Categoria real.
- Talla real.
- Proveedor real.
- Costo real desde `ProductoProveedor.PrecioDeCompra`.
- Precio de venta calculado.
- Stock y estado.

## 4. Nuevo producto

El modal ya no muestra `Categoria automatica`.

Ahora solicita:

- Nombre del producto.
- Fecha visual del formulario.
- Categoria desde `GET /categorias/`.
- Talla desde `GET /tallas/`.
- Proveedor desde `GET /proveedores/`.
- Costo.
- Precio de venta calculado.
- Stock.
- Descripcion opcional.

Al guardar, el frontend envia los datos reales al backend y luego refresca listado y tarjetas.

## 5. Relacion producto-proveedor

El producto se crea con `POST /productos/registrar-completo`.

Ese endpoint crea en una misma transaccion:

- Registro en `Productos`.
- Registro relacionado en `ProductoProveedor`.

La relacion guarda:

- `ID_Producto`.
- `ID_Proveedor`.
- `PrecioDeCompra`.

Asi queda definido que proveedor entrega ese producto y a que costo.

## 6. Precio/costo

El costo se toma de:

```text
ProductoProveedor.PrecioDeCompra
```

El precio de venta sigue calculandose como:

```text
PrecioUnitario = PrecioDeCompra * 1.15
```

Esto mantiene compatibilidad con NuevaVenta, que ya usa `PrecioUnitario`.

Deuda tecnica:

- La tabla `Productos` no tiene una columna formal de precio de venta.
- Mientras no exista esa columna, el precio de venta se mantiene como calculo derivado del costo.

## 7. Endpoints usados o creados

- `GET /productos/`
- `GET /productos/resumen-inventario`
- `POST /productos/registrar-completo`
- `GET /categorias/`
- `GET /tallas/`
- `GET /proveedores/`

## 8. Pruebas realizadas

- `python -m compileall -q backend/app`: correcto.
- Import de `app.main`: correcto.
- `npm run build`: correcto.
- `GET /productos/`: correcto, devuelve productos reales con categoria, talla, costo y proveedor.
- `GET /productos/resumen-inventario`: correcto.
- `GET /categorias/`: correcto.
- `GET /proveedores/`: correcto.
- `GET /tallas/`: correcto.
- `GET /dashboard/`: correcto.
- `GET /ventas/resumen-dia`: correcto.
- `GET /recibos/`: correcto.
- OpenAPI incluye `POST /productos/registrar-completo`.

No se inserto un producto de prueba para evitar contaminar inventario real de la base de datos.

## 9. Limitaciones

- El filtro de productos se aplica en frontend sobre los productos reales cargados. Es suficiente para el volumen actual, pero si el inventario crece mucho puede moverse a query params del backend.
- La fecha del modal se conserva como dato visual del formulario, pero la tabla `Productos` actual no tiene columna de fecha de creacion.
- El precio de venta sigue siendo calculado porque no existe columna formal de precio de venta en `Productos`.

## 10. Pendientes

Siguiente modulo de Fase 5:

- Compras.

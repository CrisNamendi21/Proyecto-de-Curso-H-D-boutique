# Fase 5 - Compras

## 1. Objetivo

Se conecto el modulo Compras con datos reales del backend y SQL Server. Se quitaron datos quemados, se elimino el grafico `Resumen de compras` y se ajusto el modal para registrar compras con varios productos reales por proveedor.

## 2. Archivos modificados

- `backend/app/routers/compras/compra_router.py`
  - Se agregaron endpoints reales para resumen, listado filtrado y registro completo de compra.
  - Se calcula total desde los detalles reales.
  - Se valida proveedor, empleado y productos asociados al proveedor.

- `backend/app/routers/proveedores/proveedor_router.py`
  - Se agrego endpoint para listar productos reales ofrecidos por un proveedor.

- `backend/app/schemas/compras/compra_schema.py`
  - Se agregaron schemas para resumen, listado, productos por proveedor y compra completa.

- `frontend/src/api/api.js`
  - Se agregaron helpers para compras y productos por proveedor.

- `frontend/src/pages/duena/Compras/Compras.jsx`
  - Se reemplazaron datos quemados por datos reales.
  - Se quito el grafico de resumen.
  - Se quito `No. compra` del modal.
  - Se quito `Producto principal` del modal.
  - Se agrego seleccion de varios productos por proveedor.

- `frontend/src/pages/duena/Compras/Compras.css`
  - Se quitaron estilos del grafico y se agregaron estilos minimos para el modal de productos multiples.

## 3. Datos reales mostrados

La pantalla muestra desde backend:

- Compras del mes.
- Ordenes registradas del mes.
- Monto invertido del mes.
- Proveedores activos.
- Listado de compras.
- Filtros por busqueda, proveedor, fecha y estado.

## 4. No. compra real

La columna `No. compra` muestra `ID_Compra` real desde la tabla `Compras`.

Ejemplo:

```text
ID_Compra = 4 -> No. compra = 4
```

No se usa formato `C-00004`, indices, contadores ni datos quemados.

## 5. Grafico eliminado

Se quito por completo la seccion `Resumen de compras` y su grafico de barras. No se dejo espacio vacio ni se agrego un grafico nuevo.

## 6. Nueva compra

El modal ahora:

- No pide `No. compra`.
- No pide `Producto principal`.
- Carga proveedores reales.
- Al seleccionar proveedor, carga solo productos asociados a ese proveedor.
- Permite agregar varios productos.
- Muestra talla real del producto.
- Muestra costo real desde `ProductoProveedor.PrecioDeCompra`.
- Calcula subtotal por producto.
- Calcula total automaticamente.
- Permite quitar productos.

## Cambio de pendiente a recibida

En el listado, las compras con estado `Pendiente` muestran la accion `Marcar recibida`.

Esta accion usa:

```text
PUT /compras/{id_compra}/recibir
```

El backend valida que la compra exista, que aun no haya sido recibida y que tenga productos registrados. Luego:

- Actualiza `FechaRevision` con la fecha actual.
- El estado derivado pasa de `Pendiente` a `Recibida`.
- Suma al stock las cantidades de los detalles de compra.
- Evita recibir dos veces la misma compra para no duplicar stock.

## 7. Delivery en compras

El modelo `Compra` si tiene campo real:

```text
CostoDeEnvio
```

Por eso el modal muestra `Costo envío`, permite monto mayor o igual a cero y lo suma al total de la compra.

## 8. Relacion proveedor-producto

La relacion se obtiene desde `ProductoProveedor`.

Endpoint usado:

```text
GET /proveedores/{id_proveedor}/productos
```

Este endpoint devuelve productos reales del proveedor con:

- `ID_ProductoProveedor`
- `ID_Producto`
- `Nombre`
- `Talla`
- `PrecioDeCompra`
- `Stock`

## 9. Endpoints usados o creados

- `GET /compras/resumen`
- `GET /compras/`
- `POST /compras/registrar-completa`
- `GET /proveedores/`
- `GET /proveedores/{id_proveedor}/productos`

## 10. Pruebas realizadas

- `python -m compileall -q backend/app`: correcto.
- Import de `app.main`: correcto.
- `npm run build`: correcto.
- `GET /compras/resumen`: correcto.
- `GET /compras/`: correcto, devuelve compras reales.
- `GET /compras/?proveedor=1`: correcto.
- `GET /compras/?busqueda=4`: correcto.
- `GET /compras/?estado=Recibida`: correcto.
- `GET /compras/?fecha=2026-04-29`: correcto.
- `GET /proveedores/`: correcto.
- `GET /proveedores/1/productos`: correcto, devuelve productos reales con talla y costo.
- OpenAPI incluye `POST /compras/registrar-completa`.
- OpenAPI incluye `GET /proveedores/{id_proveedor}/productos`.

No se registro una compra de prueba para evitar modificar inventario real y aumentar stock.

## 11. Limitaciones

- La tabla `Compras` no tiene columna `Estado`; el estado se deriva:
  - `Recibida` si `FechaRevision` tiene valor.
  - `Pendiente` si `FechaRevision` esta vacia.
- Si la compra se registra como `Recibida`, el backend aumenta el stock de los productos comprados.
- Si se registra como `Pendiente`, no aumenta stock.

## 12. Pendientes

Siguiente modulo de Fase 5:

- Proveedores.

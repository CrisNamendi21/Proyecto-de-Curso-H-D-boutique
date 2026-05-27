# Fase 5 - Tallas y PDF de recibos

## 1. Objetivo

Se agrego talla real de productos en NuevaVenta, Ventas, Recibos y PDF de recibo. Tambien se agrego delivery real al detalle de recibos y al PDF.

## 2. Archivos modificados

- `backend/app/routers/productos/producto_router.py`
  - `GET /productos/` ahora devuelve el nombre real de la talla.

- `backend/app/schemas/productos/producto_schema.py`
  - `ProductoResponse` ahora incluye `Talla`.

- `backend/app/routers/ventas/venta_router.py`
  - `GET /ventas/resumen-dia` ahora incluye `productos_detalle` con talla.

- `backend/app/schemas/ventas/venta_resumen_dia_schema.py`
  - Se agrego schema de producto vendido con talla.

- `backend/app/routers/ventas/recibo_router.py`
  - Detalle de recibos y PDF ahora incluyen talla.
  - Detalle de recibos y PDF ahora incluyen delivery y total de productos.
- El PDF usa `ID_Recibo` real como numero oficial del comprobante.

- `backend/app/schemas/ventas/recibo_detalle_schema.py`
  - Productos de recibo ahora incluyen `talla`.
  - Detalle de recibo ahora incluye `delivery` y `total_productos`.

- `frontend/src/pages/duena/NuevaVenta/NuevaVenta.jsx`
  - Se muestra talla en productos disponibles.
  - Se muestra talla en productos agregados al carrito.

- `frontend/src/pages/duena/NuevaVenta/NuevaVenta.css`
  - Se ajusto ancho minimo de tablas para incluir talla sin cortar columnas.

- `frontend/src/pages/duena/Ventas/Ventas.jsx`
  - El modal de detalle de venta muestra productos vendidos con talla.

- `frontend/src/pages/duena/Ventas/Ventas.css`
  - Se agregaron estilos minimos para la tabla de productos del detalle.

- `frontend/src/pages/duena/Recibos/Recibos.jsx`
  - El detalle completo del recibo muestra talla.
  - El detalle muestra total de productos, delivery y total real.
  - La vista previa muestra delivery.

- `frontend/src/pages/duena/Recibos/Recibos.css`
  - Se ajusto la tabla de productos del detalle para incluir talla.

## 3. Cambios en NuevaVenta

La tabla de productos disponibles ahora muestra:

- Producto
- Talla
- Precio
- Stock
- Accion

La tabla del carrito ahora muestra:

- Producto
- Talla
- Precio
- Cantidad
- Subtotal

La talla viene de `GET /productos/`. Si falta, se muestra `Sin talla`.

## 4. Cambios en Ventas

El endpoint `GET /ventas/resumen-dia` ahora devuelve `productos_detalle` por venta:

```json
{
  "producto": "Camisa casual para hombre",
  "talla": "M",
  "cantidad": 1,
  "precio": 287.5,
  "subtotal": 287.5
}
```

En el modal del boton Ver se muestra una tabla con producto, talla, cantidad, precio y subtotal.

## 5. Cambios en Recibos

`GET /recibos/ultimo` y `GET /recibos/{id_recibo}` ahora devuelven:

- `delivery`
- `total_productos`
- productos con `talla`

El detalle completo muestra:

- Producto
- Talla
- Cantidad
- Precio
- Subtotal
- Total productos
- Delivery
- Total

El numero de recibo en pantalla sigue mostrando el `ID_Recibo` real como viene de base de datos.

## 6. Cambios en PDF

El PDF del recibo ahora muestra:

- Numero de recibo usando `ID_Recibo` real tal como sale de la base de datos, por ejemplo `17`.
- Tabla con producto, talla, cantidad, precio y subtotal.
- Total productos.
- Delivery.
- Total real.

El PDF no muestra:

- Impuesto.
- IVA.
- Descuentos.

El archivo se descarga como `recibo-{ID_Recibo}.pdf`.

## 7. Endpoints modificados o usados

- `GET /productos/`
- `GET /ventas/resumen-dia`
- `GET /recibos/ultimo`
- `GET /recibos/{id_recibo}`
- `GET /recibos/{id_recibo}/pdf`

## 8. Pruebas realizadas

- `backend/venv/Scripts/python.exe -m compileall -q backend/app`: correcto.
- Import de `app.main`: correcto.
- `npm run build`: correcto.
- `GET /productos/`: correcto, devuelve `Talla`.
- `GET /ventas/resumen-dia`: correcto, devuelve `productos_detalle` con talla.
- `GET /recibos/ultimo`: correcto, devuelve productos con talla y delivery.
- `GET /recibos/17`: correcto, devuelve productos con talla y delivery.
- `GET /recibos/17/pdf`: correcto, descarga PDF.
- Se verifico el contenido del PDF:
  - contiene el `ID_Recibo` real.
  - contiene `Talla`.
  - contiene `Delivery`.
  - contiene tallas reales como `L` y `S`.
  - contiene total real.
  - no contiene `Impuesto`, `IVA` ni `Descuento`.

No se hicieron ventas nuevas para evitar insertar datos o descontar stock.

## 9. Limitaciones

Si algun producto queda sin relacion valida en `Tallas`, el backend devuelve `Sin talla`.

La validacion visual automatizada en navegador no se realizo; la verificacion frontend fue con `npm run build`.

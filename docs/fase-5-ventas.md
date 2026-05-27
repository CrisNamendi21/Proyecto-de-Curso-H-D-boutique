# Fase 5 - Ventas

## 1. Objetivo

Se conecto la pantalla Ventas con datos reales del backend, se quitaron datos quemados y se elimino por completo la seccion Ventas por hora. Tambien se ajusto el layout para que la pantalla se vea completa en laptop sin cortar contenido del lado izquierdo.

## 2. Archivos modificados

- `backend/app/routers/ventas/venta_router.py`
  - Se agrego `GET /ventas/resumen-dia`.
  - Se calculan ventas del dia, transacciones, productos vendidos, listado de ventas, productos mas vendidos y ventas por metodo de pago.

- `backend/app/schemas/ventas/venta_resumen_dia_schema.py`
  - Se agregaron schemas de respuesta para el resumen de ventas del dia.

- `frontend/src/api/api.js`
  - Se agrego `obtenerResumenVentasDia(filtros)`.

- `frontend/src/pages/duena/Ventas/Ventas.jsx`
  - Se reemplazaron datos quemados por datos reales del backend.
  - Se agregaron filtros por fecha, cliente y metodo de pago.
  - Se quito Ventas por hora.
  - Se quitaron descuentos e impuestos del resumen del dia.
  - La columna `No. venta` muestra el ID real de la tabla Ventas sin formato ficticio.
  - Se mantiene un modal simple para el boton Ver usando datos reales del listado.

- `frontend/src/pages/duena/Ventas/Ventas.css`
  - Se quitaron estilos exclusivos de Ventas por hora.
  - Se ajustaron grids, anchos y tablas para evitar cortes en laptop.
  - Se agregaron estilos minimos para carga, error y estados vacios.

## 3. Endpoint creado o usado

`GET /ventas/resumen-dia`

Query params opcionales:

- `fecha`
- `cliente`
- `metodo_pago`

Ejemplo:

`GET /ventas/resumen-dia?fecha=2026-05-26&metodo_pago=Mixto`

Ejemplo real de respuesta:

```json
{
  "resumen": {
    "ventas_hoy": 824.5,
    "transacciones": 1,
    "productos_vendidos": 2,
    "total_neto": 824.5
  },
  "ventas": [
    {
      "id_venta": 25,
      "numero_venta": "V-00025",
      "hora": "07:57 PM",
      "fecha": "2026-05-26",
      "cliente": "Armando Aleman",
      "metodo_pago": "Mixto",
      "total": 824.5,
      "productos": 2
    }
  ],
  "productos_mas_vendidos": [
    {
      "producto": "Pantalón jeans para hombre",
      "cantidad": 1,
      "total_vendido": 483.0
    }
  ],
  "metodos_pago": [
    {
      "metodo": "Efectivo",
      "total": 0.0
    },
    {
      "metodo": "Transferencia",
      "total": 0.0
    },
    {
      "metodo": "Mixto",
      "total": 824.5
    }
  ]
}
```

Nota: `numero_venta` puede venir en la respuesta por compatibilidad, pero la columna `No. venta` del frontend usa `id_venta` y muestra el valor real como `25`.

## 4. Datos reales mostrados

La pantalla Ventas ahora muestra datos reales para:

- Ventas de hoy.
- Transacciones.
- Productos vendidos.
- Listado de ventas.
- Productos mas vendidos.
- Ventas por metodo de pago.
- Resumen del dia.

Si no hay datos para una fecha, se muestran ceros y mensajes vacios claros.

## 5. Cambios visuales minimos

- Se quito completamente Ventas por hora.
- Se reorganizo la columna derecha para dejar solo metodo de pago y resumen del dia.
- Se redujeron anchos minimos de tablas y se uso `minmax(0, 1fr)` para evitar que el contenido se corte en laptop.
- Las tablas conservan scroll horizontal solo dentro de su tarjeta.
- Se mantuvo el estilo rosa, tarjetas, bordes y estructura general.

## 6. Reglas aplicadas

- No hay descuentos.
- No hay IVA separado.
- Total neto es igual al total de ventas porque no existen descuentos ni impuestos locales.
- Backend calcula.
- Frontend muestra.
- `No. venta` se muestra desde `id_venta`, que corresponde al `ID_Venta` real de SQL Server. No se usa indice, contador local ni formato `V-00000`.
- Metodo Mixto se detecta cuando una venta tiene mas de un tipo de pago en `PagosVenta`.
- Efectivo y Transferencia se detectan cuando la venta tiene un solo tipo de pago.

## 7. Pruebas realizadas

- `backend/venv/Scripts/python.exe -m compileall -q backend/app`: correcto.
- Import de `app.main`: correcto.
- `npm run build`: correcto.
- `GET /ventas/resumen-dia`: correcto.
- `GET /ventas/resumen-dia?fecha=2026-05-26`: correcto.
- `GET /ventas/resumen-dia?fecha=2026-05-26&cliente=cliente`: correcto.
- `GET /ventas/resumen-dia?fecha=2026-05-26&metodo_pago=Efectivo`: correcto.
- `GET /ventas/resumen-dia?fecha=2026-05-26&metodo_pago=Transferencia`: correcto.
- `GET /ventas/resumen-dia?fecha=2026-05-26&metodo_pago=Mixto`: correcto.
- `GET /ventas/resumen-dia?fecha=2020-01-01`: correcto, devuelve arreglos vacios y totales en cero.
- `GET /dashboard/`: correcto.
- OpenAPI muestra `/ventas/resumen-dia`, `/ventas/registrar-completa` y `/dashboard/`.

No se ejecuto `POST /ventas/registrar-completa` para evitar insertar ventas nuevas y descontar stock. Se verifico que el endpoint sigue registrado en OpenAPI.

## 8. Limitaciones

- El boton Ver muestra un modal simple con los datos reales disponibles en el listado. No se implemento todavia un endpoint de detalle completo de venta con todos los productos y pagos.
- No se hizo prueba visual automatizada con navegador; la verificacion frontend realizada fue `npm run build`.

## 9. Pendientes

Siguiente modulo de Fase 5:

- Recibos.

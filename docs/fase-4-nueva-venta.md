# Fase 4 - Conexion de NuevaVenta con Backend

## 1. Objetivo

Conectar la pantalla `NuevaVenta` del modulo de duena con el backend real de FastAPI y SQL Server para registrar ventas completas usando el endpoint:

`POST /ventas/registrar-completa`

La fase se enfoco en funcionalidad. No se hizo rediseno visual ni cambios grandes de estilos.

## 2. Rama usada

Los cambios se hicieron en la rama:

`CriscodexConnection`

## 3. Archivos modificados

- `frontend/src/pages/duena/NuevaVenta/NuevaVenta.jsx`
  - Se reemplazaron los productos quemados por productos reales desde `GET /productos/`.
  - Se cargan tipos de pago reales desde `GET /tipos-pago/`.
  - Se cargan departamentos desde `GET /departamentos/` para ventas con delivery.
  - Se adapto el carrito existente para usar `ID_Producto`, `Nombre`, `Stock`, `PrecioUnitario` y `Cantidad`.
  - Se quito la logica funcional de descuentos e IVA local.
  - Se calcula `TotalVenta = TotalProductos + CostoDelivery`.
  - Se envia la venta real a `POST /ventas/registrar-completa`.
  - Se muestran mensajes de exito y errores reales del backend.
  - Se refresca la lista de productos despues de registrar una venta.

- `frontend/src/pages/duena/NuevaVenta/NuevaVenta.css`
  - Se agregaron estilos minimos para mensajes de exito/error y botones deshabilitados.
  - Se permitio scroll vertical para que los campos funcionales de cliente/delivery no rompan la pantalla.
  - No se cambiaron colores, sidebar ni layout general.

- `frontend/src/api/api.js`
  - Se mejoro el manejo de errores para mostrar `detail` del backend.
  - Se agregaron helpers:
    - `obtenerProductos()`
    - `obtenerTiposPago()`
    - `obtenerDepartamentos()`
    - `registrarVentaCompleta(datos)`

- `backend/app/schemas/productos/producto_schema.py`
  - Se agrego `PrecioUnitario` a `ProductoResponse`.

- `backend/app/routers/productos/producto_router.py`
  - Se expone `PrecioUnitario` calculado para cada producto.
  - El precio se calcula desde `ProductoProveedor.PrecioDeCompra * 1.15`, siguiendo la regla que ya usaba el frontend en el modulo de Productos.

- `backend/app/schemas/ventas/venta_completa_schema.py`
  - `ID_Cliente` ahora es opcional.
  - Se agrego el objeto opcional `cliente` para crear cliente desde una venta.

- `backend/app/routers/ventas/venta_router.py`
  - Se agrego soporte para:
    - Cliente generico cuando no se envian datos personales.
    - Cliente con nombres/apellidos.
    - Cliente con delivery.
  - Se mantiene transaccion y rollback.
  - Se sigue usando `CostoDelivery` para detectar delivery.

## 4. Endpoints utilizados

- `GET /productos/`
  - Lista productos reales.
  - Ahora incluye `PrecioUnitario`.

- `GET /tipos-pago/`
  - Lista tipos de pago reales.

- `GET /departamentos/`
  - Lista departamentos para ventas con delivery.

- `POST /ventas/registrar-completa`
  - Registra venta, detalle, pagos, recibo y descuenta stock.

## 5. Reglas aplicadas

- No hay descuentos.
- No hay IVA separado.
- `TotalProductos = suma(Cantidad * PrecioUnitario)`.
- `TotalVenta = TotalProductos + CostoDelivery`.
- `CostoDelivery = null` significa sin delivery.
- `CostoDelivery > 0` significa delivery.
- No se usa `EsDelivery`.
- No se usa municipio.
- `ID_Empleado` temporal usado por frontend: `1`.
- El pago enviado tiene `Monto = TotalVenta`.
- Para Fase 4 se usa un solo pago por venta.

## 6. Manejo de cliente

Se eligio una solucion mixta y minima en backend para cubrir los tres casos de negocio desde la misma pantalla:

- Caso 1: cliente compra sin datos personales.
  - El frontend no envia `ID_Cliente` ni objeto `cliente`.
  - El backend busca o crea un cliente generico:
    - `Nombres = "Cliente"`
    - `Apellidos = "General"`
    - `Estado = "ACTIVO"`
  - Si debe crear direccion generica, usa departamento `ID_Departamento = 1` si existe; si no, usa el primer departamento disponible.

- Caso 2: cliente quiere nombre en recibo.
  - El frontend envia objeto `cliente` con `Nombres` y `Apellidos`.
  - El backend crea una direccion minima y un cliente activo antes de registrar la venta.

- Caso 3: delivery.
  - El frontend envia objeto `cliente` con:
    - `Nombres`
    - `Apellidos`
    - `NumeroTelefono`
    - `Direccion`
    - `ID_Departamento`
  - El backend valida esos campos y crea cliente/direccion antes de registrar la venta.

Deuda tecnica:

- La base de datos no tiene una marca formal para identificar cliente generico.
- A futuro conviene crear una columna o configuracion para cliente generico, o mantener un registro semilla controlado.

## 7. Problema del precio del producto

El endpoint `GET /productos/` no devolvia precio de venta porque la tabla `Productos` no tiene columna de precio.

Solucion aplicada:

- Se expuso `PrecioUnitario` en `ProductoResponse`.
- El valor se calcula en backend con:

`ProductoProveedor.PrecioDeCompra * 1.15`

Justificacion:

- El modulo frontend de Productos ya usaba esa misma regla para calcular precio de venta desde costo.
- La solucion evita quemar precios en React.
- El precio llega desde backend junto con cada producto.

Deuda tecnica:

- A futuro conviene guardar el precio de venta en una columna formal o en una tabla de precios para no depender de un calculo fijo.

## 8. Pruebas realizadas

- Backend
  - `python -m compileall -q app`: correcto.
  - Import de `app.main`: correcto.
  - `GET /db-test`: correcto.
  - `GET /productos/`: correcto; devuelve `PrecioUnitario`.
  - `GET /tipos-pago/`: correcto.
  - `POST /ventas/registrar-completa` con cliente generico: correcto.
  - `POST /ventas/registrar-completa` con nombre/apellido: correcto.
  - `POST /ventas/registrar-completa` con delivery: correcto.

- Frontend
  - `npm run build`: correcto.
  - Vite levanto en `http://127.0.0.1:5173/`.
  - `NuevaVenta` renderiza.
  - Carga productos reales.
  - Carga tipos de pago reales.
  - Permite agregar producto al carrito.
  - Registra venta desde UI.
  - Muestra mensaje de exito.
  - Limpia carrito.
  - Refresca stock.

Notas:

- Las pruebas se hicieron contra la base local de desarrollo y registraron ventas reales de prueba.

## 9. Pendientes para Fase 5

- Mejoras visuales.
- Responsive fino.
- Limpieza de datos quemados en otros modulos.
- Pulido visual de recibo.
- Impresion avanzada.
- Mejoras de experiencia de usuario.
- Definir formalmente el precio de venta en base de datos.
- Definir formalmente cliente generico en base de datos.

## 10. Notas para el equipo

La Fase 4 deja funcionando el flujo principal:

`React -> FastAPI -> SQL Server`

La pantalla `NuevaVenta` ya no depende de productos quemados y puede registrar ventas reales. Los cambios visuales fueron minimos y solo para soportar estados funcionales como exito/error, delivery y botones deshabilitados.

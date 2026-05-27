# Fase 5 - Nueva venta

## 1. Objetivo

Se corrigio y mejoro funcionalmente la pantalla NuevaVenta sin redisenar la interfaz. El cambio agrega pago mixto, corrige el boton de disminuir cantidad y agrega municipio al flujo de delivery usando datos reales del backend.

## 2. Archivos modificados

- `frontend/src/pages/duena/NuevaVenta/NuevaVenta.jsx`
  - Se agrego la opcion visual de pago mixto.
  - Se agregaron campos de monto en efectivo, monto en transferencia y referencia de transferencia.
  - Se corrigio el boton `-` para eliminar el producto cuando la cantidad es 1.
  - Se agrego municipio para delivery, dependiente del departamento seleccionado.
  - Se agregaron validaciones de pago mixto y municipio en delivery.
  - Se agrego busqueda y autocompletado de cliente existente para delivery.

- `frontend/src/pages/duena/NuevaVenta/NuevaVenta.css`
  - Se agregaron estilos minimos para el select deshabilitado y mensajes de ayuda del municipio.
  - Se agregaron estilos minimos para sugerencias de clientes existentes.

- `frontend/src/api/api.js`
  - Se agregaron helpers para municipios:
    - `obtenerMunicipios()`
    - `obtenerMunicipiosPorDepartamento(idDepartamento)`
  - Se agrego `buscarClientes(busqueda)`.

- `backend/app/routers/catalogos/municipio_router.py`
  - Se agrego `GET /municipios/departamento/{id_departamento}` para cargar municipios por departamento.

- `backend/app/schemas/ventas/venta_completa_schema.py`
  - El objeto `cliente` ahora acepta `ID_Municipio`.

- `backend/app/routers/ventas/venta_router.py`
  - Para ventas con delivery, ahora se exige `ID_Municipio`.
  - Se valida que el municipio exista.
  - Se valida que el municipio pertenezca al departamento indicado.

- `docs/sql/agregar-id-municipio-direccion-clientes.sql`
  - Script pendiente para agregar `ID_Municipio` a `Direccion_clientes`.
  - No fue ejecutado automaticamente.

## 3. Pago mixto

Mixto no es un `Tipo_pago` de base de datos. Es una opcion visual del frontend que se convierte en uno o dos pagos reales.

- `Tipo_pago = 1`: Efectivo.
- `Tipo_pago = 2`: Transferencia.

Si el usuario selecciona Mixto:

- Debe ingresar monto en efectivo y/o monto en transferencia.
- La suma debe coincidir exactamente con `TotalVenta`.
- Si un monto es `0`, no se envia en el array `pagos`.
- Si ambos montos son mayores que `0`, se envian ambos pagos.

Ejemplo:

```json
"pagos": [
  {
    "Tipo_pago": 1,
    "Monto": 100,
    "Referencia": null
  },
  {
    "Tipo_pago": 2,
    "Monto": 187.5,
    "Referencia": "TRX-001"
  }
]
```

## 4. Correccion del carrito

El boton `-` ahora funciona asi:

- Si la cantidad es mayor que `1`, resta una unidad.
- Si la cantidad es `1`, elimina el producto del carrito.
- No deja productos con cantidad `0`.
- No permite cantidades negativas.
- El boton `+` conserva la validacion de stock.

## 5. Municipio en delivery

Se agrego Municipio al flujo de delivery.

Flujo:

1. El usuario selecciona Departamento.
2. El frontend llama `GET /municipios/departamento/{id_departamento}`.
3. El select de Municipio se habilita con los municipios de ese departamento.
4. Al cambiar Departamento, se limpia el Municipio seleccionado.
5. No se permite registrar delivery sin Municipio.

Payload esperado para delivery:

```json
"cliente": {
  "Nombres": "Delivery",
  "Apellidos": "Prueba",
  "NumeroTelefono": "88880000",
  "Direccion": "Direccion exacta",
  "ID_Departamento": 1,
  "ID_Municipio": 1
}
```

El backend valida y guarda `ID_Municipio` en `Direccion_clientes`.

## 6. Autocompletado de cliente en delivery

En el flujo de delivery se agrego busqueda de clientes existentes.

Flujo:

1. El usuario selecciona `Delivery`.
2. Al escribir al menos 2 caracteres en `Nombres`, el frontend espera 300 ms y consulta clientes reales.
3. Se muestran hasta 5 sugerencias.
4. Al seleccionar una sugerencia, se autocompletan:
   - Nombres.
   - Apellidos.
   - Telefono.
   - Direccion.
   - Departamento.
   - Municipio.
5. El municipio se carga despues del departamento para respetar la dependencia real.

Endpoint usado:

```text
GET /clientes/buscar?busqueda=
```

Si el cliente seleccionado tiene datos completos de delivery y el usuario no modifica esos datos, NuevaVenta envia `ID_Cliente` en `POST /ventas/registrar-completa` para reutilizar el cliente existente y evitar duplicarlo.

Si el cliente existente esta incompleto o el usuario modifica los datos, se envia el objeto `cliente` como antes para que el backend cree el cliente/direccion segun la logica actual.

## 7. Endpoints utilizados o creados

- `GET /productos/`
- `GET /tipos-pago/`
- `GET /departamentos/`
- `GET /municipios/`
- `GET /municipios/departamento/{id_departamento}`
- `GET /clientes/buscar?busqueda=`
- `POST /ventas/registrar-completa`

## 8. Cambios backend

Cambios en municipios:

- Se creo el filtro real por departamento en `municipio_router.py`.

Cambios en venta completa:

- `ClienteVentaCompleta` acepta `ID_Municipio`.
- Si `CostoDelivery` tiene valor, el backend exige municipio.
- Se valida que el municipio exista.
- Se valida que `Municipio.ID_Departamento` coincida con `cliente.ID_Departamento`.
- Si no coincide, responde:

```json
{
  "detail": "El municipio seleccionado no pertenece al departamento indicado."
}
```

Cambios en clientes:

- Se agrego `GET /clientes/buscar`.
- Devuelve clientes reales con datos de direccion, departamento y municipio.
- La busqueda se limita a 5 resultados.
- Con busqueda de menos de 2 caracteres devuelve lista vacia.

Cambios en venta completa:

- Si se recibe `ID_Cliente`, el backend reutiliza ese cliente.
- Para delivery con cliente existente se valida que tenga direccion, departamento y municipio registrados.

## 9. Pruebas realizadas

- `backend/venv/Scripts/python.exe -m compileall -q backend/app`: correcto.
- `npm run build`: correcto.
- `GET /municipios/`: correcto, devuelve municipios reales.
- `GET /municipios/departamento/1`: correcto, devuelve municipios filtrados.
- `GET /dashboard/`: correcto, Dashboard sigue respondiendo.
- `GET /productos/`: correcto, productos siguen respondiendo con `PrecioUnitario`.
- `GET /tipos-pago/`: correcto, devuelve Efectivo y Transferencia.
- `openapi.json`: correcto, aparecen `/municipios/`, `/municipios/departamento/{id_departamento}`, `/dashboard/` y `/ventas/registrar-completa`.
- `GET /clientes/buscar?busqueda=Jea`: correcto, devuelve clientes reales.
- `GET /clientes/buscar?busqueda=a`: correcto, devuelve lista vacia por texto corto.
- `GET /clientes/buscar?busqueda=zzzinexistentecodex`: correcto, devuelve lista vacia.
- `POST /ventas/registrar-completa` sin municipio en delivery: correcto, devuelve 400.
- `POST /ventas/registrar-completa` con municipio de otro departamento: correcto, devuelve 400.

No se hicieron pruebas POST exitosas para no insertar ventas adicionales ni descontar stock durante esta fase.

## 10. Limitaciones o deuda tecnica

- Clientes antiguos pueden no tener `ID_Municipio` si fueron creados antes de agregar esa columna.
- Si un cliente existente esta incompleto, el autocompletado llena lo disponible y el usuario debe completar lo faltante.
- Para evitar sobrescribir datos automaticamente, NuevaVenta solo envia `ID_Cliente` cuando el cliente seleccionado tiene datos completos y no fueron modificados.

## 11. Pendientes

Siguiente modulo de Fase 5:

- Ventas.

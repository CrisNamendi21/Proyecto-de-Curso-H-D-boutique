# Mejora Nueva Venta: telefono delivery y pago mixto

## Que se cambio

Se reforzo el flujo de Nueva Venta para validar telefonos en ventas con delivery y automatizar el calculo del pago mixto entre efectivo y transferencia.

## Por que se cambio

La venta con delivery necesitaba bloquear telefonos fuera del rango movil esperado en Nicaragua. El pago mixto tambien requeria menos ingreso manual para que la persona que atiende registre la venta mas rapido y con menos errores.

## Archivos modificados

- `frontend/src/pages/duena/NuevaVenta/NuevaVenta.jsx`
- `frontend/src/pages/duena/NuevaVenta/NuevaVenta.css`
- `backend/app/routers/ventas/venta_router.py`
- `backend/app/schemas/ventas/venta_completa_schema.py`
- `docs/mejora-nueva-venta-telefono-pago-mixto.md`

## Validacion aplicada al telefono

La validacion aplica cuando la venta es con delivery:

- Solo se aceptan digitos.
- El input del frontend limita a 8 caracteres.
- El numero debe tener exactamente 8 digitos.
- El numero debe ser mayor que `70000000`.
- El numero debe ser menor que `90000000`.
- Rango valido: `70000001` a `89999999`.

El backend valida la misma regla en `POST /ventas/registrar-completa`, tanto si se envia un cliente nuevo como si se usa un cliente existente por ID.

## Logica aplicada al pago mixto

Cuando se selecciona pago mixto:

- Se muestran los campos de efectivo y transferencia.
- Si se escribe efectivo, transferencia se calcula como `total - efectivo`.
- Si se escribe transferencia, efectivo se calcula como `total - transferencia`.
- Se guarda cual fue el ultimo campo editado para recalcular el otro si cambia el total.
- Se usan centavos para comparar montos y evitar errores de coma flotante.
- Se bloquea la confirmacion si un monto supera el total, si ambos montos son cero o si la suma no coincide con el total.
- El payload envia efectivo y transferencia como pagos separados.

## Scripts SQL

No se creo script SQL.

No fue necesario porque `Clientes.NumeroTelefono` existe como `Unicode(20)`, suficiente para 8 digitos, y `PagosVenta` ya permite registrar varios pagos por venta.

## Pruebas realizadas

- `npm run lint` en frontend.
- `npm run build` en frontend.
- `venv\Scripts\python.exe -m compileall app` en backend.
- `venv\Scripts\python.exe -c "import app.main"` en backend.

## Pendientes o riesgos

- Ejecutar pruebas funcionales manuales con datos reales de productos, clientes y tipos de pago.
- Ejecutar validacion backend con entorno local configurado.
- Los warnings existentes de hooks en varios modulos no fueron modificados porque no forman parte de esta mejora.

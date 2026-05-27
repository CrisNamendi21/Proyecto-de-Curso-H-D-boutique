# Fase 5 - Empleados

## 1. Objetivo

Se conecto el modulo Empleados con datos reales del backend y SQL Server. Se quitaron datos quemados, se agrego departamento y municipio, se quito Estado del modal de creacion y se agregaron acciones para activar o desactivar empleados.

## 2. Archivos modificados

- `backend/app/models/empleados/direccion_empleado_model.py`
  - Se agrego `ID_Municipio` en la direccion de empleados.

- `backend/app/schemas/empleados/direccion_empleado_schema.py`
  - Se agrego `ID_Municipio` en create/update/response.

- `backend/app/schemas/empleados/empleado_schema.py`
  - Se agregaron schemas para resumen, listado, registro completo y cambio de estado.

- `backend/app/routers/empleados/direccion_empleado_router.py`
  - Se valida municipio y que pertenezca al departamento.

- `backend/app/routers/empleados/empleado_router.py`
  - Se agregaron endpoints de resumen, listado real, registro completo y cambio de estado.

- `frontend/src/api/api.js`
  - Se agregaron helpers de empleados.

- `frontend/src/pages/duena/Empleados/Empleados.jsx`
  - Se conecto el modulo con datos reales.
  - Se quitaron empleados quemados.
  - Se agregaron departamento y municipio.
  - Se quito estado del modal.
  - Se agregaron acciones Activar/Desactivar.

- `frontend/src/pages/duena/Empleados/Empleados.css`
  - Se agregaron estilos minimos para tabla ancha, mensajes y acciones.

## 3. Datos reales mostrados

La pantalla muestra:

- Empleados registrados.
- Activos.
- Inactivos.
- Colaboradores.
- Listado real de empleados.
- Departamento real.
- Municipio real.

## 4. Nuevo empleado

El modal ya no muestra Estado.

El empleado nuevo se crea como activo porque `FechaFin` queda en `NULL`.

El formulario usa:

- Nombres.
- Apellidos.
- Telefono.
- Correo profesional.
- Cargo.
- Fecha de ingreso.
- Departamento.
- Municipio.
- Direccion.

## 5. Acciones de estado

El listado permite:

- Desactivar empleado.
- Activar empleado.

No se eliminan empleados fisicamente desde la interfaz.

Regla aplicada:

- `FechaFin = NULL` significa `ACTIVO`.
- `FechaFin con fecha` significa `INACTIVO`.

## 6. Direccion de empleado

La direccion se guarda en la tabla especifica:

```text
Direccion_empleados
```

Campos usados:

- `Departamento`
- `ID_Municipio`
- `Direccion`

No se mezclan direcciones de clientes ni proveedores.

## 7. Endpoints usados o creados

- `GET /empleados/resumen`
- `GET /empleados/`
- `POST /empleados/registrar-completo`
- `PATCH /empleados/{id_empleado}/estado`
- `GET /departamentos/`
- `GET /municipios/departamento/{id_departamento}`

## 8. Pruebas realizadas

- `python -m compileall -q backend/app`: correcto.
- Import de `app.main`: correcto.
- `npm run build`: correcto.
- OpenAPI incluye `/empleados/resumen`.
- OpenAPI incluye `/empleados/registrar-completo`.
- OpenAPI incluye `/empleados/{id_empleado}/estado`.
- `GET /empleados/resumen`: correcto.
- `GET /empleados/`: correcto.
- `GET /empleados/?estado=ACTIVO`: correcto.
- `GET /departamentos/`: correcto.
- `GET /municipios/departamento/1`: correcto.
- `POST /empleados/registrar-completo`: correcto con empleado temporal.
- `PATCH /empleados/{id}/estado`: correcto con empleado temporal.

El empleado temporal creado durante la prueba fue eliminado al finalizar la verificacion.

## 9. Limitaciones

- El modelo no tiene columna `Estado`; el estado se deriva de `FechaFin`.
- Empleados creados antes de agregar `ID_Municipio` pueden mostrar municipio no registrado hasta que se actualice su direccion.

## 10. Pendientes

Fase 5 queda lista por modulos principales. Pendientes generales sugeridos:

- Revision final visual.
- Pruebas integrales con el equipo.
- Limpieza de deuda tecnica documentada.

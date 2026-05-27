# Fase 5 - Clientes

## 1. Objetivo

Se conecto el modulo Clientes con datos reales del backend y SQL Server. Se quitaron datos quemados y se elimino por completo `Tipo de cliente`, porque no existe en la base de datos.

## 2. Archivos modificados

- `backend/app/routers/clientes/cliente_router.py`
  - Se agregaron endpoints para resumen, listado filtrado, clientes recientes y registro completo.

- `backend/app/schemas/clientes/cliente_schema.py`
  - Se agregaron schemas para resumen, listado y registro completo.

- `frontend/src/api/api.js`
  - Se agregaron helpers para clientes.

- `frontend/src/pages/duena/Clientes/Clientes.jsx`
  - Se conecto la pantalla con datos reales.
  - Se quitaron clientes quemados.
  - Se quito todo uso de tipo de cliente.
  - Se conectaron departamentos reales.
  - Se agrego municipio dependiente del departamento.
  - Se agrego creacion real de cliente con direccion.

- `frontend/src/pages/duena/Clientes/Clientes.css`
  - Se ajusto la distribucion minima tras quitar tipo de cliente y resumen por tipos.
  - Se agregaron estados de mensaje y error.

## 3. Datos reales mostrados

La pantalla muestra:

- Clientes registrados.
- Clientes nuevos del mes.
- Clientes activos.
- Clientes con direccion.
- Listado real de clientes.
- Clientes recientes reales.

## 4. Eliminacion de tipo de cliente

`Tipo de cliente` ya no existe en la base de datos.

Se quito de:

- Filtros.
- Listado.
- Modal de creacion.
- Validaciones.
- Payload al backend.
- Resumen por Frecuentes, Nuevos, Ocasionales e Inactivos.

El backend no recibe ni devuelve `TipoCliente`.

## 5. Nuevo cliente

El formulario usa solo campos reales:

- Nombres.
- Apellidos.
- NumeroTelefono.
- Departamento.
- Municipio.
- Direccion.

El cliente nuevo se crea con:

```text
Estado = ACTIVO
```

## 6. Direccion de cliente

La direccion se guarda en la tabla especifica:

```text
Direccion_clientes
```

Campos reales usados:

- `ID_Departamento`
- `ID_Municipio`
- `Direccion`

Correccion de municipio:

- Se agrego soporte para `ID_Municipio` en `Direccion_clientes`.
- El formulario carga municipios segun el departamento seleccionado.
- El backend valida que el municipio exista y pertenezca al departamento.
- El listado muestra el municipio real cuando esta registrado.
- Clientes creados antes de esta correccion pueden mostrar municipio no registrado hasta que se actualice su direccion.

## 7. Endpoints usados o creados

- `GET /clientes/resumen`
- `GET /clientes/`
- `GET /clientes/recientes`
- `POST /clientes/registrar-completo`
- `GET /departamentos/`
- `GET /municipios/departamento/{id_departamento}`

## 8. Pruebas realizadas

- `python -m compileall -q backend/app`
- Import de `app.main`
- `GET /clientes/resumen`
- `GET /clientes/`
- `GET /clientes/recientes`
- `GET /clientes/?busqueda=1`
- `GET /departamentos/`
- `GET /municipios/departamento/1`
- OpenAPI incluye `/clientes/resumen`.
- OpenAPI incluye `/clientes/registrar-completo`.
- Se confirmo que `GET /clientes/` no devuelve `TipoCliente`.
- `npm run build`

No se creo un cliente real de prueba para evitar insertar datos en la base sin aprobacion del equipo.

## 9. Limitaciones

- `clientes_nuevos_mes` devuelve `0` porque la tabla `Clientes` no tiene fecha de registro.
- No se muestra correo ni notas porque no existen columnas equivalentes.
- Los clientes antiguos pueden no tener `ID_Municipio` porque fueron creados antes de agregar la columna.

## 10. Pendientes

Siguiente modulo de Fase 5:

- Empleados.

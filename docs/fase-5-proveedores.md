# Fase 5 - Proveedores

## 1. Objetivo

Se conecto el modulo Proveedores con datos reales del backend y SQL Server. Se eliminaron datos quemados, se agregaron tarjetas reales, listado real, departamento, municipio dependiente en el formulario y acciones para activar o desactivar proveedores.

## 2. Archivos modificados

- `backend/app/routers/proveedores/proveedor_router.py`
  - Se agregaron endpoints de resumen, listado enriquecido, registro completo y cambio de estado.

- `backend/app/schemas/proveedores/proveedor_schema.py`
  - Se agregaron schemas para resumen, listado, registro completo y cambio de estado.

- `frontend/src/api/api.js`
  - Se agregaron helpers para resumen, creacion completa y cambio de estado.

- `frontend/src/pages/duena/Proveedores/Proveedores.jsx`
  - Se conecto el modulo con datos reales.
  - Se quitaron proveedores quemados.
  - Se agregaron departamento y municipio en el modal.
  - Se quito estado del modal.
  - Se agregaron acciones activar/desactivar.

- `frontend/src/pages/duena/Proveedores/Proveedores.css`
  - Se agregaron estilos minimos para mensajes, estados y acciones.

## 3. Datos reales mostrados

La pantalla ahora muestra:

- Total de proveedores.
- Proveedores activos.
- Proveedores inactivos.
- Listado real de proveedores.
- Direccion desde `Direccion_proveedores`.
- Departamento desde `Departamentos`.
- Estado real del proveedor.

## 4. Nuevo proveedor

El modal ya no permite elegir estado.

El proveedor nuevo se crea como:

```text
Estado = ACTIVO
```

El formulario pide:

- Nombre del proveedor.
- Nombre de contacto.
- Apellido de contacto.
- Telefono.
- Correo profesional.
- Departamento.
- Municipio.
- Direccion exacta.

## 5. Acciones de estado

La tabla muestra:

- `Desactivar` cuando el proveedor esta `ACTIVO`.
- `Activar` cuando el proveedor esta `INACTIVO`.

No se eliminan proveedores fisicamente.

Endpoint usado:

```text
PATCH /proveedores/{id_proveedor}/estado
```

## 6. Direccion de proveedor

La direccion se guarda en la tabla especifica:

```text
Direccion_proveedores
```

Campos guardados:

- `Departamento`
- `ID_Municipio`
- `Direccion`

Correccion de municipio en listado:

- Se agrego soporte para `ID_Municipio` en `Direccion_proveedores`.
- `GET /proveedores/` ahora une `Direccion_proveedores` con `Municipios`.
- El listado obtiene el municipio real desde la direccion del proveedor.
- `No registrado` solo se muestra en frontend si el proveedor realmente no tiene municipio asociado.
- No se usan direcciones de clientes ni empleados para resolver este dato.

## 7. Categoria que suministra

El modelo `Proveedores` no tiene columna para categoria suministrada.

Por eso se quito la columna `Categoria` del listado de proveedores y tambien se dejo de devolver `CategoriaSuministra` como dato artificial en el endpoint de listado.

No se creo una columna nueva ni se reutilizo otra columna porque eso mezclaria responsabilidades y crearia datos falsos.

## 8. Endpoints usados o creados

- `GET /proveedores/resumen`
- `GET /proveedores/`
- `POST /proveedores/registrar-completo`
- `PATCH /proveedores/{id_proveedor}/estado`
- `GET /departamentos/`
- `GET /municipios/departamento/{id_departamento}`

## 9. Pruebas realizadas

- `python -m compileall -q backend/app`: correcto.
- Import de `app.main`: correcto.
- `npm run build`: correcto.
- `GET /proveedores/resumen`: correcto.
- `GET /proveedores/`: correcto.
- `GET /proveedores/`: ahora devuelve `ID_Municipio` y `Municipio` cuando la direccion del proveedor lo tiene registrado.
- `GET /departamentos/`: correcto.
- `GET /municipios/departamento/1`: correcto.
- OpenAPI incluye `POST /proveedores/registrar-completo`.
- OpenAPI incluye `PATCH /proveedores/{id_proveedor}/estado`.
- `PATCH /proveedores/999999/estado`: correcto, devuelve 404 para proveedor inexistente.
- Se verifico que `GET /compras/` y `GET /productos/` siguen respondiendo porque comparten `GET /proveedores/`.

No se creo un proveedor de prueba ni se cambio el estado de un proveedor real para no modificar la base de datos sin aprobacion del equipo.

## 10. Limitaciones

- Los proveedores registrados antes de agregar `ID_Municipio` pueden seguir mostrando municipio no registrado hasta que se actualice su direccion.
- La categoria suministrada no se muestra ni se guarda porque no existe columna equivalente en `Proveedores`.

## 11. Pendientes

Siguiente modulo de Fase 5:

- Clientes.

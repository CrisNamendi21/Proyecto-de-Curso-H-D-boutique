# Fase 5 - Inicio / Dashboard

## 1. Objetivo

Se conecto el Dashboard de la duena con datos reales del backend y se elimino la funcionalidad de Venta Flash. El Dashboard ahora consume un endpoint de FastAPI que calcula los indicadores desde SQL Server.

## 2. Archivos modificados

- `backend/app/main.py`
  - Se registro el nuevo router de Dashboard.

- `backend/app/routers/dashboard/dashboard_router.py`
  - Se creo `GET /dashboard/`.
  - Se calcularon ventas del dia, ventas del mes, stock bajo, productos vendidos del mes, ventas semanales y ultimas ventas.

- `backend/app/schemas/dashboard/dashboard_schema.py`
  - Se definio la estructura de respuesta del Dashboard.

- `frontend/src/api/api.js`
  - Se agrego el helper `obtenerDashboard()`.

- `frontend/src/pages/duena/Dashboard/DashboardDuena.jsx`
  - Se quito el boton `+ VENTA FLASH`.
  - Se elimino el estado, funciones y modal de Venta Flash.
  - Se reemplazaron datos quemados por datos reales de `GET /dashboard/`.
  - Se agregaron estados de carga, error y datos vacios.
  - Se cambio el formato monetario a `C$`.

- `frontend/src/pages/duena/Dashboard/DashboardDuena.css`
  - Se eliminaron estilos exclusivos de Venta Flash.
  - Se agregaron estilos minimos para carga, error y tabla vacia.

## 3. Endpoint creado

`GET /dashboard/`

Ejemplo real de respuesta:

```json
{
  "resumen": {
    "ventas_dia": 3559.5,
    "cantidad_ventas_dia": 12,
    "ventas_mes": 7689.5,
    "cantidad_ventas_mes": 18,
    "stock_bajo": 1,
    "productos_vendidos_mes": 26
  },
  "ventas_semanales": [
    { "dia": "Lun", "total": 350.0 },
    { "dia": "Mar", "total": 3559.5 },
    { "dia": "Mié", "total": 0.0 },
    { "dia": "Jue", "total": 0.0 },
    { "dia": "Vie", "total": 0.0 },
    { "dia": "Sáb", "total": 0.0 },
    { "dia": "Dom", "total": 0.0 }
  ],
  "ultimas_ventas": [
    {
      "id_venta": 20,
      "fecha": "2026-05-26",
      "cliente": "Cliente General",
      "producto": "Camisa casual para hombre",
      "total": 287.5
    }
  ]
}
```

## 4. Datos reales mostrados

El Dashboard ahora muestra:

- Ventas del dia.
- Cantidad de ventas del dia.
- Ventas del mes.
- Cantidad de ventas del mes.
- Stock bajo.
- Productos vendidos del mes.
- Ventas semanales.
- Ultimas ventas registradas.

## 5. Regla de calculo

- El backend calcula.
- El frontend muestra.
- Ventas del dia se calcula con `Ventas.FechaVenta` igual a la fecha actual.
- Ventas del mes se calcula desde el primer dia del mes hasta antes del siguiente mes.
- Stock bajo usa temporalmente `Productos.Stock <= 5`.
- Productos vendidos del mes suma `DetalleVenta.Cantidad` de ventas del mes actual.
- Ventas semanales devuelven lunes a domingo, con total `0` cuando no hay ventas.
- Ultimas ventas muestra las ultimas 5 ventas. Si una venta tiene varios productos, se muestra el primer producto con el indicador `+ N más`.

## 6. Cambios removidos

Se quito:

- Boton `+ VENTA FLASH`.
- Modal de Venta Flash.
- Estados y funciones de Venta Flash.
- Datos quemados de tarjetas, grafico semanal y tabla de ultimas ventas.
- Estilos CSS exclusivos de Venta Flash.

## 7. Pruebas realizadas

- `backend/venv/Scripts/python.exe -m compileall -q backend/app`: correcto.
- `npm run build`: correcto.
- `GET /dashboard/`: correcto, devuelve `resumen`, `ventas_semanales` y `ultimas_ventas`.
- `GET /productos/`: correcto, sigue respondiendo con productos y `PrecioUnitario`.
- `GET /tipos-pago/`: correcto, sigue respondiendo con Efectivo y Transferencia.
- `openapi.json`: correcto, aparecen `/dashboard/`, `/productos/`, `/tipos-pago/` y `/ventas/registrar-completa`.
- `npm run dev`: Vite levanto correctamente en `http://127.0.0.1:5173/`.

No se ejecuto un `POST /ventas/registrar-completa` durante esta fase para evitar insertar una venta adicional en la base de datos. Se verifico que el endpoint sigue registrado en Swagger/OpenAPI.

No se pudo hacer verificacion automatizada con navegador porque el entorno no tiene Playwright instalado. La compilacion de Vite si confirma que los imports y JSX compilan correctamente.

## 8. Pendientes

- Pulir NuevaVenta visualmente.
- Conectar y limpiar el modulo Ventas.
- Conectar y limpiar Recibos.
- Conectar Producto / Inventario.
- Conectar Compras.
- Conectar Proveedores.
- Conectar Clientes.
- Conectar Empleados.
- Mejorar responsive mas adelante sin romper la funcionalidad.

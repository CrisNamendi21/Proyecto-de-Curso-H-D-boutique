# Fase 5 - Recibos

## 1. Objetivo

Se conecto la pantalla Recibos con datos reales del backend, se eliminaron datos quemados, se quito el impuesto del 15% y se reemplazo la impresion directa por descarga de PDF.

## 2. Archivos modificados

- `backend/app/routers/ventas/recibo_router.py`
  - Se agregaron endpoints reales para resumen, listado, ultimo recibo, detalle y PDF.
  - Se detecta medio de pago real desde `PagosVenta`.
  - Se usa `ID_Recibo` oficial para numerar recibos.

- `backend/app/schemas/ventas/recibo_detalle_schema.py`
  - Se agregaron schemas para resumen, listado, detalle y productos de recibo.

- `frontend/src/api/api.js`
  - Se agregaron helpers para recibos y descarga de PDF.

- `frontend/src/pages/duena/Recibos/Recibos.jsx`
  - Se reemplazaron datos quemados por datos reales.
  - La vista previa muestra el ultimo recibo emitido real.
  - El listado y el detalle usan datos reales.
  - Se elimino el boton Imprimir.
  - Los botones PDF descargan el recibo como archivo.
  - Se quito impuesto/IVA de vista previa y detalle.

- `frontend/src/pages/duena/Recibos/Recibos.css`
  - Se agregaron estados de carga/error.
  - Se eliminaron reglas de impresion directa.
  - Se mantuvo el estilo visual general.

## 3. Endpoints creados o usados

- `GET /recibos/resumen`
- `GET /recibos/`
- `GET /recibos/ultimo`
- `GET /recibos/{id_recibo}`
- `GET /recibos/{id_recibo}/pdf`

Ejemplo de detalle:

```json
{
  "ID_Recibo": 17,
  "numero_recibo": "17",
  "fecha": "2026-05-26 07:57 PM",
  "cliente": "Armando Aleman",
  "vendedor": "María Fernanda López Duarte",
  "medio_pago": "Mixto",
  "total": 824.5,
  "estado": "Emitido",
  "productos": [
    {
      "producto": "Pantalón jeans para hombre",
      "cantidad": 1,
      "precio": 483.0,
      "subtotal": 483.0
    }
  ]
}
```

## 4. Datos reales mostrados

- Recibos de hoy.
- Recibos del mes.
- Monto facturado del mes.
- Listado de recibos.
- Vista previa del ultimo recibo real.
- Detalle completo con productos reales.

## 5. PDF

El PDF se genera desde backend con `GET /recibos/{id_recibo}/pdf`.

El endpoint devuelve `application/pdf` con `Content-Disposition: attachment`, por lo que el navegador descarga el archivo segun su configuracion de Descargas.

Botones que descargan PDF:

- `Exportar PDF` en la vista previa.
- `Exportar PDF` en el modal de detalle.

Ya no se usa `window.print()` ni dialogo de impresion.

## Mejora visual del PDF

El PDF se mejoro visualmente en `backend/app/routers/ventas/recibo_router.py`, dentro de la funcion `_generar_pdf_recibo`.

No se agregaron dependencias nuevas. Se mantiene la generacion manual de PDF con instrucciones PDF basicas para evitar instalar librerias adicionales.

El nuevo PDF incluye:

- Encabezado con `H&D Boutique` en color rosa.
- Subtitulo `Recibo de venta`.
- Caja visual con el numero de recibo usando el `ID_Recibo` oficial tal como sale de la base de datos, por ejemplo `17`.
- Fecha y hora del recibo.
- Datos principales: cliente, vendedor, medio de pago y estado.
- Tabla de productos con producto, cantidad, precio unitario y subtotal.
- Total real destacado en una caja.
- Mensaje final de agradecimiento.

El PDF no muestra:

- Impuesto.
- IVA.
- Descuentos.
- Subtotales artificiales calculados desde impuesto.

El total mostrado es el total real de la venta/recibo. La descarga sigue usando el endpoint real `GET /recibos/{id_recibo}/pdf` y el navegador descarga el archivo como `recibo-{id}.pdf`.

## 6. Cambios removidos

Se quito:

- Datos quemados.
- Impuesto 15%.
- Calculos de IVA/impuesto.
- Boton Imprimir de la vista previa.
- Accion `window.print()`.
- Referencias visuales a subtotal artificial e impuesto.

## 7. Reglas aplicadas

- No hay descuentos.
- No hay impuesto/IVA separado.
- El total mostrado es el total real registrado en la venta.
- En pantalla, el numero de recibo se muestra como el `ID_Recibo` oficial de la base de datos.
- En el PDF, el `ID_Recibo` oficial se presenta como numero real de base de datos, por ejemplo `17`.
- Mixto se detecta cuando un recibo/venta tiene mas de un tipo de pago asociado.
- Backend calcula y arma los datos; frontend muestra.

## 8. Pruebas realizadas

- `backend/venv/Scripts/python.exe -m compileall -q backend/app`: correcto.
- Import de `app.main`: correcto.
- `npm run build`: correcto.
- `GET /recibos/resumen`: correcto.
- `GET /recibos/`: correcto.
- `GET /recibos/?fecha=2026-05-26`: correcto.
- `GET /recibos/?fecha=2026-05-26&busqueda=cliente&medio_pago=Efectivo`: correcto.
- `GET /recibos/ultimo`: correcto.
- `GET /recibos/17`: correcto.
- `GET /recibos/17/pdf`: correcto, responde `application/pdf` y `attachment; filename="recibo-17.pdf"`.
- `GET /dashboard/`: correcto.
- `GET /ventas/resumen-dia`: correcto.
- OpenAPI muestra `/ventas/registrar-completa`.

No se ejecuto `POST /ventas/registrar-completa` para evitar insertar ventas nuevas y descontar stock.

## 9. Limitaciones

- El PDF es sencillo y funcional. No usa librerias externas ni diseno avanzado.
- No se hizo prueba automatizada con navegador; la verificacion frontend fue `npm run build`.

## 10. Pendientes

Siguiente modulo de Fase 5:

- Producto / Inventario.

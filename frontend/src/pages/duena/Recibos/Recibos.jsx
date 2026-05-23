import { useMemo, useState } from "react";
import "./Recibos.css";

function Recibos() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const recibosIniciales = [
    {
      id: 1,
      numero: "R-00125",
      fecha: "2026-05-22",
      hora: "10:45 AM",
      cliente: "Andrea Castillo",
      vendedor: "Dueña",
      metodoPago: "Efectivo",
      subtotal: 1086.96,
      impuesto: 163.04,
      total: 1250,
      estado: "Emitido",
      productos: [
        { nombre: "Blusa Manga Larga", cantidad: 1, precio: 950 },
        { nombre: "Top Básico", cantidad: 1, precio: 300 },
      ],
    },
    {
      id: 2,
      numero: "R-00124",
      fecha: "2026-05-22",
      hora: "10:15 AM",
      cliente: "Valeria Soto",
      vendedor: "Dueña",
      metodoPago: "Transferencia",
      subtotal: 826.09,
      impuesto: 123.91,
      total: 950,
      estado: "Emitido",
      productos: [
        { nombre: "Camisa Oversize", cantidad: 1, precio: 850 },
        { nombre: "Accesorio", cantidad: 1, precio: 100 },
      ],
    },
    {
      id: 3,
      numero: "R-00123",
      fecha: "2026-05-22",
      hora: "09:50 AM",
      cliente: "Gabriela Ruiz",
      vendedor: "Dueña",
      metodoPago: "Efectivo + Transferencia",
      subtotal: 1260.87,
      impuesto: 189.13,
      total: 1450,
      estado: "Emitido",
      productos: [
        { nombre: "Vestido Floral", cantidad: 1, precio: 1250 },
        { nombre: "Falda Plisada", cantidad: 1, precio: 200 },
      ],
    },
    {
      id: 4,
      numero: "R-00122",
      fecha: "2026-05-21",
      hora: "04:30 PM",
      cliente: "Alejandra Díaz",
      vendedor: "Dueña",
      metodoPago: "Efectivo",
      subtotal: 634.78,
      impuesto: 95.22,
      total: 730,
      estado: "Emitido",
      productos: [
        { nombre: "Short Denim", cantidad: 1, precio: 650 },
        { nombre: "Accesorio", cantidad: 1, precio: 80 },
      ],
    },
    {
      id: 5,
      numero: "R-00121",
      fecha: "2026-05-21",
      hora: "03:10 PM",
      cliente: "Paola Rojas",
      vendedor: "Dueña",
      metodoPago: "Efectivo",
      subtotal: 478.26,
      impuesto: 71.74,
      total: 550,
      estado: "Anulado",
      productos: [
        { nombre: "Top Básico", cantidad: 1, precio: 450 },
        { nombre: "Accesorio", cantidad: 1, precio: 100 },
      ],
    },
    {
      id: 6,
      numero: "R-00120",
      fecha: "2026-05-20",
      hora: "01:20 PM",
      cliente: "Cliente general",
      vendedor: "Dueña",
      metodoPago: "Transferencia",
      subtotal: 2869.57,
      impuesto: 430.43,
      total: 3300,
      estado: "Emitido",
      productos: [
        { nombre: "Pantalón Palazzo", cantidad: 2, precio: 1100 },
        { nombre: "Bolso Beige", cantidad: 1, precio: 1100 },
      ],
    },
  ];

  const [busqueda, setBusqueda] = useState("");
  const [fecha, setFecha] = useState(obtenerFechaActual());
  const [metodoPago, setMetodoPago] = useState("");
  const [reciboSeleccionado, setReciboSeleccionado] = useState(
    recibosIniciales[0]
  );
  const [mostrarModalRecibo, setMostrarModalRecibo] = useState(false);

  const formatearDinero = (valor) => {
    return `C$ ${Number(valor).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const calcularSubtotalProducto = (producto) => {
    return producto.precio * producto.cantidad;
  };

  const recibosFiltrados = recibosIniciales.filter((recibo) => {
    const coincideBusqueda =
      recibo.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      recibo.numero.toLowerCase().includes(busqueda.toLowerCase());

    const coincideFecha = fecha === "" || recibo.fecha === fecha;
    const coincideMetodo =
      metodoPago === "" || recibo.metodoPago === metodoPago;

    return coincideBusqueda && coincideFecha && coincideMetodo;
  });

  const resumen = useMemo(() => {
    const recibosEmitidos = recibosIniciales.filter(
      (recibo) => recibo.estado === "Emitido"
    );

    const recibosHoy = recibosEmitidos.filter(
      (recibo) => recibo.fecha === obtenerFechaActual()
    );

    const totalFacturado = recibosEmitidos.reduce(
      (total, recibo) => total + recibo.total,
      0
    );

    return {
      recibosHoy: recibosHoy.length,
      recibosMes: recibosEmitidos.length,
      totalFacturado,
    };
  }, []);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFecha("");
    setMetodoPago("");
  };

  const obtenerClaseEstado = (estado) => {
    if (estado === "Emitido") return "estado emitido";
    return "estado anulado";
  };

  const abrirReciboCompleto = (recibo) => {
    setReciboSeleccionado(recibo);
    setMostrarModalRecibo(true);
  };

  const imprimirRecibo = () => {
    setMostrarModalRecibo(true);

    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <section className="recibos-page">
      <div className="recibos-header">
        <h1>Recibos</h1>
      </div>

      <div className="recibos-cards">
        <article className="recibo-card">
          <div>
            <span>Recibos de hoy</span>
            <strong>{resumen.recibosHoy}</strong>
          </div>
          <div className="card-icono">▤</div>
        </article>

        <article className="recibo-card">
          <div>
            <span>Recibos del mes</span>
            <strong>{resumen.recibosMes}</strong>
          </div>
          <div className="card-icono">▥</div>
        </article>

        <article className="recibo-card">
          <div>
            <span>Monto facturado</span>
            <strong>{formatearDinero(resumen.totalFacturado)}</strong>
          </div>
          <div className="card-icono">C$</div>
        </article>
      </div>

      <div className="recibos-filtros">
        <div className="filtro-grupo">
          <label>Buscar recibo</label>
          <input
            type="text"
            placeholder="Buscar por cliente o número"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filtro-grupo">
          <label>Fecha</label>
          <input
            type="date"
            value={fecha}
            max={obtenerFechaActual()}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="filtro-grupo">
          <label>Medio de pago</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
          >
            <option value="">Todos los medios</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Efectivo + Transferencia">
              Efectivo + Transferencia
            </option>
          </select>
        </div>

        <div className="acciones-filtros">
          <button type="button">Filtrar</button>
          <button type="button" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
      </div>

      <div className="recibos-contenido">
        <article className="panel-recibos listado-recibos">
          <div className="panel-titulo">
            <h2>Listado de recibos</h2>
          </div>

          <div className="tabla-recibos">
            <table>
              <thead>
                <tr>
                  <th>No. recibo</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {recibosFiltrados.map((recibo) => (
                  <tr key={recibo.id}>
                    <td>{recibo.numero}</td>
                    <td>
                      {recibo.fecha} {recibo.hora}
                    </td>
                    <td>{recibo.cliente}</td>
                    <td>{recibo.vendedor}</td>
                    <td>{recibo.metodoPago}</td>
                    <td>{formatearDinero(recibo.total)}</td>
                    <td>
                      <span className={obtenerClaseEstado(recibo.estado)}>
                        {recibo.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-ver"
                        onClick={() => abrirReciboCompleto(recibo)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}

                {recibosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="8" className="sin-datos">
                      No se encontraron recibos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="tabla-footer">
            <span>
              Mostrando {recibosFiltrados.length} de {recibosIniciales.length}{" "}
              recibos
            </span>
          </div>
        </article>

        <article className="panel-recibos vista-previa">
          <div className="panel-titulo">
            <h2>Vista previa del recibo</h2>
          </div>

          {reciboSeleccionado ? (
            <div className="vista-previa-contenido">
              <div className="recibo-miniatura">
                <h3>H&D Boutique</h3>
                <p>Recibo de venta</p>

                <div className="lineas-miniatura">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="mini-total">
                  <span>Total</span>
                  <strong>{formatearDinero(reciboSeleccionado.total)}</strong>
                </div>
              </div>

              <div className="datos-recibo">
                <div>
                  <span>Cliente:</span>
                  <strong>{reciboSeleccionado.cliente}</strong>
                </div>

                <div>
                  <span>Fecha:</span>
                  <strong>
                    {reciboSeleccionado.fecha} {reciboSeleccionado.hora}
                  </strong>
                </div>

                <div>
                  <span>Vendedor:</span>
                  <strong>{reciboSeleccionado.vendedor}</strong>
                </div>
              </div>

              <div className="totales-recibo">
                <div>
                  <span>Medio de pago:</span>
                  <strong>{reciboSeleccionado.metodoPago}</strong>
                </div>

                <div>
                  <span>Subtotal:</span>
                  <strong>{formatearDinero(reciboSeleccionado.subtotal)}</strong>
                </div>

                <div>
                  <span>Impuesto (15%):</span>
                  <strong>{formatearDinero(reciboSeleccionado.impuesto)}</strong>
                </div>

                <div className="total-final">
                  <span>Total:</span>
                  <strong>{formatearDinero(reciboSeleccionado.total)}</strong>
                </div>
              </div>

              <div className="acciones-recibo">
                <button
                  type="button"
                  onClick={() => abrirReciboCompleto(reciboSeleccionado)}
                >
                  Ver
                </button>
                <button type="button" onClick={imprimirRecibo}>
                  Imprimir
                </button>
                <button type="button">Exportar PDF</button>
              </div>
            </div>
          ) : (
            <p className="sin-datos">Selecciona un recibo para ver el detalle.</p>
          )}
        </article>
      </div>

      {mostrarModalRecibo && reciboSeleccionado && (
        <div className="modal-recibo-fondo">
          <div className="modal-recibo">
            <div className="modal-recibo-header no-imprimir">
              <h2>Detalle completo del recibo</h2>
              <button
                type="button"
                onClick={() => setMostrarModalRecibo(false)}
              >
                ×
              </button>
            </div>

            <div className="recibo-completo" id="recibo-imprimible">
              <div className="recibo-completo-encabezado">
                <div>
                  <h2>H&D Boutique</h2>
                  <p>Recibo de venta</p>
                </div>

                <div className="recibo-numero">
                  <span>No. recibo</span>
                  <strong>{reciboSeleccionado.numero}</strong>
                </div>
              </div>

              <div className="recibo-completo-info">
                <div>
                  <span>Cliente</span>
                  <strong>{reciboSeleccionado.cliente}</strong>
                </div>

                <div>
                  <span>Fecha</span>
                  <strong>
                    {reciboSeleccionado.fecha} {reciboSeleccionado.hora}
                  </strong>
                </div>

                <div>
                  <span>Vendedor</span>
                  <strong>{reciboSeleccionado.vendedor}</strong>
                </div>

                <div>
                  <span>Medio de pago</span>
                  <strong>{reciboSeleccionado.metodoPago}</strong>
                </div>

                <div>
                  <span>Estado</span>
                  <strong>{reciboSeleccionado.estado}</strong>
                </div>
              </div>

              <div className="recibo-productos">
                <h3>Productos comprados</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reciboSeleccionado.productos.map((producto, index) => (
                      <tr key={`${producto.nombre}-${index}`}>
                        <td>{producto.nombre}</td>
                        <td>{producto.cantidad}</td>
                        <td>{formatearDinero(producto.precio)}</td>
                        <td>
                          {formatearDinero(calcularSubtotalProducto(producto))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="recibo-completo-totales">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatearDinero(reciboSeleccionado.subtotal)}</strong>
                </div>

                <div>
                  <span>Impuesto (15%)</span>
                  <strong>{formatearDinero(reciboSeleccionado.impuesto)}</strong>
                </div>

                <div className="recibo-total-final">
                  <span>Total</span>
                  <strong>{formatearDinero(reciboSeleccionado.total)}</strong>
                </div>
              </div>

              <div className="recibo-pie">
                <p>Gracias por su compra.</p>
                <span>Este comprobante fue generado por H&D Boutique.</span>
              </div>
            </div>

            <div className="modal-recibo-acciones no-imprimir">
              <button
                type="button"
                className="btn-modal-secundario"
                onClick={() => setMostrarModalRecibo(false)}
              >
                Cerrar
              </button>

              <button
                type="button"
                className="btn-modal-principal"
                onClick={imprimirRecibo}
              >
                Imprimir recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Recibos;
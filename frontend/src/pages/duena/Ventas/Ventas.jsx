import { useMemo, useState } from "react";
import "./Ventas.css";

function Ventas() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const ventasIniciales = [
    {
      id: 1,
      hora: "09:15 AM",
      numero: "V-00125",
      cliente: "María López",
      metodoPago: "Efectivo",
      total: 1250,
      productos: 3,
      estado: "Completada",
    },
    {
      id: 2,
      hora: "09:45 AM",
      numero: "V-00126",
      cliente: "Ana Martínez",
      metodoPago: "Transferencia",
      total: 850,
      productos: 2,
      estado: "Completada",
    },
    {
      id: 3,
      hora: "10:20 AM",
      numero: "V-00127",
      cliente: "Cliente general",
      metodoPago: "Efectivo",
      total: 620,
      productos: 1,
      estado: "Completada",
    },
    {
      id: 4,
      hora: "11:05 AM",
      numero: "V-00128",
      cliente: "Daniela Herrera",
      metodoPago: "Transferencia",
      total: 2980,
      productos: 4,
      estado: "Completada",
    },
    {
      id: 5,
      hora: "11:50 AM",
      numero: "V-00129",
      cliente: "Cliente general",
      metodoPago: "Efectivo",
      total: 450,
      productos: 1,
      estado: "Completada",
    },
    {
      id: 6,
      hora: "12:30 PM",
      numero: "V-00130",
      cliente: "María López",
      metodoPago: "Efectivo + Transferencia",
      total: 1750,
      productos: 2,
      estado: "Completada",
    },
    {
      id: 7,
      hora: "01:15 PM",
      numero: "V-00131",
      cliente: "Ana Martínez",
      metodoPago: "Efectivo",
      total: 980,
      productos: 2,
      estado: "Completada",
    },
    {
      id: 8,
      hora: "02:00 PM",
      numero: "V-00132",
      cliente: "Cliente general",
      metodoPago: "Transferencia",
      total: 3250,
      productos: 5,
      estado: "Completada",
    },
  ];

  const productosMasVendidos = [
    {
      id: 1,
      producto: "Vestido Floral",
      cantidad: 18,
      total: 5400,
    },
    {
      id: 2,
      producto: "Blusa Manga Larga",
      cantidad: 15,
      total: 3750,
    },
    {
      id: 3,
      producto: "Pantalón Palazzo",
      cantidad: 12,
      total: 3240,
    },
    {
      id: 4,
      producto: "Camisa Oversize",
      cantidad: 10,
      total: 2800,
    },
    {
      id: 5,
      producto: "Falda Plisada",
      cantidad: 8,
      total: 1920,
    },
  ];

  const ventasPorHora = [
    { hora: "8 AM", monto: 2000 },
    { hora: "9 AM", monto: 5100 },
    { hora: "10 AM", monto: 4300 },
    { hora: "11 AM", monto: 6500 },
    { hora: "12 PM", monto: 8200 },
    { hora: "1 PM", monto: 7100 },
    { hora: "2 PM", monto: 5000 },
    { hora: "3 PM", monto: 4000 },
    { hora: "4 PM", monto: 2900 },
    { hora: "5 PM", monto: 1900 },
    { hora: "6 PM", monto: 900 },
  ];

  const [fecha, setFecha] = useState(obtenerFechaActual());
  const [cliente, setCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const formatearDinero = (valor) => {
    return `C$ ${Number(valor).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const ventasFiltradas = ventasIniciales.filter((venta) => {
    const coincideCliente = venta.cliente
      .toLowerCase()
      .includes(cliente.toLowerCase());

    const coincideMetodo =
      metodoPago === "" || venta.metodoPago === metodoPago;

    return coincideCliente && coincideMetodo;
  });

  const resumen = useMemo(() => {
    const totalVentas = ventasFiltradas.reduce(
      (total, venta) => total + venta.total,
      0
    );

    const totalProductos = ventasFiltradas.reduce(
      (total, venta) => total + venta.productos,
      0
    );

    const efectivo = ventasFiltradas
      .filter((venta) => venta.metodoPago === "Efectivo")
      .reduce((total, venta) => total + venta.total, 0);

    const transferencia = ventasFiltradas
      .filter((venta) => venta.metodoPago === "Transferencia")
      .reduce((total, venta) => total + venta.total, 0);

    const mixto = ventasFiltradas
      .filter((venta) => venta.metodoPago === "Efectivo + Transferencia")
      .reduce((total, venta) => total + venta.total, 0);

    return {
      totalVentas,
      totalProductos,
      efectivo,
      transferencia,
      mixto,
      transacciones: ventasFiltradas.length,
    };
  }, [ventasFiltradas]);

  const limpiarFiltros = () => {
    setFecha(obtenerFechaActual());
    setCliente("");
    setMetodoPago("");
  };

  const obtenerClaseMetodo = (metodo) => {
    if (metodo === "Efectivo") return "metodo efectivo";
    if (metodo === "Transferencia") return "metodo transferencia";
    return "metodo mixto";
  };

  const calcularPorcentaje = (monto) => {
    if (resumen.totalVentas === 0) return 0;
    return Math.round((monto / resumen.totalVentas) * 100);
  };

  const maxVentaHora = Math.max(...ventasPorHora.map((item) => item.monto));

  return (
    <section className="ventas-page">
      <div className="ventas-header">
        <h1>Ventas del día</h1>
      </div>

      <div className="ventas-resumen-cards">
        <article className="venta-card">
          <div>
            <span>Ventas de hoy</span>
            <strong>{formatearDinero(resumen.totalVentas)}</strong>
          </div>
          <div className="card-icono">🛒</div>
        </article>

        <article className="venta-card">
          <div>
            <span>Transacciones</span>
            <strong>{resumen.transacciones}</strong>
          </div>
          <div className="card-icono">▤</div>
        </article>

        <article className="venta-card">
          <div>
            <span>Productos vendidos</span>
            <strong>{resumen.totalProductos}</strong>
          </div>
          <div className="card-icono">👕</div>
        </article>
      </div>

      <div className="ventas-filtros">
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
          <label>Cliente</label>
          <input
            type="text"
            placeholder="Buscar cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
        </div>

        <div className="filtro-grupo">
          <label>Método de pago</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
          >
            <option value="">Todos los métodos</option>
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

      <div className="ventas-contenido">
        <div className="ventas-columna-izquierda">
          <article className="panel-ventas listado-ventas">
            <div className="panel-titulo">
              <h2>Listado de ventas</h2>
            </div>

            <div className="tabla-ventas-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>No. venta</th>
                    <th>Cliente</th>
                    <th>Método de pago</th>
                    <th>Total</th>
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {ventasFiltradas.map((venta) => (
                    <tr key={venta.id}>
                      <td>{venta.hora}</td>
                      <td>{venta.numero}</td>
                      <td>{venta.cliente}</td>
                      <td>
                        <span className={obtenerClaseMetodo(venta.metodoPago)}>
                          {venta.metodoPago}
                        </span>
                      </td>
                      <td>{formatearDinero(venta.total)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-detalle"
                          onClick={() => setVentaSeleccionada(venta)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}

                  {ventasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="6" className="sin-datos">
                        No se encontraron ventas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel-ventas productos-vendidos">
            <div className="panel-titulo">
              <h2>Productos más vendidos hoy</h2>
            </div>

            <div className="tabla-productos-vendidos">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Total vendido</th>
                  </tr>
                </thead>

                <tbody>
                  {productosMasVendidos.map((producto) => (
                    <tr key={producto.id}>
                      <td>
                        <span className="punto-producto"></span>
                        {producto.producto}
                      </td>
                      <td>{producto.cantidad}</td>
                      <td>{formatearDinero(producto.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <div className="ventas-columna-derecha">
          <article className="panel-ventas metodo-pago-panel">
            <div className="panel-titulo">
              <h2>Ventas por método de pago</h2>
            </div>

            <div className="metodo-pago-contenido">
              <div className="grafico-dona">
                <div className="dona-centro">
                  <span>Total</span>
                  <strong>{formatearDinero(resumen.totalVentas)}</strong>
                </div>
              </div>

              <div className="lista-metodos">
                <div className="metodo-item">
                  <span className="circulo efectivo-bg"></span>
                  <p>Efectivo</p>
                  <strong>
                    {formatearDinero(resumen.efectivo)} (
                    {calcularPorcentaje(resumen.efectivo)}%)
                  </strong>
                </div>

                <div className="metodo-item">
                  <span className="circulo transferencia-bg"></span>
                  <p>Transferencia</p>
                  <strong>
                    {formatearDinero(resumen.transferencia)} (
                    {calcularPorcentaje(resumen.transferencia)}%)
                  </strong>
                </div>

                <div className="metodo-item">
                  <span className="circulo mixto-bg"></span>
                  <p>Mixto</p>
                  <strong>
                    {formatearDinero(resumen.mixto)} (
                    {calcularPorcentaje(resumen.mixto)}%)
                  </strong>
                </div>
              </div>
            </div>
          </article>

          <article className="panel-ventas ventas-hora-panel">
            <div className="panel-titulo">
              <h2>Ventas por hora</h2>
            </div>

            <div className="barras-hora">
              {ventasPorHora.map((item) => (
                <div className="barra-item" key={item.hora}>
                  <div
                    className="barra"
                    style={{
                      height: `${(item.monto / maxVentaHora) * 110}px`,
                    }}
                  ></div>
                  <span>{item.hora}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel-ventas resumen-dia-panel">
            <div className="panel-titulo">
              <h2>Resumen del día</h2>
            </div>

            <div className="resumen-dia-linea">
              <span>Total ventas</span>
              <strong>{formatearDinero(resumen.totalVentas)}</strong>
            </div>

            <div className="resumen-dia-linea">
              <span>Total descuentos</span>
              <strong>- {formatearDinero(950)}</strong>
            </div>

            <div className="resumen-dia-linea">
              <span>Total impuestos</span>
              <strong>+ {formatearDinero(2050)}</strong>
            </div>

            <div className="resumen-dia-total">
              <span>Total neto</span>
              <strong>{formatearDinero(resumen.totalVentas + 2050 - 950)}</strong>
            </div>
          </article>
        </div>
      </div>

      {ventaSeleccionada && (
        <div className="modal-ventas-fondo">
          <div className="modal-ventas">
            <div className="modal-header">
              <h2>Detalle de venta</h2>
              <button type="button" onClick={() => setVentaSeleccionada(null)}>
                ×
              </button>
            </div>

            <div className="detalle-grid">
              <div>
                <span>No. venta</span>
                <strong>{ventaSeleccionada.numero}</strong>
              </div>

              <div>
                <span>Cliente</span>
                <strong>{ventaSeleccionada.cliente}</strong>
              </div>

              <div>
                <span>Hora</span>
                <strong>{ventaSeleccionada.hora}</strong>
              </div>

              <div>
                <span>Método de pago</span>
                <strong>{ventaSeleccionada.metodoPago}</strong>
              </div>

              <div>
                <span>Productos</span>
                <strong>{ventaSeleccionada.productos}</strong>
              </div>

              <div>
                <span>Total</span>
                <strong>{formatearDinero(ventaSeleccionada.total)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="btn-cerrar-modal"
              onClick={() => setVentaSeleccionada(null)}
            >
              Cerrar detalle
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Ventas;
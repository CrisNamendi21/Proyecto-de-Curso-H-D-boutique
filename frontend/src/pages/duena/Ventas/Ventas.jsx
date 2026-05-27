import { useEffect, useMemo, useState } from "react";
import { obtenerResumenVentasDia } from "../../../api/api";
import "./Ventas.css";

const datosIniciales = {
  resumen: {
    ventas_hoy: 0,
    transacciones: 0,
    productos_vendidos: 0,
    total_neto: 0,
  },
  ventas: [],
  productos_mas_vendidos: [],
  metodos_pago: [
    { metodo: "Efectivo", total: 0 },
    { metodo: "Transferencia", total: 0 },
    { metodo: "Mixto", total: 0 },
  ],
};

function Ventas() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const [filtros, setFiltros] = useState({
    fecha: obtenerFechaActual(),
    cliente: "",
    metodoPago: "Todos",
  });
  const [datosVentas, setDatosVentas] = useState(datosIniciales);
  const [cargandoVentas, setCargandoVentas] = useState(true);
  const [errorVentas, setErrorVentas] = useState("");
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const formatearDinero = (valor) => {
    return `C$ ${Number(valor || 0).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const obtenerNumeroVentaReal = (venta) => {
    return venta?.id_venta ?? venta?.ID_Venta ?? "Sin ID";
  };

  const cargarVentas = async (filtrosConsulta = filtros) => {
    if (!filtrosConsulta.fecha) {
      setErrorVentas("Debes seleccionar una fecha.");
      return;
    }

    setCargandoVentas(true);
    setErrorVentas("");

    try {
      const respuesta = await obtenerResumenVentasDia({
        fecha: filtrosConsulta.fecha,
        cliente: filtrosConsulta.cliente.trim(),
        metodoPago: filtrosConsulta.metodoPago,
      });

      setDatosVentas({
        resumen: respuesta?.resumen || datosIniciales.resumen,
        ventas: respuesta?.ventas || [],
        productos_mas_vendidos: respuesta?.productos_mas_vendidos || [],
        metodos_pago: respuesta?.metodos_pago || datosIniciales.metodos_pago,
      });
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      setDatosVentas(datosIniciales);
      setErrorVentas(
        error.message || "No se pudieron cargar las ventas del día."
      );
    } finally {
      setCargandoVentas(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  const manejarFiltro = (campo) => (e) => {
    setFiltros((filtrosActuales) => ({
      ...filtrosActuales,
      [campo]: e.target.value,
    }));
  };

  const aplicarFiltros = () => {
    cargarVentas(filtros);
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      fecha: obtenerFechaActual(),
      cliente: "",
      metodoPago: "Todos",
    };

    setFiltros(filtrosLimpios);
    cargarVentas(filtrosLimpios);
  };

  const obtenerClaseMetodo = (metodo) => {
    if (metodo === "Efectivo") return "metodo efectivo";
    if (metodo === "Transferencia") return "metodo transferencia";
    return "metodo mixto";
  };

  const totalMetodos = useMemo(() => {
    return datosVentas.metodos_pago.reduce(
      (total, metodo) => total + Number(metodo.total || 0),
      0
    );
  }, [datosVentas.metodos_pago]);

  const calcularPorcentaje = (monto) => {
    if (totalMetodos === 0) return 0;
    return Math.round((Number(monto || 0) / totalMetodos) * 100);
  };

  const obtenerTotalMetodo = (nombreMetodo) => {
    return (
      datosVentas.metodos_pago.find(
        (metodo) => metodo.metodo === nombreMetodo
      )?.total || 0
    );
  };

  const efectivoDeg =
    totalMetodos > 0 ? (obtenerTotalMetodo("Efectivo") / totalMetodos) * 360 : 0;
  const transferenciaDeg =
    totalMetodos > 0
      ? (obtenerTotalMetodo("Transferencia") / totalMetodos) * 360
      : 0;
  const fondoDona =
    totalMetodos > 0
      ? `conic-gradient(#88d47f 0deg ${efectivoDeg}deg, #8ec5ff ${efectivoDeg}deg ${
          efectivoDeg + transferenciaDeg
        }deg, #c49af4 ${efectivoDeg + transferenciaDeg}deg 360deg)`
      : "conic-gradient(#f4d9e5 0deg 360deg)";

  return (
    <section className="ventas-page">
      <div className="ventas-header">
        <h1>Ventas del día</h1>
      </div>

      {cargandoVentas && (
        <p className="estado-ventas">Cargando ventas del día...</p>
      )}

      {errorVentas && <p className="error-ventas">{errorVentas}</p>}

      <div className="ventas-resumen-cards">
        <article className="venta-card">
          <div>
            <span>Ventas de hoy</span>
            <strong>{formatearDinero(datosVentas.resumen.ventas_hoy)}</strong>
          </div>
          <div className="card-icono">▣</div>
        </article>

        <article className="venta-card">
          <div>
            <span>Transacciones</span>
            <strong>{datosVentas.resumen.transacciones}</strong>
          </div>
          <div className="card-icono">▤</div>
        </article>

        <article className="venta-card">
          <div>
            <span>Productos vendidos</span>
            <strong>{datosVentas.resumen.productos_vendidos}</strong>
          </div>
          <div className="card-icono">□</div>
        </article>
      </div>

      <div className="ventas-filtros">
        <div className="filtro-grupo">
          <label>Fecha</label>
          <input
            type="date"
            value={filtros.fecha}
            max={obtenerFechaActual()}
            onChange={manejarFiltro("fecha")}
          />
        </div>

        <div className="filtro-grupo">
          <label>Cliente</label>
          <input
            type="text"
            placeholder="Buscar cliente"
            value={filtros.cliente}
            onChange={manejarFiltro("cliente")}
          />
        </div>

        <div className="filtro-grupo">
          <label>Método de pago</label>
          <select
            value={filtros.metodoPago}
            onChange={manejarFiltro("metodoPago")}
          >
            <option value="Todos">Todos los métodos</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Mixto">Mixto</option>
          </select>
        </div>

        <div className="acciones-filtros">
          <button type="button" onClick={aplicarFiltros}>
            Filtrar
          </button>
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
                  {datosVentas.ventas.map((venta) => (
                    <tr key={venta.id_venta}>
                      <td>{venta.hora}</td>
                      <td>{obtenerNumeroVentaReal(venta)}</td>
                      <td>{venta.cliente}</td>
                      <td>
                        <span className={obtenerClaseMetodo(venta.metodo_pago)}>
                          {venta.metodo_pago}
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

                  {!cargandoVentas && datosVentas.ventas.length === 0 && (
                    <tr>
                      <td colSpan="6" className="sin-datos">
                        No hay ventas registradas para esta fecha.
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
                  {datosVentas.productos_mas_vendidos.map((producto) => (
                    <tr key={producto.producto}>
                      <td>
                        <span className="punto-producto"></span>
                        {producto.producto}
                      </td>
                      <td>{producto.cantidad}</td>
                      <td>{formatearDinero(producto.total_vendido)}</td>
                    </tr>
                  ))}

                  {!cargandoVentas &&
                    datosVentas.productos_mas_vendidos.length === 0 && (
                      <tr>
                        <td colSpan="3" className="sin-datos">
                          No hay productos vendidos para esta fecha.
                        </td>
                      </tr>
                    )}
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
              <div className="grafico-dona" style={{ background: fondoDona }}>
                <div className="dona-centro">
                  <span>Total</span>
                  <strong>{formatearDinero(totalMetodos)}</strong>
                </div>
              </div>

              <div className="lista-metodos">
                {["Efectivo", "Transferencia", "Mixto"].map((metodo) => {
                  const totalMetodo = obtenerTotalMetodo(metodo);

                  return (
                    <div className="metodo-item" key={metodo}>
                      <span
                        className={`circulo ${metodo.toLowerCase()}-bg`}
                      ></span>
                      <p>{metodo}</p>
                      <strong>
                        {formatearDinero(totalMetodo)} (
                        {calcularPorcentaje(totalMetodo)}%)
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="panel-ventas resumen-dia-panel">
            <div className="panel-titulo">
              <h2>Resumen del día</h2>
            </div>

            <div className="resumen-dia-linea">
              <span>Total ventas</span>
              <strong>{formatearDinero(datosVentas.resumen.ventas_hoy)}</strong>
            </div>

            <div className="resumen-dia-total">
              <span>Total neto</span>
              <strong>{formatearDinero(datosVentas.resumen.total_neto)}</strong>
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
                <strong>{obtenerNumeroVentaReal(ventaSeleccionada)}</strong>
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
                <strong>{ventaSeleccionada.metodo_pago}</strong>
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

            <div className="detalle-productos-venta">
              <h3>Productos vendidos</h3>

              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Talla</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {(ventaSeleccionada.productos_detalle || []).map(
                    (producto) => (
                      <tr key={`${producto.producto}-${producto.subtotal}`}>
                        <td>{producto.producto}</td>
                        <td>{producto.talla || "Sin talla"}</td>
                        <td>{producto.cantidad}</td>
                        <td>{formatearDinero(producto.precio)}</td>
                        <td>{formatearDinero(producto.subtotal)}</td>
                      </tr>
                    )
                  )}

                  {(!ventaSeleccionada.productos_detalle ||
                    ventaSeleccionada.productos_detalle.length === 0) && (
                    <tr>
                      <td colSpan="5" className="sin-datos">
                        No hay productos registrados para esta venta.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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

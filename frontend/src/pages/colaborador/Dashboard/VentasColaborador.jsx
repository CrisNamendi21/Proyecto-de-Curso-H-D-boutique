import { useEffect, useMemo, useState } from "react";
import { obtenerVentasDiaColaborador } from "../../../api/api";
import "../../duena/Ventas/Ventas.css";

const datosIniciales = {
  resumen: {
    ventas_hoy: 0,
    transacciones: 0,
  },
  ventas: [],
  metodos_pago: [
    { metodo: "Efectivo", total: 0 },
    { metodo: "Transferencia", total: 0 },
    { metodo: "Mixto", total: 0 },
  ],
};

function VentasColaborador() {
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

  const cargarVentas = async (filtrosConsulta = filtros) => {
    setCargandoVentas(true);
    setErrorVentas("");

    try {
      const respuesta = await obtenerVentasDiaColaborador({
        fecha: filtrosConsulta.fecha,
        cliente: filtrosConsulta.cliente.trim(),
        metodoPago: filtrosConsulta.metodoPago,
      });

      setDatosVentas({
        resumen: respuesta?.resumen || datosIniciales.resumen,
        ventas: respuesta?.ventas || [],
        metodos_pago: respuesta?.metodos_pago || datosIniciales.metodos_pago,
      });
    } catch (error) {
      setDatosVentas(datosIniciales);
      setErrorVentas(error.message || "No se pudieron cargar tus ventas.");
    } finally {
      setCargandoVentas(false);
    }
  };

  useEffect(() => {
    const temporizador = setTimeout(() => cargarVentas(filtros), 300);
    return () => clearTimeout(temporizador);
  }, [filtros]);

  const manejarFiltro = (campo) => (e) => {
    setFiltros((filtrosActuales) => ({
      ...filtrosActuales,
      [campo]: e.target.value,
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha: obtenerFechaActual(),
      cliente: "",
      metodoPago: "Todos",
    });
  };

  const obtenerClaseMetodo = (metodo) => {
    if (metodo === "Efectivo") return "metodo efectivo";
    if (metodo === "Transferencia") return "metodo transferencia";
    return "metodo mixto";
  };

  const obtenerNumeroVentaReal = (venta) => {
    return venta?.id_venta ?? venta?.ID_Venta ?? "Sin ID";
  };

  const totalMetodos = useMemo(() => {
    return datosVentas.metodos_pago.reduce(
      (total, metodo) => total + Number(metodo.total || 0),
      0
    );
  }, [datosVentas.metodos_pago]);

  return (
    <section className="ventas-page">
      <div className="ventas-header">
        <h1>Ventas del día</h1>
      </div>

      {cargandoVentas && <p className="estado-ventas">Cargando tus ventas...</p>}
      {errorVentas && <p className="error-ventas">{errorVentas}</p>}

      <div className="ventas-resumen-cards colaborador-ventas-resumen">
        <article className="venta-card">
          <div>
            <span>Total vendido</span>
            <strong>{formatearDinero(datosVentas.resumen.ventas_hoy)}</strong>
          </div>
          <div className="card-icono"></div>
        </article>

        <article className="venta-card">
          <div>
            <span>Ventas realizadas</span>
            <strong>{datosVentas.resumen.transacciones}</strong>
          </div>
          <div className="card-icono"></div>
        </article>

        <article className="venta-card">
          <div>
            <span>Total por métodos</span>
            <strong>{formatearDinero(totalMetodos)}</strong>
          </div>
          <div className="card-icono"></div>
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
          <select value={filtros.metodoPago} onChange={manejarFiltro("metodoPago")}>
            <option value="Todos">Todos los métodos</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Mixto">Mixto</option>
          </select>
        </div>

        <div className="acciones-filtros">
          <button type="button" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
      </div>

      <article className="panel-ventas listado-ventas colaborador-listado-ventas">
        <div className="panel-titulo">
          <h2>Mis ventas</h2>
        </div>

        <div className="tabla-ventas-contenedor">
          <table>
            <thead>
              <tr>
                <th>No. venta</th>
                <th>Fecha / hora</th>
                <th>Cliente</th>
                <th>Método de pago</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {datosVentas.ventas.map((venta) => (
                <tr key={venta.id_venta}>
                  <td>{obtenerNumeroVentaReal(venta)}</td>
                  <td>
                    {venta.fecha} {venta.hora}
                  </td>
                  <td>{venta.cliente}</td>
                  <td>
                    <span className={obtenerClaseMetodo(venta.metodo_pago)}>
                      {venta.metodo_pago}
                    </span>
                  </td>
                  <td>{formatearDinero(venta.total)}</td>
                  <td>
                    <span className="estado emitido">{venta.estado}</span>
                  </td>
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
                  <td colSpan="7" className="sin-datos">
                    No hay ventas propias para esta fecha.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

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
                <span>Fecha / hora</span>
                <strong>
                  {ventaSeleccionada.fecha} {ventaSeleccionada.hora}
                </strong>
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

export default VentasColaborador;

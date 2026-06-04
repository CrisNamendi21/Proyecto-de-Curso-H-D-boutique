import { useEffect, useState } from "react";
import {
  descargarPdfReciboColaborador,
  obtenerDetalleReciboColaborador,
  obtenerRecibosColaborador,
} from "../../../api/api";
import "../../duena/Recibos/Recibos.css";

function RecibosColaborador() {
  const [recibos, setRecibos] = useState([]);
  const [reciboSeleccionado, setReciboSeleccionado] = useState(null);
  const [mostrarModalRecibo, setMostrarModalRecibo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState({
    busqueda: "",
    medioPago: "Todos",
  });

  const formatearDinero = (valor) => {
    return `C$ ${Number(valor || 0).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    const cargarRecibos = async () => {
      setCargando(true);
      setError("");

      try {
        // Este endpoint solo devuelve recibos del empleado autenticado.
        const respuesta = await obtenerRecibosColaborador(filtros);
        setRecibos(respuesta || []);
      } catch (errorCarga) {
        setRecibos([]);
        setError(errorCarga.message || "No se pudieron cargar tus recibos.");
      } finally {
        setCargando(false);
      }
    };

    const temporizador = setTimeout(cargarRecibos, 300);
    return () => clearTimeout(temporizador);
  }, [filtros]);

  const manejarFiltro = (campo) => (e) => {
    setFiltros((actuales) => ({
      ...actuales,
      [campo]: e.target.value,
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      medioPago: "Todos",
    });
  };

  const abrirReciboCompleto = async (idRecibo) => {
    try {
      const detalle = await obtenerDetalleReciboColaborador(idRecibo);
      setReciboSeleccionado(detalle);
      setMostrarModalRecibo(true);
    } catch (errorDetalle) {
      setError(errorDetalle.message || "No se pudo cargar el recibo.");
    }
  };

  const exportarPdf = async (idRecibo) => {
    try {
      // El PDF se pide por la ruta de colaborador para respetar el filtro de propiedad.
      await descargarPdfReciboColaborador(idRecibo);
    } catch (errorPdf) {
      setError(errorPdf.message || "No se pudo descargar el PDF.");
    }
  };

  return (
    <section className="recibos-page">
      <div className="recibos-header">
        <h1>Mis recibos</h1>
      </div>

      {cargando && <p className="estado-recibos">Cargando tus recibos...</p>}
      {error && <p className="error-recibos">{error}</p>}

      <div className="recibos-filtros">
        <div className="filtro-grupo">
          <label>Buscar recibo</label>
          <input
            type="text"
            placeholder="Cliente, No. recibo o No. venta"
            value={filtros.busqueda}
            onChange={manejarFiltro("busqueda")}
          />
        </div>

        <div className="filtro-grupo">
          <label>Medio de pago</label>
          <select
            value={filtros.medioPago}
            onChange={manejarFiltro("medioPago")}
          >
            <option value="Todos">Todos los medios</option>
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

      <article className="panel-recibos listado-recibos">
        <div className="panel-titulo">
          <h2>Recibos generados por mí</h2>
        </div>

        <div className="tabla-recibos">
          <table>
            <thead>
              <tr>
                <th>No. recibo</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Pago</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {recibos.map((recibo) => (
                <tr key={recibo.ID_Recibo}>
                  <td>{recibo.numero_recibo}</td>
                  <td>{recibo.fecha}</td>
                  <td>{recibo.cliente}</td>
                  <td>{recibo.medio_pago}</td>
                  <td>{formatearDinero(recibo.total)}</td>
                  <td>
                    <span className="estado emitido">{recibo.estado}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-ver"
                      onClick={() => abrirReciboCompleto(recibo.ID_Recibo)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}

              {!cargando && recibos.length === 0 && (
                <tr>
                  <td colSpan="7" className="sin-datos">
                    No se encontraron recibos propios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {mostrarModalRecibo && reciboSeleccionado && (
        <div className="modal-recibo-fondo">
          <div className="modal-recibo">
            <div className="modal-recibo-header">
              <h2>Detalle de mi recibo</h2>
              <button
                type="button"
                onClick={() => setMostrarModalRecibo(false)}
              >
                ×
              </button>
            </div>

            <div className="recibo-completo">
              <div className="recibo-completo-encabezado">
                <div>
                  <h2>H&D Boutique</h2>
                  <p>Recibo de venta</p>
                </div>

                <div className="recibo-numero">
                  <span>No. recibo</span>
                  <strong>{reciboSeleccionado.numero_recibo}</strong>
                </div>
              </div>

              <div className="recibo-completo-info">
                <div>
                  <span>Cliente</span>
                  <strong>{reciboSeleccionado.cliente}</strong>
                </div>

                <div>
                  <span>Fecha</span>
                  <strong>{reciboSeleccionado.fecha}</strong>
                </div>

                <div>
                  <span>Medio de pago</span>
                  <strong>{reciboSeleccionado.medio_pago}</strong>
                </div>
              </div>

              <div className="recibo-productos">
                <h3>Productos comprados</h3>

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
                    {reciboSeleccionado.productos.map((producto) => (
                      <tr key={`${producto.producto}-${producto.subtotal}`}>
                        <td>{producto.producto}</td>
                        <td>{producto.talla || "Sin talla"}</td>
                        <td>{producto.cantidad}</td>
                        <td>{formatearDinero(producto.precio)}</td>
                        <td>{formatearDinero(producto.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="recibo-completo-totales">
                <div>
                  <span>Total productos</span>
                  <strong>{formatearDinero(reciboSeleccionado.total_productos)}</strong>
                </div>

                <div>
                  <span>Delivery</span>
                  <strong>{formatearDinero(reciboSeleccionado.delivery || 0)}</strong>
                </div>

                <div className="recibo-total-final">
                  <span>Total</span>
                  <strong>{formatearDinero(reciboSeleccionado.total)}</strong>
                </div>
              </div>
            </div>

            <div className="modal-recibo-acciones">
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
                onClick={() => exportarPdf(reciboSeleccionado.ID_Recibo)}
              >
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default RecibosColaborador;

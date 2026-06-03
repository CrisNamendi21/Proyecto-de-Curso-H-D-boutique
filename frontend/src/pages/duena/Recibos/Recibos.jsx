import { useEffect, useState } from "react";
import {
  descargarPdfRecibo,
  obtenerDetalleRecibo,
  obtenerRecibos,
  obtenerResumenRecibos,
  obtenerUltimoRecibo,
} from "../../../api/api";
import "./Recibos.css";

const resumenInicial = {
  recibos_hoy: 0,
  recibos_mes: 0,
  monto_facturado: 0,
};

function Recibos() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const [resumenRecibos, setResumenRecibos] = useState(resumenInicial);
  const [recibos, setRecibos] = useState([]);
  const [ultimoRecibo, setUltimoRecibo] = useState(null);
  const [reciboSeleccionado, setReciboSeleccionado] = useState(null);
  const [mostrarModalRecibo, setMostrarModalRecibo] = useState(false);
  const [cargandoRecibos, setCargandoRecibos] = useState(true);
  const [errorRecibos, setErrorRecibos] = useState("");
  const [filtros, setFiltros] = useState({
    busqueda: "",
    fecha: "",
    medioPago: "Todos",
  });

  const formatearDinero = (valor) => {
    return `C$ ${Number(valor || 0).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const cargarResumenYUltimo = async () => {
    const [resumenRespuesta, ultimoRespuesta] = await Promise.allSettled([
      obtenerResumenRecibos(),
      obtenerUltimoRecibo(),
    ]);

    if (resumenRespuesta.status === "fulfilled") {
      setResumenRecibos(resumenRespuesta.value);
    } else {
      setResumenRecibos(resumenInicial);
    }

    if (ultimoRespuesta.status === "fulfilled") {
      setUltimoRecibo(ultimoRespuesta.value);
    } else {
      setUltimoRecibo(null);
    }
  };

  const cargarRecibos = async (filtrosConsulta = filtros) => {
    setCargandoRecibos(true);
    setErrorRecibos("");

    try {
      // Los filtros se envian al backend para buscar tambien fuera del listado visible.
      const recibosRespuesta = await obtenerRecibos({
        fecha: filtrosConsulta.fecha,
        busqueda: filtrosConsulta.busqueda.trim(),
        medioPago: filtrosConsulta.medioPago,
      });

      setRecibos(recibosRespuesta || []);
      await cargarResumenYUltimo();
    } catch (error) {
      console.error("Error al cargar recibos:", error);
      setRecibos([]);
      setErrorRecibos(
        error.message || "No se pudieron cargar los recibos."
      );
    } finally {
      setCargandoRecibos(false);
    }
  };

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarRecibos(filtros);
    }, 300);

    return () => clearTimeout(temporizador);
  }, [filtros]);

  const manejarFiltro = (campo) => (e) => {
    setFiltros((filtrosActuales) => ({
      ...filtrosActuales,
      [campo]: e.target.value,
    }));
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      busqueda: "",
      fecha: "",
      medioPago: "Todos",
    };

    setFiltros(filtrosLimpios);
  };

  const obtenerClaseEstado = (estado) => {
    if (estado === "Emitido") return "estado emitido";
    return "estado anulado";
  };

  const abrirReciboCompleto = async (idRecibo) => {
    setErrorRecibos("");

    try {
      const detalle = await obtenerDetalleRecibo(idRecibo);
      setReciboSeleccionado(detalle);
      setMostrarModalRecibo(true);
    } catch (error) {
      setErrorRecibos(
        error.message || "No se pudo cargar el detalle del recibo."
      );
    }
  };

  const exportarPdf = async (idRecibo) => {
    if (!idRecibo) {
      setErrorRecibos("No hay un recibo seleccionado para exportar.");
      return;
    }

    try {
      setErrorRecibos("");
      // El archivo final lo genera el backend para conservar el mismo formato de recibo.
      await descargarPdfRecibo(idRecibo);
    } catch (error) {
      setErrorRecibos(
        error.message || "No se pudo descargar el PDF del recibo."
      );
    }
  };

  return (
    <section className="recibos-page">
      <div className="recibos-header">
        <h1>Recibos</h1>
      </div>

      {cargandoRecibos && (
        <p className="estado-recibos">Cargando recibos...</p>
      )}

      {errorRecibos && <p className="error-recibos">{errorRecibos}</p>}

      <div className="recibos-cards">
        <article className="recibo-card">
          <div>
            <span>Recibos de hoy</span>
            <strong>{resumenRecibos.recibos_hoy}</strong>
          </div>
          <div className="card-icono">▤</div>
        </article>

        <article className="recibo-card">
          <div>
            <span>Recibos del mes</span>
            <strong>{resumenRecibos.recibos_mes}</strong>
          </div>
          <div className="card-icono">▥</div>
        </article>

        <article className="recibo-card">
          <div>
            <span>Monto facturado</span>
            <strong>{formatearDinero(resumenRecibos.monto_facturado)}</strong>
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
            value={filtros.busqueda}
            onChange={manejarFiltro("busqueda")}
          />
        </div>

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
                {recibos.map((recibo) => (
                  <tr key={recibo.ID_Recibo}>
                    <td>{recibo.numero_recibo}</td>
                    <td>{recibo.fecha}</td>
                    <td>{recibo.cliente}</td>
                    <td>{recibo.vendedor}</td>
                    <td>{recibo.medio_pago}</td>
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
                        onClick={() => abrirReciboCompleto(recibo.ID_Recibo)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}

                {!cargandoRecibos && recibos.length === 0 && (
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
              Mostrando {recibos.length} de {recibos.length} recibos
            </span>
          </div>
        </article>

        <article className="panel-recibos vista-previa">
          <div className="panel-titulo">
            <h2>Vista previa del recibo</h2>
          </div>

          {ultimoRecibo ? (
            <div className="vista-previa-contenido">
              <div className="recibo-miniatura">
                <h3>H&D Boutique</h3>
                <p>{ultimoRecibo.numero_recibo}</p>

                <div className="lineas-miniatura">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="mini-total">
                  <span>Total</span>
                  <strong>{formatearDinero(ultimoRecibo.total)}</strong>
                </div>
              </div>

              <div className="datos-recibo">
                <div>
                  <span>Cliente:</span>
                  <strong>{ultimoRecibo.cliente}</strong>
                </div>

                <div>
                  <span>Fecha:</span>
                  <strong>{ultimoRecibo.fecha}</strong>
                </div>

                <div>
                  <span>Vendedor:</span>
                  <strong>{ultimoRecibo.vendedor}</strong>
                </div>
              </div>

              <div className="totales-recibo">
                <div>
                  <span>Medio de pago:</span>
                  <strong>{ultimoRecibo.medio_pago}</strong>
                </div>

                <div>
                  <span>Estado:</span>
                  <strong>{ultimoRecibo.estado}</strong>
                </div>

                <div>
                  <span>Delivery:</span>
                  <strong>{formatearDinero(ultimoRecibo.delivery || 0)}</strong>
                </div>

                <div className="total-final">
                  <span>Total:</span>
                  <strong>{formatearDinero(ultimoRecibo.total)}</strong>
                </div>
              </div>

              <div className="acciones-recibo">
                <button
                  type="button"
                  onClick={() => abrirReciboCompleto(ultimoRecibo.ID_Recibo)}
                >
                  Ver
                </button>
                <button
                  type="button"
                  onClick={() => exportarPdf(ultimoRecibo.ID_Recibo)}
                >
                  Exportar PDF
                </button>
              </div>
            </div>
          ) : (
            <p className="sin-datos">No hay recibos emitidos todavía.</p>
          )}
        </article>
      </div>

      {mostrarModalRecibo && reciboSeleccionado && (
        <div className="modal-recibo-fondo">
          <div className="modal-recibo">
            <div className="modal-recibo-header">
              <h2>Detalle completo del recibo</h2>
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
                  <span>Vendedor</span>
                  <strong>{reciboSeleccionado.vendedor}</strong>
                </div>

                <div>
                  <span>Medio de pago</span>
                  <strong>{reciboSeleccionado.medio_pago}</strong>
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
                  <strong>
                    {formatearDinero(reciboSeleccionado.total_productos)}
                  </strong>
                </div>

                <div>
                  <span>Delivery</span>
                  <strong>
                    {formatearDinero(reciboSeleccionado.delivery || 0)}
                  </strong>
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

export default Recibos;

import { useEffect, useMemo, useState } from "react";
import {
  obtenerCompras,
  obtenerDetallePerdida,
  obtenerPerdidas,
  obtenerProductosInventario,
  obtenerProveedores,
  obtenerResumenPerdidas,
  registrarPerdida,
} from "../../../api/api";
import "./Perdidas.css";

const resumenInicial = {
  perdidas_mes: 0,
  unidades_perdidas_mes: 0,
  costo_perdidas_mes: 0,
  perdidas_totales: 0,
};

function Perdidas() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const crearFormularioVacio = () => ({
    fecha: obtenerFechaActual(),
    proveedor: "",
    compra: "",
    productoSeleccionado: "",
    cantidad: "",
    costoUnitario: "",
    motivo: "",
    observacion: "",
    productos: [],
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [perdidas, setPerdidas] = useState([]);
  const [resumen, setResumen] = useState(resumenInicial);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [nuevaPerdida, setNuevaPerdida] = useState(crearFormularioVacio);
  const [filtros, setFiltros] = useState({
    fecha: "",
    producto: "",
    proveedor: "",
    motivo: "",
  });
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [error, setError] = useState("");
  const [errorHistorial, setErrorHistorial] = useState("");
  const [errorCatalogos, setErrorCatalogos] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [erroresModal, setErroresModal] = useState([]);

  const formatoDinero = (valor) => {
    return `C$ ${Number(valor || 0).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const obtenerMensajeError = (errorCarga, mensajeBase) => {
    const detalle = errorCarga?.message || "";

    if (detalle.toLowerCase().includes("failed to fetch")) {
      return `${mensajeBase} Revisa que el backend esté activo.`;
    }

    return detalle || mensajeBase;
  };

  const cargarCatalogos = async () => {
    setCargandoCatalogos(true);
    setErrorCatalogos("");

    const resultados = await Promise.allSettled([
      obtenerProductosInventario(),
      obtenerProveedores(),
      obtenerCompras({ estado: "Recibida" }),
    ]);

    const [productosResultado, proveedoresResultado, comprasResultado] = resultados;
    const errores = [];

    if (productosResultado.status === "fulfilled") {
      setProductos(productosResultado.value || []);
    } else {
      setProductos([]);
      errores.push(
        obtenerMensajeError(
          productosResultado.reason,
          "No se pudieron cargar los productos."
        )
      );
    }

    if (proveedoresResultado.status === "fulfilled") {
      setProveedores(proveedoresResultado.value || []);
    } else {
      setProveedores([]);
      errores.push(
        obtenerMensajeError(
          proveedoresResultado.reason,
          "No se pudieron cargar los proveedores."
        )
      );
    }

    if (comprasResultado.status === "fulfilled") {
      setCompras(comprasResultado.value || []);
    } else {
      setCompras([]);
      errores.push(
        obtenerMensajeError(
          comprasResultado.reason,
          "No se pudieron cargar las compras recibidas."
        )
      );
    }

    if (errores.length > 0) {
      setErrorCatalogos(errores.join(" "));
    }

    setCargandoCatalogos(false);
  };

  const cargarHistorialPerdidas = async (filtrosConsulta = filtros) => {
    setCargandoHistorial(true);
    setErrorHistorial("");

    try {
      const [resumenRespuesta, perdidasRespuesta] = await Promise.all([
        obtenerResumenPerdidas(),
        obtenerPerdidas(filtrosConsulta),
      ]);

      setResumen(resumenRespuesta || resumenInicial);
      setPerdidas(perdidasRespuesta || []);
    } catch (errorCarga) {
      console.error("Error al cargar pérdidas:", errorCarga);
      setResumen(resumenInicial);
      setPerdidas([]);
      setErrorHistorial(
        obtenerMensajeError(
          errorCarga,
          "No se pudo cargar el historial de pérdidas."
        )
      );
    } finally {
      setCargandoHistorial(false);
    }
  };

  const cargarDatos = async (filtrosConsulta = filtros) => {
    setCargando(true);
    setError("");

    try {
      await Promise.allSettled([
        cargarCatalogos(),
        cargarHistorialPerdidas(filtrosConsulta),
      ]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const comprasDisponibles = useMemo(() => {
    return compras.filter(
      (compra) =>
        !nuevaPerdida.proveedor ||
        String(compra.ID_Proveedor) === String(nuevaPerdida.proveedor)
    );
  }, [compras, nuevaPerdida.proveedor]);

  const productosDisponibles = useMemo(() => {
    return productos.filter((producto) => {
      const activo = String(producto.Estado || "").toUpperCase() === "ACTIVO";
      const conStock = Number(producto.Stock || 0) > 0;
      const coincideProveedor =
        !nuevaPerdida.proveedor ||
        String(producto.ID_Proveedor) === String(nuevaPerdida.proveedor);

      return activo && conStock && coincideProveedor;
    });
  }, [productos, nuevaPerdida.proveedor]);

  const productoSeleccionado = productosDisponibles.find(
    (producto) =>
      String(producto.ID_Producto) === String(nuevaPerdida.productoSeleccionado)
  );

  const totalPerdida = useMemo(() => {
    return nuevaPerdida.productos.reduce(
      (total, producto) => total + Number(producto.CostoTotal || 0),
      0
    );
  }, [nuevaPerdida.productos]);

  const manejarFiltro = (e) => {
    const { name, value } = e.target;
    const filtrosActualizados = {
      ...filtros,
      [name]: value,
    };

    setFiltros(filtrosActualizados);
    cargarHistorialPerdidas(filtrosActualizados);
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      fecha: "",
      producto: "",
      proveedor: "",
      motivo: "",
    };

    setFiltros(filtrosLimpios);
    cargarHistorialPerdidas(filtrosLimpios);
  };

  const abrirModal = () => {
    setError("");
    setMensaje("");
    setErroresModal([]);
    setNuevaPerdida(crearFormularioVacio());
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setNuevaPerdida(crearFormularioVacio());
    setErroresModal([]);
    setGuardando(false);
  };

  const manejarNuevaPerdida = (e) => {
    const { name, value } = e.target;

    if (name === "fecha" && value > obtenerFechaActual()) {
      return;
    }

    if ((name === "cantidad" || name === "costoUnitario") && Number(value) < 0) {
      return;
    }

    if (name === "proveedor") {
      setNuevaPerdida((perdidaActual) => ({
        ...perdidaActual,
        proveedor: value,
        compra: "",
        productoSeleccionado: "",
        cantidad: "",
        costoUnitario: "",
        productos: [],
      }));
      setErroresModal([]);
      return;
    }

    if (name === "productoSeleccionado") {
      const producto = productosDisponibles.find(
        (item) => String(item.ID_Producto) === String(value)
      );

      setNuevaPerdida((perdidaActual) => ({
        ...perdidaActual,
        productoSeleccionado: value,
        costoUnitario: producto?.PrecioDeCompra || "",
      }));
      setErroresModal([]);
      return;
    }

    setNuevaPerdida((perdidaActual) => ({
      ...perdidaActual,
      [name]: value,
    }));
    setErroresModal([]);
  };

  const agregarProducto = () => {
    if (!productoSeleccionado) {
      setErroresModal(["Debes seleccionar un producto con stock disponible."]);
      return;
    }

    const cantidad = Number(nuevaPerdida.cantidad);
    const costoUnitario = Number(
      nuevaPerdida.costoUnitario || productoSeleccionado.PrecioDeCompra || 0
    );

    if (!cantidad || cantidad <= 0) {
      setErroresModal(["La cantidad perdida debe ser mayor que cero."]);
      return;
    }

    if (cantidad > Number(productoSeleccionado.Stock || 0)) {
      setErroresModal([
        `La pérdida de ${productoSeleccionado.Nombre} no puede superar el stock disponible.`,
      ]);
      return;
    }

    if (!costoUnitario || costoUnitario <= 0) {
      setErroresModal(["El costo unitario debe ser mayor que cero."]);
      return;
    }

    setNuevaPerdida((perdidaActual) => {
      const productosActuales = perdidaActual.productos.filter(
        (producto) => producto.ID_Producto !== productoSeleccionado.ID_Producto
      );

      return {
        ...perdidaActual,
        productoSeleccionado: "",
        cantidad: "",
        costoUnitario: "",
        productos: [
          ...productosActuales,
          {
            ID_Producto: productoSeleccionado.ID_Producto,
            Nombre: productoSeleccionado.Nombre,
            Talla: productoSeleccionado.Talla,
            Stock: productoSeleccionado.Stock,
            Cantidad: cantidad,
            CostoUnitario: costoUnitario,
            CostoTotal: cantidad * costoUnitario,
          },
        ],
      };
    });

    setErroresModal([]);
  };

  const quitarProducto = (idProducto) => {
    setNuevaPerdida((perdidaActual) => ({
      ...perdidaActual,
      productos: perdidaActual.productos.filter(
        (producto) => producto.ID_Producto !== idProducto
      ),
    }));
  };

  const validarPerdida = () => {
    const errores = [];

    if (!nuevaPerdida.fecha) errores.push("Debes seleccionar una fecha.");
    if (!nuevaPerdida.motivo.trim()) errores.push("Debes escribir el motivo.");
    if (nuevaPerdida.productos.length === 0) {
      errores.push("Debes agregar al menos un producto a la pérdida.");
    }

    nuevaPerdida.productos.forEach((producto) => {
      if (Number(producto.Cantidad) <= 0) {
        errores.push(`La cantidad de ${producto.Nombre} debe ser mayor que cero.`);
      }

      if (Number(producto.Cantidad) > Number(producto.Stock)) {
        errores.push(`La cantidad de ${producto.Nombre} supera el stock actual.`);
      }
    });

    return errores;
  };

  const guardarPerdida = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    const erroresValidacion = validarPerdida();

    if (erroresValidacion.length > 0) {
      setErroresModal(erroresValidacion);
      return;
    }

    const payload = {
      ID_Proveedor: nuevaPerdida.proveedor ? Number(nuevaPerdida.proveedor) : null,
      ID_Compra: nuevaPerdida.compra ? Number(nuevaPerdida.compra) : null,
      FechaRegistro: nuevaPerdida.fecha,
      Motivo: nuevaPerdida.motivo.trim(),
      Observacion: nuevaPerdida.observacion.trim() || null,
      productos: nuevaPerdida.productos.map((producto) => ({
        ID_Producto: producto.ID_Producto,
        Cantidad: producto.Cantidad,
        CostoUnitario: producto.CostoUnitario,
      })),
    };

    setGuardando(true);

    try {
      const respuesta = await registrarPerdida(payload);
      setMensaje(
        `${respuesta.mensaje} ID de pérdida: ${respuesta.ID_Perdida}.`
      );
      cerrarModal();
      await Promise.allSettled([
        cargarCatalogos(),
        cargarHistorialPerdidas(),
      ]);
    } catch (errorGuardado) {
      console.error("Error al registrar pérdida:", errorGuardado);
      setError(errorGuardado.message || "No se pudo registrar la pérdida.");
    } finally {
      setGuardando(false);
    }
  };

  const verDetalle = async (idPerdida) => {
    setCargandoDetalle(true);
    setError("");

    try {
      const detalleRespuesta = await obtenerDetallePerdida(idPerdida);
      setDetalle(detalleRespuesta);
    } catch (errorDetalle) {
      console.error("Error al cargar detalle de pérdida:", errorDetalle);
      setError(errorDetalle.message || "No se pudo cargar el detalle.");
    } finally {
      setCargandoDetalle(false);
    }
  };

  return (
    <section className="perdidas-page">
      <div className="perdidas-top">
        <div>
          <h1>Pérdidas</h1>
          <p>Registra bajas de inventario por daño, extravío o ajuste operativo.</p>
        </div>

        <button className="btn-nueva-perdida" type="button" onClick={abrirModal}>
          + Nueva pérdida
        </button>
      </div>

      {(cargando || cargandoHistorial || cargandoCatalogos) && (
        <p className="estado-perdidas">Cargando pérdidas...</p>
      )}
      {error && <p className="error-perdidas">{error}</p>}
      {errorCatalogos && <p className="error-perdidas">{errorCatalogos}</p>}
      {errorHistorial && <p className="error-perdidas">{errorHistorial}</p>}
      {mensaje && <p className="exito-perdidas">{mensaje}</p>}

      <div className="perdidas-resumen">
        <article className="perdida-card">
          <span>Pérdidas del mes</span>
          <h3>{resumen.perdidas_mes}</h3>
        </article>
        <article className="perdida-card">
          <span>Unidades perdidas</span>
          <h3>{resumen.unidades_perdidas_mes}</h3>
        </article>
        <article className="perdida-card">
          <span>Costo del mes</span>
          <h3>{formatoDinero(resumen.costo_perdidas_mes)}</h3>
        </article>
        <article className="perdida-card">
          <span>Historial total</span>
          <h3>{resumen.perdidas_totales}</h3>
        </article>
      </div>

      <div className="perdidas-filtros">
        <div className="campo-perdida">
          <label>Fecha</label>
          <input type="date" name="fecha" value={filtros.fecha} onChange={manejarFiltro} />
        </div>

        <div className="campo-perdida">
          <label>Producto</label>
          <input
            type="text"
            name="producto"
            placeholder="Buscar producto"
            value={filtros.producto}
            onChange={manejarFiltro}
          />
        </div>

        <div className="campo-perdida">
          <label>Proveedor</label>
          <select name="proveedor" value={filtros.proveedor} onChange={manejarFiltro}>
            <option value="">Todos los proveedores</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.ID_Proveedor} value={proveedor.ID_Proveedor}>
                {proveedor.NombreEmpresa}
              </option>
            ))}
          </select>
        </div>

        <div className="campo-perdida">
          <label>Motivo</label>
          <input
            type="text"
            name="motivo"
            placeholder="Daño, extravío..."
            value={filtros.motivo}
            onChange={manejarFiltro}
          />
        </div>

        <button className="btn-limpiar-perdida" type="button" onClick={limpiarFiltros}>
          Limpiar
        </button>
      </div>

      <div className="perdidas-tabla-card">
        <h2>Historial de pérdidas</h2>

        <div className="perdidas-tabla-contenedor">
          <table className="perdidas-tabla">
            <thead>
              <tr>
                <th>No.</th>
                <th>Fecha</th>
                <th>Productos</th>
                <th>Proveedor</th>
                <th>Compra</th>
                <th>Motivo</th>
                <th>Cantidad</th>
                <th>Costo</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {perdidas.length > 0 ? (
                perdidas.map((perdida) => (
                  <tr key={perdida.ID_Perdida}>
                    <td>{perdida.ID_Perdida}</td>
                    <td>{perdida.fecha}</td>
                    <td>{perdida.producto_principal}</td>
                    <td>{perdida.proveedor || "Sin proveedor"}</td>
                    <td>{perdida.ID_Compra || "-"}</td>
                    <td>{perdida.motivo}</td>
                    <td>{perdida.cantidad_total}</td>
                    <td>{formatoDinero(perdida.costo_total)}</td>
                    <td>
                      <button
                        className="btn-detalle-perdida"
                        type="button"
                        disabled={cargandoDetalle}
                        onClick={() => verDetalle(perdida.ID_Perdida)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="sin-resultados-perdida" colSpan="9">
                    No se encontraron pérdidas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && (
        <div className="modal-perdida-fondo">
          <div className="modal-perdida">
            <div className="modal-perdida-header">
              <h2>Registrar pérdida</h2>
              <button type="button" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="form-perdida" onSubmit={guardarPerdida}>
              {erroresModal.length > 0 && (
                <div className="errores-modal-perdida" role="alert">
                  <strong>Antes de guardar la pérdida:</strong>
                  <ul>
                    {erroresModal.map((errorModal) => (
                      <li key={errorModal}>{errorModal}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="campo-perdida">
                <label>Proveedor opcional</label>
                <select
                  name="proveedor"
                  value={nuevaPerdida.proveedor}
                  onChange={manejarNuevaPerdida}
                >
                  <option value="">Sin proveedor específico</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.ID_Proveedor} value={proveedor.ID_Proveedor}>
                      {proveedor.NombreEmpresa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo-perdida">
                <label>Compra opcional</label>
                <select
                  name="compra"
                  value={nuevaPerdida.compra}
                  onChange={manejarNuevaPerdida}
                >
                  <option value="">Sin compra asociada</option>
                  {comprasDisponibles.map((compra) => (
                    <option key={compra.ID_Compra} value={compra.ID_Compra}>
                      Compra {compra.ID_Compra} - {compra.fecha}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo-perdida">
                <label>Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  max={obtenerFechaActual()}
                  value={nuevaPerdida.fecha}
                  onChange={manejarNuevaPerdida}
                />
              </div>

              <div className="campo-perdida">
                <label>Motivo</label>
                <input
                  type="text"
                  name="motivo"
                  placeholder="Ej: Producto dañado"
                  value={nuevaPerdida.motivo}
                  onChange={manejarNuevaPerdida}
                />
              </div>

              <div className="campo-perdida">
                <label>Producto</label>
                <select
                  name="productoSeleccionado"
                  value={nuevaPerdida.productoSeleccionado}
                  onChange={manejarNuevaPerdida}
                >
                  <option value="">Selecciona un producto</option>
                  {productosDisponibles.map((producto) => (
                    <option key={producto.ID_Producto} value={producto.ID_Producto}>
                      {producto.Nombre} - {producto.Talla || "Sin talla"} - Stock {producto.Stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="producto-perdida-info">
                <span>Stock disponible</span>
                <strong>{productoSeleccionado?.Stock || 0}</strong>
                <span>Costo sugerido</span>
                <strong>{formatoDinero(productoSeleccionado?.PrecioDeCompra)}</strong>
              </div>

              <div className="campo-perdida">
                <label>Cantidad perdida</label>
                <input
                  type="number"
                  name="cantidad"
                  min="1"
                  value={nuevaPerdida.cantidad}
                  onChange={manejarNuevaPerdida}
                />
              </div>

              <div className="campo-perdida">
                <label>Costo unitario</label>
                <input
                  type="number"
                  name="costoUnitario"
                  min="0"
                  step="0.01"
                  value={nuevaPerdida.costoUnitario}
                  onChange={manejarNuevaPerdida}
                />
              </div>

              <div className="acciones-producto-perdida">
                <button type="button" onClick={agregarProducto}>
                  Agregar producto
                </button>
              </div>

              <div className="campo-perdida campo-observacion">
                <label>Observación opcional</label>
                <textarea
                  name="observacion"
                  placeholder="Detalle adicional de la pérdida..."
                  value={nuevaPerdida.observacion}
                  onChange={manejarNuevaPerdida}
                />
              </div>

              <div className="productos-perdida-lista">
                <h3>Productos agregados</h3>
                <div className="tabla-productos-perdida">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Talla</th>
                        <th>Cantidad</th>
                        <th>Costo</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {nuevaPerdida.productos.length > 0 ? (
                        nuevaPerdida.productos.map((producto) => (
                          <tr key={producto.ID_Producto}>
                            <td>{producto.Nombre}</td>
                            <td>{producto.Talla || "-"}</td>
                            <td>{producto.Cantidad}</td>
                            <td>{formatoDinero(producto.CostoUnitario)}</td>
                            <td>{formatoDinero(producto.CostoTotal)}</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => quitarProducto(producto.ID_Producto)}
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6">Aún no has agregado productos.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="total-perdida-modal">
                <span>Total estimado</span>
                <strong>{formatoDinero(totalPerdida)}</strong>
              </div>

              <div className="modal-perdida-botones">
                <button className="btn-cancelar" type="button" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button className="btn-guardar" type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar pérdida"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detalle && (
        <div className="modal-perdida-fondo">
          <div className="modal-detalle-perdida">
            <div className="modal-perdida-header">
              <h2>Detalle de pérdida {detalle.ID_Perdida}</h2>
              <button type="button" onClick={() => setDetalle(null)}>
                ×
              </button>
            </div>

            <div className="detalle-perdida-grid">
              <span>Fecha</span>
              <strong>{detalle.fecha}</strong>
              <span>Proveedor</span>
              <strong>{detalle.proveedor || "Sin proveedor"}</strong>
              <span>Motivo</span>
              <strong>{detalle.motivo}</strong>
              <span>Observación</span>
              <strong>{detalle.observacion || "-"}</strong>
            </div>

            <div className="tabla-productos-perdida">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Talla</th>
                    <th>Cantidad</th>
                    <th>Costo</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.productos.map((producto) => (
                    <tr key={producto.ID_DetallePerdida}>
                      <td>{producto.producto}</td>
                      <td>{producto.talla || "-"}</td>
                      <td>{producto.cantidad}</td>
                      <td>{formatoDinero(producto.costo_unitario)}</td>
                      <td>{formatoDinero(producto.costo_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Perdidas;

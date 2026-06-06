import { useEffect, useMemo, useState } from "react";
import {
  marcarCompraRecibida,
  obtenerCompras,
  obtenerProductosPorProveedor,
  obtenerProveedores,
  obtenerResumenCompras,
  registrarCompraCompleta,
} from "../../../api/api";
import "./Compras.css";

const resumenInicial = {
  compras_mes: 0,
  ordenes_registradas: 0,
  monto_invertido: 0,
  proveedores_activos: 0,
};

function Compras() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const crearFormularioVacio = () => ({
    fecha: obtenerFechaActual(),
    proveedor: "",
    productoSeleccionado: "",
    cantidad: "",
    productos: [],
    estado: "Pendiente",
    costoEnvio: "",
    descripcion: "",
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [compras, setCompras] = useState([]);
  const [resumen, setResumen] = useState(resumenInicial);
  const [proveedores, setProveedores] = useState([]);
  const [productosProveedor, setProductosProveedor] = useState([]);
  const [, setCargando] = useState(true);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [compraProcesando, setCompraProcesando] = useState(null);
  const [error, setError] = useState("");
  const [erroresModal, setErroresModal] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const [filtros, setFiltros] = useState({
    busqueda: "",
    proveedor: "",
    fecha: "",
    estado: "",
  });

  const [nuevaCompra, setNuevaCompra] = useState(crearFormularioVacio);

  const formatoDinero = (valor) => {
    return `C$ ${Number(valor || 0).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const cargarCompras = async (filtrosConsulta = filtros) => {
    setCargando(true);
    setError("");

    try {
      const [resumenRespuesta, comprasRespuesta, proveedoresRespuesta] =
        await Promise.all([
          obtenerResumenCompras(),
          obtenerCompras(filtrosConsulta),
          obtenerProveedores(),
        ]);

      setResumen(resumenRespuesta || resumenInicial);
      setCompras(comprasRespuesta || []);
      setProveedores(proveedoresRespuesta || []);
    } catch (errorCarga) {
      console.error("Error al cargar compras:", errorCarga);
      setError(errorCarga.message || "No se pudieron cargar las compras.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCompras();
  }, []);

  const cargarProductosProveedor = async (idProveedor) => {
    if (!idProveedor) {
      setProductosProveedor([]);
      return;
    }

    setCargandoProductos(true);
    setError("");

    try {
      const productosRespuesta = await obtenerProductosPorProveedor(idProveedor);
      setProductosProveedor(productosRespuesta || []);
    } catch (errorProductos) {
      console.error("Error al cargar productos del proveedor:", errorProductos);
      setProductosProveedor([]);
      setError(
        errorProductos.message ||
          "No se pudieron cargar los productos del proveedor."
      );
    } finally {
      setCargandoProductos(false);
    }
  };

  const manejarFiltro = (e) => {
    const { name, value } = e.target;
    const filtrosActualizados = {
      ...filtros,
      [name]: value,
    };

    setFiltros(filtrosActualizados);
    cargarCompras(filtrosActualizados);
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      busqueda: "",
      proveedor: "",
      fecha: "",
      estado: "",
    };

    setFiltros(filtrosLimpios);
    cargarCompras(filtrosLimpios);
  };

  const abrirModal = () => {
    setError("");
    setErroresModal([]);
    setMensaje("");
    setNuevaCompra(crearFormularioVacio());
    setProductosProveedor([]);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setNuevaCompra(crearFormularioVacio());
    setProductosProveedor([]);
    setErroresModal([]);
    setGuardando(false);
  };

  const manejarNuevaCompra = (e) => {
    const { name, value } = e.target;

    if (name === "fecha" && value < obtenerFechaActual()) {
      return;
    }

    if (name === "cantidad" && value !== "" && Number(value) < 1) {
      return;
    }

    if (name === "costoEnvio" && value !== "" && Number(value) < 0) {
      return;
    }

    if (name === "proveedor") {
      setNuevaCompra((compraActual) => ({
        ...compraActual,
        proveedor: value,
        productoSeleccionado: "",
        cantidad: "",
        productos: [],
      }));
      setErroresModal([]);
      cargarProductosProveedor(value);
      return;
    }

    setNuevaCompra((compraActual) => ({
      ...compraActual,
      [name]: value,
    }));
    setErroresModal([]);
  };

  const productoSeleccionado = productosProveedor.find(
    (producto) =>
      String(producto.ID_ProductoProveedor) ===
      String(nuevaCompra.productoSeleccionado)
  );

  const agregarProducto = () => {
    if (!productoSeleccionado) {
      setErroresModal(["Debes seleccionar un producto del proveedor."]);
      return;
    }

    if (!nuevaCompra.cantidad || Number(nuevaCompra.cantidad) <= 0) {
      setErroresModal(["La cantidad debe ser mayor que cero."]);
      return;
    }

    setError("");
    setErroresModal([]);

    const cantidad = Number(nuevaCompra.cantidad);

    setNuevaCompra((compraActual) => {
      const existeProducto = compraActual.productos.find(
        (producto) =>
          producto.ID_ProductoProveedor === productoSeleccionado.ID_ProductoProveedor
      );

      if (existeProducto) {
        return {
          ...compraActual,
          productoSeleccionado: "",
          cantidad: "",
          productos: compraActual.productos.map((producto) =>
            producto.ID_ProductoProveedor ===
            productoSeleccionado.ID_ProductoProveedor
              ? { ...producto, Cantidad: producto.Cantidad + cantidad }
              : producto
          ),
        };
      }

      return {
        ...compraActual,
        productoSeleccionado: "",
        cantidad: "",
        productos: [
          ...compraActual.productos,
          {
            ...productoSeleccionado,
            Cantidad: cantidad,
          },
        ],
      };
    });
  };

  const quitarProducto = (idProductoProveedor) => {
    setNuevaCompra((compraActual) => ({
      ...compraActual,
      productos: compraActual.productos.filter(
        (producto) => producto.ID_ProductoProveedor !== idProductoProveedor
      ),
    }));
  };

  const cambiarCantidadProducto = (idProductoProveedor, cantidad) => {
    if (cantidad === "" || Number(cantidad) < 1) {
      return;
    }

    setNuevaCompra((compraActual) => ({
      ...compraActual,
      productos: compraActual.productos.map((producto) =>
        producto.ID_ProductoProveedor === idProductoProveedor
          ? { ...producto, Cantidad: Number(cantidad) }
          : producto
      ),
    }));
  };

  const totalProductos = useMemo(() => {
    return nuevaCompra.productos.reduce(
      (total, producto) =>
        total + Number(producto.PrecioDeCompra || 0) * producto.Cantidad,
      0
    );
  }, [nuevaCompra.productos]);

  const costoEnvio = Number(nuevaCompra.costoEnvio || 0);
  const totalCompra = totalProductos + costoEnvio;

  const validarCompra = () => {
    const errores = [];

    if (!nuevaCompra.proveedor) errores.push("Debes seleccionar un proveedor.");
    if (!nuevaCompra.fecha) errores.push("Debes seleccionar una fecha.");
    if (!nuevaCompra.estado) errores.push("Debes seleccionar un estado.");
    if (nuevaCompra.productos.length === 0) {
      errores.push("Debes agregar al menos un producto a la compra.");
    }

    const productoCantidadInvalida = nuevaCompra.productos.find(
      (producto) => Number(producto.Cantidad) <= 0
    );

    if (productoCantidadInvalida) {
      errores.push(
        `La cantidad de ${productoCantidadInvalida.Nombre} debe ser mayor que cero.`
      );
    }

    if (costoEnvio < 0) errores.push("El costo de envío no puede ser negativo.");
    if (totalCompra <= 0) errores.push("El total de la compra debe ser mayor que cero.");

    return errores;
  };

  const guardarCompra = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    const erroresValidacion = validarCompra();

    if (erroresValidacion.length > 0) {
      setErroresModal(erroresValidacion);
      return;
    }

    const payload = {
      ID_Proveedor: Number(nuevaCompra.proveedor),
      ID_Empleado: 1,
      FechaCompra: nuevaCompra.fecha,
      Estado: nuevaCompra.estado,
      Descripcion: nuevaCompra.descripcion.trim() || null,
      CostoDeEnvio: costoEnvio,
      productos: nuevaCompra.productos.map((producto) => ({
        ID_ProductoProveedor: producto.ID_ProductoProveedor,
        Cantidad: producto.Cantidad,
      })),
    };

    setGuardando(true);

    try {
      const respuesta = await registrarCompraCompleta(payload);
      setMensaje(
        `${respuesta.mensaje} ID de compra: ${respuesta.ID_Compra}.`
      );
      cerrarModal();
      await cargarCompras();
    } catch (errorGuardado) {
      console.error("Error al guardar compra:", errorGuardado);
      setError(errorGuardado.message || "No se pudo guardar la compra.");
    } finally {
      setGuardando(false);
    }
  };

  const recibirCompra = async (idCompra) => {
    setError("");
    setMensaje("");
    setCompraProcesando(idCompra);

    try {
      const compraActualizada = await marcarCompraRecibida(idCompra);
      setMensaje(`Compra ${compraActualizada.ID_Compra} marcada como recibida.`);
      await cargarCompras();
    } catch (errorRecibir) {
      console.error("Error al marcar compra como recibida:", errorRecibir);
      setError(
        errorRecibir.message || "No se pudo marcar la compra como recibida."
      );
    } finally {
      setCompraProcesando(null);
    }
  };

  const obtenerClaseEstado = (estado) => {
    return estado === "Recibida" ? "estado-recibida" : "estado-pendiente";
  };

  return (
    <section className="compras-page">
      <div className="compras-top">
        <h1>Compras</h1>
        <p>Controla las compras realizadas a proveedores.</p>
      </div>

      {error && <p className="error-compras">{error}</p>}
      {mensaje && <p className="exito-compras">{mensaje}</p>}

      <div className="compras-resumen">
        <article className="compra-card">
          <div>
            <p>Compras del mes</p>
            <h3>{formatoDinero(resumen.compras_mes)}</h3>
          </div>
        </article>

        <article className="compra-card">
          <div>
            <p>Órdenes registradas</p>
            <h3>{resumen.ordenes_registradas}</h3>
          </div>
        </article>

        <article className="compra-card">
          <div>
            <p>Monto invertido</p>
            <h3>{formatoDinero(resumen.monto_invertido)}</h3>
          </div>
        </article>

        <article className="compra-card">
          <div>
            <p>Proveedores activos</p>
            <h3>{resumen.proveedores_activos}</h3>
          </div>
        </article>
      </div>

      <div className="compras-filtros-panel">
        <div className="campo-filtro">
          <label>Buscar compra</label>
          <input
            type="text"
            name="busqueda"
            placeholder="Buscar por ID, proveedor o producto"
            value={filtros.busqueda}
            onChange={manejarFiltro}
          />
        </div>

        <div className="campo-filtro">
          <label>Proveedor</label>
          <select
            name="proveedor"
            value={filtros.proveedor}
            onChange={manejarFiltro}
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.ID_Proveedor} value={proveedor.ID_Proveedor}>
                {proveedor.NombreEmpresa}
              </option>
            ))}
          </select>
        </div>

        <div className="campo-filtro">
          <label>Fecha</label>
          <input
            type="date"
            name="fecha"
            value={filtros.fecha}
            onChange={manejarFiltro}
          />
        </div>

        <div className="campo-filtro">
          <label>Estado</label>
          <select name="estado" value={filtros.estado} onChange={manejarFiltro}>
            <option value="">Todos los estados</option>
            <option value="Recibida">Recibida</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>

        <button className="btn-limpiar-compra" onClick={limpiarFiltros}>
          Limpiar
        </button>

        <button className="btn-nueva-compra" onClick={abrirModal}>
          + Nueva compra
        </button>
      </div>

      <div className="compras-contenido">
        <div className="listado-compras">
          <h2>Listado de compras</h2>

          <div className="tabla-compras-contenedor">
            <table className="tabla-compras">
              <thead>
                <tr>
                  <th>No. compra</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Productos</th>
                  <th>Cantidad</th>
                  <th>Envío</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {compras.length > 0 ? (
                  compras.map((compra) => (
                    <tr key={compra.ID_Compra}>
                      <td>{compra.ID_Compra}</td>
                      <td>{compra.fecha}</td>
                      <td>{compra.proveedor}</td>
                      <td>{compra.producto_principal}</td>
                      <td>{compra.cantidad_total}</td>
                      <td>{formatoDinero(compra.costo_envio)}</td>
                      <td>{formatoDinero(compra.monto)}</td>
                      <td>
                        <span className={obtenerClaseEstado(compra.estado)}>
                          {compra.estado}
                        </span>
                      </td>
                      <td>
                        {compra.estado === "Pendiente" ? (
                          <button
                            type="button"
                            className="btn-recibir-compra"
                            disabled={compraProcesando === compra.ID_Compra}
                            onClick={() => recibirCompra(compra.ID_Compra)}
                          >
                            {compraProcesando === compra.ID_Compra
                              ? "Actualizando..."
                              : "Marcar recibida"}
                          </button>
                        ) : (
                          <span className="sin-accion-compra">Recibida</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="sin-resultados" colSpan="9">
                      No se encontraron compras.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {mostrarModal && (
        <div className="modal-compra-fondo">
          <div className="modal-compra">
            <div className="modal-compra-header">
              <h2>Agregar compra</h2>

              <button type="button" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="form-compra" onSubmit={guardarCompra}>
              {error && <p className="error-modal-compra">{error}</p>}

              {erroresModal.length > 0 && (
                <div className="errores-modal-compra" role="alert">
                  <strong>Antes de guardar la compra:</strong>
                  <ul>
                    {erroresModal.map((errorModal) => (
                      <li key={errorModal}>{errorModal}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="campo-compra">
                <label>Proveedor</label>
                <select
                  name="proveedor"
                  value={nuevaCompra.proveedor}
                  onChange={manejarNuevaCompra}
                >
                  <option value="">Selecciona un proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option
                      key={proveedor.ID_Proveedor}
                      value={proveedor.ID_Proveedor}
                    >
                      {proveedor.NombreEmpresa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo-compra">
                <label>Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  min={obtenerFechaActual()}
                  value={nuevaCompra.fecha}
                  onChange={manejarNuevaCompra}
                />
              </div>

              <div className="campo-compra">
                <label>Estado</label>
                <select
                  name="estado"
                  value={nuevaCompra.estado}
                  onChange={manejarNuevaCompra}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Recibida">Recibida</option>
                </select>
              </div>

              <div className="campo-compra">
                <label>Costo envío</label>
                <input
                  type="number"
                  name="costoEnvio"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 150.00"
                  value={nuevaCompra.costoEnvio}
                  onChange={manejarNuevaCompra}
                />
              </div>

              <div className="campo-compra campo-producto-compra">
                <label>Producto</label>
                <select
                  name="productoSeleccionado"
                  value={nuevaCompra.productoSeleccionado}
                  onChange={manejarNuevaCompra}
                  disabled={!nuevaCompra.proveedor || cargandoProductos}
                >
                  <option value="">
                    {cargandoProductos
                      ? "Cargando productos..."
                      : "Selecciona un producto"}
                  </option>
                  {productosProveedor.map((producto) => (
                    <option
                      key={producto.ID_ProductoProveedor}
                      value={producto.ID_ProductoProveedor}
                    >
                      {producto.Nombre} - {producto.Talla || "Sin talla"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo-compra">
                <label>Cantidad</label>
                <input
                  type="number"
                  name="cantidad"
                  min="1"
                  placeholder="Ej. 10"
                  value={nuevaCompra.cantidad}
                  onChange={manejarNuevaCompra}
                />
              </div>

              <div className="producto-seleccionado-info">
                <span>Talla</span>
                <strong>{productoSeleccionado?.Talla || "Sin producto"}</strong>
                <span>Costo</span>
                <strong>
                  {productoSeleccionado
                    ? formatoDinero(productoSeleccionado.PrecioDeCompra)
                    : "C$ 0.00"}
                </strong>
              </div>

              <div className="acciones-producto-compra">
                <button type="button" onClick={agregarProducto}>
                  Agregar producto
                </button>
              </div>

              <div className="productos-compra-lista">
                <h3>Productos de la compra</h3>

                <div className="tabla-productos-compra">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Talla</th>
                        <th>Costo</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {nuevaCompra.productos.map((producto) => (
                        <tr key={producto.ID_ProductoProveedor}>
                          <td>{producto.Nombre}</td>
                          <td>{producto.Talla || "Sin talla"}</td>
                          <td>{formatoDinero(producto.PrecioDeCompra)}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={producto.Cantidad}
                              onChange={(e) =>
                                cambiarCantidadProducto(
                                  producto.ID_ProductoProveedor,
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            {formatoDinero(
                              Number(producto.PrecioDeCompra) *
                                producto.Cantidad
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() =>
                                quitarProducto(producto.ID_ProductoProveedor)
                              }
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}

                      {nuevaCompra.productos.length === 0 && (
                        <tr>
                          <td colSpan="6" className="sin-resultados">
                            Aún no has agregado productos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="campo-compra campo-descripcion">
                <label>Descripción opcional</label>
                <textarea
                  name="descripcion"
                  placeholder="Agrega una descripción de la compra..."
                  value={nuevaCompra.descripcion}
                  onChange={manejarNuevaCompra}
                ></textarea>
              </div>

              <div className="total-compra-modal">
                <span>Total productos</span>
                <strong>{formatoDinero(totalProductos)}</strong>
                <span>Envío</span>
                <strong>{formatoDinero(costoEnvio)}</strong>
                <span>Total compra</span>
                <strong>{formatoDinero(totalCompra)}</strong>
              </div>

              <div className="modal-compra-botones">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-guardar" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Compras;

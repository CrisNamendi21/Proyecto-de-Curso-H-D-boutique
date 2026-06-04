import { useEffect, useMemo, useState } from "react";
import {
  cambiarEstadoProducto,
  crearProductoCompleto,
  obtenerCategorias,
  obtenerProductosInventario,
  obtenerProveedores,
  obtenerResumenInventario,
  obtenerTallas,
} from "../../../api/api";
import "./Productos.css";

const resumenInicial = {
  total_productos: 0,
  valor_inventario: 0,
  productos_bajos_stock: 0,
  productos_sin_stock: 0,
};

function Productos() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const crearFormularioVacio = () => ({
    nombre: "",
    fecha: obtenerFechaActual(),
    idCategoria: "",
    idTalla: "",
    idProveedor: "",
    descripcion: "",
    precioVenta: "",
    costo: "",
    stock: "",
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [productos, setProductos] = useState([]);
  const [resumen, setResumen] = useState(resumenInicial);
  const [categorias, setCategorias] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [productoProcesando, setProductoProcesando] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [filtros, setFiltros] = useState({
    nombre: "",
    categoria: "Todas las categorías",
    estado: "Todos los estados",
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    nombre: "",
    categoria: "Todas las categorías",
    estado: "Todos los estados",
  });

  const [nuevoProducto, setNuevoProducto] = useState(crearFormularioVacio);

  const formatearDinero = (valor) => {
    return `C$ ${Number(valor || 0).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const calcularPrecioVenta = (costo) => {
    // El precio de venta mostrado sigue el margen que tambien calcula el backend.
    if (costo === "") return "";

    const precio = Number(costo) * 1.15;
    return Number.isFinite(precio) ? precio.toFixed(2) : "";
  };

  const obtenerEstadoProducto = (producto) => {
    if (producto.Estado === "INACTIVO") return "Inactivo";
    if (Number(producto.Stock) === 0) return "Sin stock";
    if (Number(producto.Stock) > 0 && Number(producto.Stock) <= 5) {
      return "Bajo stock";
    }

    return "En stock";
  };

  const obtenerClaseEstado = (estado) => {
    if (estado === "En stock") return "estado-stock";
    if (estado === "Bajo stock") return "estado-bajo";
    if (estado === "Sin stock") return "estado-sin";
    return "estado-inactivo";
  };

  const cargarDatos = async () => {
    setCargando(true);
    setError("");

    try {
      const [
        productosRespuesta,
        resumenRespuesta,
        categoriasRespuesta,
        tallasRespuesta,
        proveedoresRespuesta,
      ] = await Promise.all([
        obtenerProductosInventario(),
        obtenerResumenInventario(),
        obtenerCategorias(),
        obtenerTallas(),
        obtenerProveedores(),
      ]);

      setProductos(productosRespuesta || []);
      setResumen(resumenRespuesta || resumenInicial);
      setCategorias(categoriasRespuesta || []);
      setTallas(tallasRespuesta || []);
      setProveedores(proveedoresRespuesta || []);
    } catch (errorCarga) {
      console.error("Error al cargar productos:", errorCarga);
      setError(
        errorCarga.message ||
          "No se pudieron cargar los datos de productos e inventario."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModal = () => {
    setError("");
    setMensaje("");
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setNuevoProducto(crearFormularioVacio());
    setGuardando(false);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    if (name === "nombre") {
      const nombreLimpio = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/g, "");
      setNuevoProducto((productoActual) => ({
        ...productoActual,
        nombre: nombreLimpio,
      }));
      return;
    }

    if (name === "costo") {
      setNuevoProducto((productoActual) => ({
        ...productoActual,
        costo: value,
        precioVenta: calcularPrecioVenta(value),
      }));
      return;
    }

    setNuevoProducto((productoActual) => ({
      ...productoActual,
      [name]: value,
    }));
  };

  const manejarCambioFiltro = (e) => {
    const { name, value } = e.target;

    setFiltros((filtrosActuales) => ({
      ...filtrosActuales,
      [name]: value,
    }));
    setFiltrosAplicados((filtrosActuales) => ({
      ...filtrosActuales,
      [name]: value,
    }));
  };

  const limpiarFiltros = () => {
    const filtrosVacios = {
      nombre: "",
      categoria: "Todas las categorías",
      estado: "Todos los estados",
    };

    setFiltros(filtrosVacios);
    setFiltrosAplicados(filtrosVacios);
  };

  const validarNuevoProducto = () => {
    const fechaActual = obtenerFechaActual();

    if (!nuevoProducto.nombre.trim()) {
      return "El nombre del producto es obligatorio.";
    }

    if (!nuevoProducto.fecha) {
      return "La fecha es obligatoria.";
    }

    if (nuevoProducto.fecha < fechaActual) {
      return "No puedes seleccionar una fecha anterior a la fecha actual.";
    }

    if (!nuevoProducto.idCategoria) {
      return "Debes seleccionar una categoría.";
    }

    if (!nuevoProducto.idTalla) {
      return "Debes seleccionar una talla.";
    }

    if (!nuevoProducto.idProveedor) {
      return "Debes seleccionar un proveedor.";
    }

    if (nuevoProducto.costo === "" || Number(nuevoProducto.costo) <= 0) {
      return "El costo debe ser mayor que cero.";
    }

    if (nuevoProducto.stock === "" || Number(nuevoProducto.stock) < 0) {
      return "El stock no puede ser negativo.";
    }

    return "";
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    const errorValidacion = validarNuevoProducto();

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    const payload = {
      ID_Categoria: Number(nuevoProducto.idCategoria),
      ID_Talla: Number(nuevoProducto.idTalla),
      Nombre: nuevoProducto.nombre.trim(),
      Stock: Number(nuevoProducto.stock),
      Estado: "ACTIVO",
      Descripcion: nuevoProducto.descripcion.trim() || null,
      ID_Proveedor: Number(nuevoProducto.idProveedor),
      PrecioDeCompra: Number(nuevoProducto.costo),
    };

    setGuardando(true);

    try {
      await crearProductoCompleto(payload);
      setMensaje("Producto creado correctamente.");
      cerrarModal();
      await cargarDatos();
    } catch (errorGuardado) {
      console.error("Error al guardar producto:", errorGuardado);
      setError(errorGuardado.message || "No se pudo guardar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstadoProducto = async (producto) => {
    // El backend valida si el producto puede activarse; aqui solo se solicita el cambio.
    const estadoActual = String(producto.Estado || "").trim().toUpperCase();
    const nuevoEstado = estadoActual === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    setError("");
    setMensaje("");
    setProductoProcesando(producto.ID_Producto);

    try {
      await cambiarEstadoProducto(producto.ID_Producto, nuevoEstado);
      setMensaje(
        nuevoEstado === "ACTIVO"
          ? "Producto activado correctamente."
          : "Producto desactivado correctamente."
      );
      await cargarDatos();
    } catch (errorEstado) {
      console.error("Error al cambiar estado del producto:", errorEstado);
      setError(errorEstado.message || "No se pudo cambiar el estado del producto.");
    } finally {
      setProductoProcesando(null);
    }
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const coincideNombre = producto.Nombre.toLowerCase().includes(
        filtrosAplicados.nombre.toLowerCase()
      );

      const coincideCategoria =
        filtrosAplicados.categoria === "Todas las categorías" ||
        String(producto.ID_Categoria) === String(filtrosAplicados.categoria);

      const estadoProducto = obtenerEstadoProducto(producto);
      const coincideEstado =
        filtrosAplicados.estado === "Todos los estados" ||
        estadoProducto === filtrosAplicados.estado;

      return coincideNombre && coincideCategoria && coincideEstado;
    });
  }, [productos, filtrosAplicados]);

  return (
    <div className="productos-page">
      <div className="productos-header">
        <div>
          <h2>Productos</h2>
          <p>Control de productos e inventario de H&D Boutique</p>
        </div>

        <button className="btn-nuevo-producto" onClick={abrirModal}>
          + Nuevo producto
        </button>
      </div>

      {cargando && (
        <p className="estado-productos-mensaje">Cargando inventario...</p>
      )}

      {error && <p className="error-productos">{error}</p>}
      {mensaje && <p className="exito-productos">{mensaje}</p>}

      <section className="productos-resumen">
        <article className="resumen-card">
          <span>Total de productos</span>
          <h3>{resumen.total_productos}</h3>
          <p>Productos registrados</p>
        </article>

        <article className="resumen-card">
          <span>Valor del inventario</span>
          <h3>{formatearDinero(resumen.valor_inventario)}</h3>
          <p>Valor al costo</p>
        </article>

        <article className="resumen-card">
          <span>Productos bajos en stock</span>
          <h3>{resumen.productos_bajos_stock}</h3>
          <p>Stock entre 1 y 5</p>
        </article>

        <article className="resumen-card">
          <span>Productos sin stock</span>
          <h3>{resumen.productos_sin_stock}</h3>
          <p>Necesitan reposición</p>
        </article>
      </section>

      <section className="productos-filtros">
        <div className="campo-filtro">
          <label>Buscar producto</label>
          <input
            type="text"
            name="nombre"
            placeholder="Buscar por nombre"
            value={filtros.nombre}
            onChange={manejarCambioFiltro}
          />
        </div>

        <div className="campo-filtro">
          <label>Categoría</label>
          <select
            name="categoria"
            value={filtros.categoria}
            onChange={manejarCambioFiltro}
          >
            <option>Todas las categorías</option>
            {categorias.map((categoria) => (
              <option
                key={categoria.ID_Categoria}
                value={categoria.ID_Categoria}
              >
                {categoria.Categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="campo-filtro">
          <label>Estado</label>
          <select
            name="estado"
            value={filtros.estado}
            onChange={manejarCambioFiltro}
          >
            <option>Todos los estados</option>
            <option>En stock</option>
            <option>Bajo stock</option>
            <option>Sin stock</option>
            <option>Inactivo</option>
          </select>
        </div>

        <div className="botones-filtro">
          <button type="button" className="btn-limpiar" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
      </section>

      <section className="productos-tabla-card">
        <h3>Listado de productos</h3>

        <table className="productos-tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Talla</th>
              <th>Proveedor</th>
              <th>Precio venta</th>
              <th>Costo</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((producto) => {
                const estadoProducto = obtenerEstadoProducto(producto);

                return (
                  <tr key={producto.ID_Producto}>
                    <td>
                      <strong>{producto.Nombre}</strong>
                    </td>
                    <td>{producto.Categoria || "Sin categoría"}</td>
                    <td>{producto.Talla || "Sin talla"}</td>
                    <td>{producto.Proveedor || "Sin proveedor"}</td>
                    <td>{formatearDinero(producto.PrecioUnitario)}</td>
                    <td>{formatearDinero(producto.PrecioDeCompra)}</td>
                    <td>{producto.Stock}</td>
                    <td>
                      <span
                        className={`estado-producto ${obtenerClaseEstado(
                          estadoProducto
                        )}`}
                      >
                        {estadoProducto}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-estado-producto"
                        onClick={() => alternarEstadoProducto(producto)}
                        disabled={productoProcesando === producto.ID_Producto}
                      >
                        {String(producto.Estado || "").trim().toUpperCase() ===
                        "ACTIVO"
                          ? "Desactivar"
                          : "Activar"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="sin-resultados">
                  No se encontraron productos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {mostrarModal && (
        <div className="modal-fondo">
          <div className="modal-producto">
            <div className="modal-header">
              <h3>Agregar producto</h3>

              <button type="button" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form onSubmit={guardarProducto} className="form-producto">
              <div className="form-grid">
                <div className="form-campo">
                  <label>Nombre del producto</label>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Ej: Camisa elegante"
                    value={nuevoProducto.nombre}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="form-campo">
                  <label>Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    value={nuevoProducto.fecha}
                    min={obtenerFechaActual()}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="form-campo">
                  <label>Categoría</label>
                  <select
                    name="idCategoria"
                    value={nuevoProducto.idCategoria}
                    onChange={manejarCambio}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((categoria) => (
                      <option
                        key={categoria.ID_Categoria}
                        value={categoria.ID_Categoria}
                      >
                        {categoria.Categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-campo">
                  <label>Talla</label>
                  <select
                    name="idTalla"
                    value={nuevoProducto.idTalla}
                    onChange={manejarCambio}
                  >
                    <option value="">Seleccionar talla</option>
                    {tallas.map((talla) => (
                      <option key={talla.ID_Talla} value={talla.ID_Talla}>
                        {talla.Talla}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-campo">
                  <label>Proveedor</label>
                  <select
                    name="idProveedor"
                    value={nuevoProducto.idProveedor}
                    onChange={manejarCambio}
                  >
                    <option value="">Seleccionar proveedor</option>
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

                <div className="form-campo">
                  <label>Costo</label>
                  <input
                    type="number"
                    name="costo"
                    placeholder="Ej: 850"
                    value={nuevoProducto.costo}
                    onChange={manejarCambio}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-campo">
                  <label>Precio de venta</label>
                  <input
                    type="number"
                    name="precioVenta"
                    placeholder="Se calcula automático"
                    value={nuevoProducto.precioVenta}
                    readOnly
                  />
                </div>

                <div className="form-campo">
                  <label>Stock</label>
                  <input
                    type="number"
                    name="stock"
                    placeholder="Ej: 10"
                    value={nuevoProducto.stock}
                    onChange={manejarCambio}
                    min="0"
                  />
                </div>

                <div className="form-campo descripcion">
                  <label>Descripción opcional</label>
                  <textarea
                    name="descripcion"
                    placeholder="Agrega una descripción del producto..."
                    value={nuevoProducto.descripcion}
                    onChange={manejarCambio}
                  ></textarea>
                </div>
              </div>

              <div className="modal-acciones">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-guardar" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Productos;

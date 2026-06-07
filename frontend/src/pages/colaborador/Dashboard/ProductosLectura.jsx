import { useEffect, useMemo, useState } from "react";
import {
  obtenerCategorias,
  obtenerProductosColaborador,
} from "../../../api/api";
import "../../duena/Productos/Productos.css";

const resumenInicial = {
  total_productos: 0,
  productos_bajos_stock: 0,
  productos_sin_stock: 0,
};

function ProductosLectura() {
  const [productos, setProductos] = useState([]);
  const [resumen, setResumen] = useState(resumenInicial);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState({
    nombre: "",
    categoria: "Todas las categorias",
    estado: "Todos los estados",
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);

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
      const [productosRespuesta, categoriasRespuesta] =
        await Promise.all([
          obtenerProductosColaborador(),
          obtenerCategorias(),
        ]);

      setProductos(productosRespuesta || []);
      setResumen({
        total_productos: (productosRespuesta || []).length,
        productos_bajos_stock: (productosRespuesta || []).filter(
          (producto) => Number(producto.Stock) > 0 && Number(producto.Stock) <= 5
        ).length,
        productos_sin_stock: (productosRespuesta || []).filter(
          (producto) => Number(producto.Stock) === 0
        ).length,
      });
      setCategorias(categoriasRespuesta || []);
    } catch (errorCarga) {
      setError(
        errorCarga.message || "No se pudieron cargar los productos."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const manejarCambioFiltro = (e) => {
    const { name, value } = e.target;

    setFiltros((filtrosActuales) => ({
      ...filtrosActuales,
      [name]: value,
    }));
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados(filtros);
  };

  const limpiarFiltros = () => {
    const filtrosVacios = {
      nombre: "",
      categoria: "Todas las categorias",
      estado: "Todos los estados",
    };

    setFiltros(filtrosVacios);
    setFiltrosAplicados(filtrosVacios);
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const coincideNombre = producto.Nombre.toLowerCase().includes(
        filtrosAplicados.nombre.toLowerCase()
      );

      const coincideCategoria =
        filtrosAplicados.categoria === "Todas las categorias" ||
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
          <p>Consulta de productos disponibles en H&D Boutique</p>
        </div>
      </div>

      {cargando && (
        <p className="estado-productos-mensaje">Cargando inventario...</p>
      )}

      {error && <p className="error-productos">{error}</p>}

      <section className="productos-resumen">
        <article className="resumen-card">
          <span>Total de productos</span>
          <h3>{resumen.total_productos}</h3>
          <p>Productos registrados</p>
        </article>

        <article className="resumen-card">
          <span>Productos bajos en stock</span>
          <h3>{resumen.productos_bajos_stock}</h3>
          <p>Stock entre 1 y 5</p>
        </article>

        <article className="resumen-card">
          <span>Productos sin stock</span>
          <h3>{resumen.productos_sin_stock}</h3>
          <p>Necesitan reposicion</p>
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
          <label>Categoria</label>
          <select
            name="categoria"
            value={filtros.categoria}
            onChange={manejarCambioFiltro}
          >
            <option>Todas las categorias</option>
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
          <button type="button" onClick={aplicarFiltros}>
            Filtrar
          </button>

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
              <th>Categoria</th>
              <th>Talla</th>
              <th>Proveedor</th>
              <th>Precio venta</th>
              <th>Stock</th>
              <th>Estado</th>
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
                    <td>{producto.Categoria || "Sin categoria"}</td>
                    <td>{producto.Talla || "Sin talla"}</td>
                    <td>{producto.Proveedor || "Sin proveedor"}</td>
                    <td>
                      {`C$ ${Number(producto.PrecioUnitario || 0).toLocaleString("es-NI", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                    </td>
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
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="sin-resultados">
                  No se encontraron productos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default ProductosLectura;

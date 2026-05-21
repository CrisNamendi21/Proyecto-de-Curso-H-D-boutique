import { useState } from "react";
import "./Productos.css";

function Productos() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const obtenerCategoriaAutomatica = (nombre) => {
    const texto = nombre.toLowerCase();

    if (texto.includes("vestido")) return "Vestidos";
    if (texto.includes("blusa")) return "Blusas";
    if (texto.includes("pantalón") || texto.includes("pantalon")) return "Pantalones";
    if (texto.includes("camisa")) return "Camisas";
    if (texto.includes("falda")) return "Faldas";
    if (texto.includes("short")) return "Shorts";
    if (texto.includes("top")) return "Tops";

    return "";
  };

  const obtenerEstadoAutomatico = (stock) => {
    const cantidad = Number(stock);

    if (cantidad === 0) return "Sin stock";
    if (cantidad > 0 && cantidad <= 5) return "Bajo stock";

    return "En stock";
  };
/*calculo de ganancias*/
  const calcularPrecioVenta = (costo) => {
    if (costo === "") return "";

    const precio = Number(costo) * 1.15;
    return precio.toFixed(2);
  };

  const [mostrarModal, setMostrarModal] = useState(false);

  const [productos, setProductos] = useState([
    {
      nombre: "Vestido Floral",
      categoria: "Vestidos",
      fecha: obtenerFechaActual(),
      precioVenta: 1250,
      costo: 700,
      stock: 12,
      estado: "En stock",
    },
    {
      nombre: "Blusa Manga Larga",
      categoria: "Blusas",
      fecha: obtenerFechaActual(),
      precioVenta: 950,
      costo: 520,
      stock: 8,
      estado: "En stock",
    },
    {
      nombre: "Pantalón Palazzo",
      categoria: "Pantalones",
      fecha: obtenerFechaActual(),
      precioVenta: 1100,
      costo: 600,
      stock: 5,
      estado: "Bajo stock",
    },
    {
      nombre: "Camisa Oversize",
      categoria: "Camisas",
      fecha: obtenerFechaActual(),
      precioVenta: 850,
      costo: 450,
      stock: 0,
      estado: "Sin stock",
    },
  ]);

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

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    categoria: "",
    fecha: obtenerFechaActual(),
    descripcion: "",
    precioVenta: "",
    costo: "",
    stock: "",
  });

  const abrirModal = () => {
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);

    setNuevoProducto({
      nombre: "",
      categoria: "",
      fecha: obtenerFechaActual(),
      descripcion: "",
      precioVenta: "",
      costo: "",
      stock: "",
    });
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    if (name === "nombre") {
      const soloLetras = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");
      const categoriaDetectada = obtenerCategoriaAutomatica(soloLetras);

      setNuevoProducto({
        ...nuevoProducto,
        nombre: soloLetras,
        categoria: categoriaDetectada,
      });

      return;
    }

    if (name === "costo") {
      const precioCalculado = calcularPrecioVenta(value);

      setNuevoProducto({
        ...nuevoProducto,
        costo: value,
        precioVenta: precioCalculado,
      });

      return;
    }

    setNuevoProducto({
      ...nuevoProducto,
      [name]: value,
    });
  };

  const manejarCambioFiltro = (e) => {
    const { name, value } = e.target;

    setFiltros({
      ...filtros,
      [name]: value,
    });
  };

  const aplicarFiltros = () => {
    setFiltrosAplicados(filtros);
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

  const guardarProducto = (e) => {
    e.preventDefault();

    const fechaActual = obtenerFechaActual();

    if (
      nuevoProducto.nombre.trim() === "" ||
      nuevoProducto.fecha === "" ||
      nuevoProducto.costo === "" ||
      nuevoProducto.stock === ""
    ) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    if (nuevoProducto.categoria === "") {
      alert(
        "No se pudo detectar la categoría. Escribe un nombre como camisa, vestido, blusa, pantalón, falda, short o top."
      );
      return;
    }

    if (nuevoProducto.fecha < fechaActual) {
      alert("No puedes seleccionar una fecha anterior a la fecha actual.");
      return;
    }

    if (Number(nuevoProducto.costo) < 0 || Number(nuevoProducto.stock) < 0) {
      alert("El costo y el stock no pueden ser negativos.");
      return;
    }

    const productoAgregado = {
      nombre: nuevoProducto.nombre,
      categoria: nuevoProducto.categoria,
      fecha: nuevoProducto.fecha,
      precioVenta: Number(nuevoProducto.precioVenta),
      costo: Number(nuevoProducto.costo),
      stock: Number(nuevoProducto.stock),
      estado: obtenerEstadoAutomatico(nuevoProducto.stock),
    };

    setProductos([...productos, productoAgregado]);
    cerrarModal();
  };

  const productosFiltrados = productos.filter((producto) => {
    const coincideNombre = producto.nombre
      .toLowerCase()
      .includes(filtrosAplicados.nombre.toLowerCase());

    const coincideCategoria =
      filtrosAplicados.categoria === "Todas las categorías" ||
      producto.categoria === filtrosAplicados.categoria;

    const coincideEstado =
      filtrosAplicados.estado === "Todos los estados" ||
      producto.estado === filtrosAplicados.estado;

    return coincideNombre && coincideCategoria && coincideEstado;
  });

  const totalProductos = productos.length;

  const valorInventario = productos.reduce((total, producto) => {
    return total + producto.precioVenta * producto.stock;
  }, 0);

  const productosBajoStock = productos.filter(
    (producto) => producto.stock > 0 && producto.stock <= 5
  ).length;

  const productosSinStock = productos.filter(
    (producto) => producto.stock === 0
  ).length;

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

      <section className="productos-resumen">
        <article className="resumen-card">
          <span>Total de productos</span>
          <h3>{totalProductos}</h3>
          <p>Productos registrados</p>
        </article>

        <article className="resumen-card">
          <span>Valor del inventario</span>
          <h3>C$ {valorInventario.toLocaleString()}</h3>
          <p>Valor aproximado</p>
        </article>

        <article className="resumen-card">
          <span>Productos bajos en stock</span>
          <h3>{productosBajoStock}</h3>
          <p>Revisar existencias</p>
        </article>

        <article className="resumen-card">
          <span>Productos sin stock</span>
          <h3>{productosSinStock}</h3>
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
            <option>Vestidos</option>
            <option>Blusas</option>
            <option>Pantalones</option>
            <option>Camisas</option>
            <option>Faldas</option>
            <option>Shorts</option>
            <option>Tops</option>
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
              <th>Categoría</th>
              <th>Fecha</th>
              <th>Precio venta</th>
              <th>Costo</th>
              <th>Stock</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((producto, index) => (
                <tr key={index}>
                  <td>{producto.nombre}</td>
                  <td>{producto.categoria}</td>
                  <td>{producto.fecha}</td>
                  <td>C$ {producto.precioVenta.toLocaleString()}</td>
                  <td>C$ {producto.costo.toLocaleString()}</td>
                  <td>{producto.stock}</td>
                  <td>
                    <span
                      className={`estado-producto ${
                        producto.estado === "En stock"
                          ? "estado-stock"
                          : producto.estado === "Bajo stock"
                          ? "estado-bajo"
                          : "estado-sin"
                      }`}
                    >
                      {producto.estado}
                    </span>
                  </td>
                </tr>
              ))
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

      {mostrarModal && (
        <div className="modal-fondo">
          <div className="modal-producto">
            <div className="modal-header">
              <h3>Agregar producto</h3>

              <button onClick={cerrarModal}>×</button>
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
                  <label>Categoría automática</label>
                  <input
                    type="text"
                    value={nuevoProducto.categoria}
                    placeholder="Se detecta según el nombre"
                    readOnly
                  />
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

                <button type="submit" className="btn-guardar">
                  Guardar producto
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
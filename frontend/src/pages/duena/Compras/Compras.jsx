import { useState } from "react";
import "./Compras.css";

function Compras() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const [mostrarModal, setMostrarModal] = useState(false);

  const [compras, setCompras] = useState([
    {
      id: 1,
      numero: "C-00125",
      fecha: "2026-05-22",
      proveedor: "Textiles Managua",
      categoria: "Blusas",
      producto: "Blusa",
      cantidad: 12,
      monto: 4250,
      estado: "Recibida",
      descripcion: "Compra de blusas para inventario.",
    },
    {
      id: 2,
      numero: "C-00124",
      fecha: "2026-05-22",
      proveedor: "Moda Centro",
      categoria: "Pantalones",
      producto: "Pantalón",
      cantidad: 8,
      monto: 2980,
      estado: "Pendiente",
      descripcion: "Compra pendiente de recepción.",
    },
    {
      id: 3,
      numero: "C-00123",
      fecha: "2026-05-21",
      proveedor: "Distribuidora Rosa",
      categoria: "Vestidos",
      producto: "Vestido",
      cantidad: 10,
      monto: 5600,
      estado: "Recibida",
      descripcion: "Vestidos para temporada.",
    },
    {
      id: 4,
      numero: "C-00122",
      fecha: "2026-05-20",
      proveedor: "Boutique Supply",
      categoria: "Accesorios",
      producto: "Accesorio",
      cantidad: 15,
      monto: 1950,
      estado: "Pendiente",
      descripcion: "Compra de accesorios.",
    },
  ]);

  const [comprasFiltradas, setComprasFiltradas] = useState(compras);

  const [filtros, setFiltros] = useState({
    busqueda: "",
    proveedor: "",
    fecha: "",
    estado: "",
  });

  const [nuevaCompra, setNuevaCompra] = useState({
    numero: "",
    fecha: obtenerFechaActual(),
    proveedor: "",
    categoria: "",
    producto: "",
    cantidad: "",
    monto: "",
    estado: "Pendiente",
    descripcion: "",
  });

  const proveedores = [
    "Textiles Managua",
    "Moda Centro",
    "Distribuidora Rosa",
    "Boutique Supply",
  ];

  const categorias = ["Blusas", "Pantalones", "Vestidos", "Accesorios", "Camisas"];

  const productosPorCategoria = {
    Blusas: ["Blusa", "Top", "Camisa manga corta"],
    Pantalones: ["Pantalón", "Jeans", "Short"],
    Vestidos: ["Vestido", "Vestido casual", "Vestido elegante"],
    Accesorios: ["Accesorio", "Bolso", "Collar"],
    Camisas: ["Camisa", "Camisa formal", "Camisa casual"],
  };

  const totalComprasMes = compras.reduce((total, compra) => total + compra.monto, 0);
  const ordenesRegistradas = compras.length;
  const proveedoresActivos = new Set(compras.map((compra) => compra.proveedor)).size;

  const manejarFiltro = (e) => {
    const { name, value } = e.target;

    setFiltros({
      ...filtros,
      [name]: value,
    });
  };

  const filtrarCompras = () => {
    const texto = filtros.busqueda.toLowerCase().trim();

    const resultado = compras.filter((compra) => {
      const coincideBusqueda =
        compra.numero.toLowerCase().includes(texto) ||
        compra.proveedor.toLowerCase().includes(texto) ||
        compra.producto.toLowerCase().includes(texto);

      const coincideProveedor =
        filtros.proveedor === "" || compra.proveedor === filtros.proveedor;

      const coincideFecha = filtros.fecha === "" || compra.fecha === filtros.fecha;

      const coincideEstado =
        filtros.estado === "" || compra.estado === filtros.estado;

      return (
        coincideBusqueda &&
        coincideProveedor &&
        coincideFecha &&
        coincideEstado
      );
    });

    setComprasFiltradas(resultado);
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      proveedor: "",
      fecha: "",
      estado: "",
    });

    setComprasFiltradas(compras);
  };

  const abrirModal = () => {
    const siguienteNumero = `C-${String(compras.length + 126).padStart(5, "0")}`;

    setNuevaCompra({
      numero: siguienteNumero,
      fecha: obtenerFechaActual(),
      proveedor: "",
      categoria: "",
      producto: "",
      cantidad: "",
      monto: "",
      estado: "Pendiente",
      descripcion: "",
    });

    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
  };

  const manejarNuevaCompra = (e) => {
    const { name, value } = e.target;

    if (name === "fecha") {
      if (value < obtenerFechaActual()) return;
    }

    if (name === "cantidad") {
      if (value !== "" && Number(value) < 1) return;
    }

    if (name === "monto") {
      if (value !== "" && Number(value) < 1) return;
    }

    if (name === "categoria") {
      setNuevaCompra({
        ...nuevaCompra,
        categoria: value,
        producto: "",
      });
      return;
    }

    setNuevaCompra({
      ...nuevaCompra,
      [name]: value,
    });
  };

  const guardarCompra = (e) => {
    e.preventDefault();

    if (
      nuevaCompra.numero.trim() === "" ||
      nuevaCompra.proveedor.trim() === "" ||
      nuevaCompra.categoria.trim() === "" ||
      nuevaCompra.producto.trim() === "" ||
      nuevaCompra.cantidad === "" ||
      nuevaCompra.monto === ""
    ) {
      alert("Por favor, complete todos los campos obligatorios.");
      return;
    }

    const compraGuardada = {
      id: compras.length + 1,
      numero: nuevaCompra.numero,
      fecha: nuevaCompra.fecha,
      proveedor: nuevaCompra.proveedor,
      categoria: nuevaCompra.categoria,
      producto: nuevaCompra.producto,
      cantidad: Number(nuevaCompra.cantidad),
      monto: Number(nuevaCompra.monto),
      estado: nuevaCompra.estado,
      descripcion: nuevaCompra.descripcion,
    };

    const nuevasCompras = [compraGuardada, ...compras];

    setCompras(nuevasCompras);
    setComprasFiltradas(nuevasCompras);
    setMostrarModal(false);
  };

  const formatoDinero = (valor) => {
    return `C$ ${Number(valor).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <section className="compras-page">
      <div className="compras-top">
        <h1>Compras</h1>
        <p>Controla las compras realizadas a proveedores.</p>
      </div>

      <div className="compras-resumen">
        <article className="compra-card">
          <div>
            <p>Compras del mes</p>
            <h3>{formatoDinero(totalComprasMes)}</h3>
          </div>
        </article>

        <article className="compra-card">
          <div>
            <p>Órdenes registradas</p>
            <h3>{ordenesRegistradas}</h3>
          </div>
        </article>

        <article className="compra-card">
          <div>
            <p>Monto invertido</p>
            <h3>{formatoDinero(totalComprasMes)}</h3>
          </div>
        </article>

        <article className="compra-card">
          <div>
            <p>Proveedores activos</p>
            <h3>{proveedoresActivos}</h3>
          </div>
        </article>
      </div>

      <div className="compras-filtros-panel">
        <div className="campo-filtro">
          <label>Buscar compra</label>
          <input
            type="text"
            name="busqueda"
            placeholder="Buscar por número, proveedor o producto"
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
              <option key={proveedor} value={proveedor}>
                {proveedor}
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

        <button className="btn-filtrar" onClick={filtrarCompras}>
          Filtrar
        </button>

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
                  <th>Producto principal</th>
                  <th>Cantidad</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {comprasFiltradas.length > 0 ? (
                  comprasFiltradas.map((compra) => (
                    <tr key={compra.id}>
                      <td>{compra.numero}</td>
                      <td>{compra.fecha}</td>
                      <td>{compra.proveedor}</td>
                      <td>{compra.producto}</td>
                      <td>{compra.cantidad}</td>
                      <td>{formatoDinero(compra.monto)}</td>
                      <td>
                        <span
                          className={
                            compra.estado === "Recibida"
                              ? "estado-recibida"
                              : "estado-pendiente"
                          }
                        >
                          {compra.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="sin-resultados" colSpan="7">
                      No se encontraron compras.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="resumen-inferior">
        <div className="grafico-compras">
          <h2>Resumen de compras</h2>

          <div className="barras-compras">
            <div className="barra-item">
              <div className="barra" style={{ height: "78%" }}></div>
              <p>Blusas</p>
            </div>

            <div className="barra-item">
              <div className="barra" style={{ height: "45%" }}></div>
              <p>Pantalones</p>
            </div>

            <div className="barra-item">
              <div className="barra" style={{ height: "60%" }}></div>
              <p>Vestidos</p>
            </div>

            <div className="barra-item">
              <div className="barra" style={{ height: "28%" }}></div>
              <p>Accesorios</p>
            </div>

            <div className="barra-item">
              <div className="barra" style={{ height: "40%" }}></div>
              <p>Camisas</p>
            </div>
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
              <div className="campo-compra">
                <label>No. compra</label>
                <input
                  type="text"
                  name="numero"
                  placeholder="Ej. C-00126"
                  value={nuevaCompra.numero}
                  onChange={manejarNuevaCompra}
                />
              </div>

              <div className="campo-compra">
                <label>Categoría</label>
                <select
                  name="categoria"
                  value={nuevaCompra.categoria}
                  onChange={manejarNuevaCompra}
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo-compra">
                <label>Proveedor</label>
                <select
                  name="proveedor"
                  value={nuevaCompra.proveedor}
                  onChange={manejarNuevaCompra}
                >
                  <option value="">Selecciona un proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor} value={proveedor}>
                      {proveedor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo-compra">
                <label>Producto principal</label>
                <select
                  name="producto"
                  value={nuevaCompra.producto}
                  onChange={manejarNuevaCompra}
                  disabled={nuevaCompra.categoria === ""}
                >
                  <option value="">Selecciona un producto</option>
                  {nuevaCompra.categoria &&
                    productosPorCategoria[nuevaCompra.categoria].map((producto) => (
                      <option key={producto} value={producto}>
                        {producto}
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
                <label>Monto total</label>
                <input
                  type="number"
                  name="monto"
                  min="1"
                  placeholder="Ej. 3500.00"
                  value={nuevaCompra.monto}
                  onChange={manejarNuevaCompra}
                />
              </div>

              <div className="campo-compra">
                <label>Cantidad de productos</label>
                <input
                  type="number"
                  name="cantidad"
                  min="1"
                  placeholder="Ej. 10"
                  value={nuevaCompra.cantidad}
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

              <div className="campo-compra campo-descripcion">
                <label>Descripción opcional</label>
                <textarea
                  name="descripcion"
                  placeholder="Agrega una descripción de la compra..."
                  value={nuevaCompra.descripcion}
                  onChange={manejarNuevaCompra}
                ></textarea>
              </div>

              <div className="modal-compra-botones">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-guardar">
                  Guardar compra
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
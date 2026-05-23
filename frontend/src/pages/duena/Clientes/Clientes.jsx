import { useState } from "react";
import "./Clientes.css";

function Clientes() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const [mostrarModal, setMostrarModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroDepartamento, setFiltroDepartamento] = useState("Todos");

  const [tipoAplicado, setTipoAplicado] = useState("Todos");
  const [departamentoAplicado, setDepartamentoAplicado] = useState("Todos");

  const [clientes, setClientes] = useState([
    {
      id: 1,
      codigo: "CLI-001",
      nombre: "María José Martínez",
      telefono: "88881234",
      correo: "maria@email.com",
      departamento: "Managua",
      direccion: "Managua, Nicaragua",
      tipo: "Frecuente",
      fechaRegistro: "2026-05-21",
    },
    {
      id: 2,
      codigo: "CLI-002",
      nombre: "Carla Sofía López",
      telefono: "88115678",
      correo: "carla@email.com",
      departamento: "León",
      direccion: "León, Nicaragua",
      tipo: "Frecuente",
      fechaRegistro: "2026-05-21",
    },
    {
      id: 3,
      codigo: "CLI-003",
      nombre: "Andrea Valentina Ruiz",
      telefono: "88552468",
      correo: "andrea@email.com",
      departamento: "Estelí",
      direccion: "Estelí, Nicaragua",
      tipo: "Nuevo",
      fechaRegistro: "2026-05-21",
    },
    {
      id: 4,
      codigo: "CLI-004",
      nombre: "Gabriela Hernández",
      telefono: "87993344",
      correo: "gabriela@email.com",
      departamento: "Masaya",
      direccion: "Masaya, Nicaragua",
      tipo: "Ocasional",
      fechaRegistro: "2026-05-20",
    },
    {
      id: 5,
      codigo: "CLI-005",
      nombre: "Natalia Isabel Castro",
      telefono: "88779988",
      correo: "natalia@email.com",
      departamento: "Granada",
      direccion: "Granada, Nicaragua",
      tipo: "Inactivo",
      fechaRegistro: "2026-05-19",
    },
  ]);

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    departamento: "",
    direccion: "",
    tipo: "",
    fechaRegistro: obtenerFechaActual(),
    notas: "",
  });

  const abrirModal = () => {
    setNuevoCliente({
      nombre: "",
      telefono: "",
      correo: "",
      departamento: "",
      direccion: "",
      tipo: "",
      fechaRegistro: obtenerFechaActual(),
      notas: "",
    });

    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
  };

  const manejarNombre = (e) => {
    const valor = e.target.value;

    if (/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]*$/.test(valor)) {
      setNuevoCliente({
        ...nuevoCliente,
        nombre: valor,
      });
    }
  };

  const manejarTelefono = (e) => {
    const valor = e.target.value;

    if (/^[0-9]*$/.test(valor)) {
      setNuevoCliente({
        ...nuevoCliente,
        telefono: valor,
      });
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setNuevoCliente({
      ...nuevoCliente,
      [name]: value,
    });
  };

  const aplicarFiltros = () => {
    setTipoAplicado(filtroTipo);
    setDepartamentoAplicado(filtroDepartamento);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroTipo("Todos");
    setFiltroDepartamento("Todos");
    setTipoAplicado("Todos");
    setDepartamentoAplicado("Todos");
  };

  const guardarCliente = (e) => {
    e.preventDefault();

    if (
      nuevoCliente.nombre.trim() === "" ||
      nuevoCliente.telefono.trim() === "" ||
      nuevoCliente.correo.trim() === "" ||
      nuevoCliente.departamento.trim() === "" ||
      nuevoCliente.direccion.trim() === "" ||
      nuevoCliente.tipo.trim() === "" ||
      nuevoCliente.fechaRegistro.trim() === ""
    ) {
      alert("Por favor, complete todos los campos obligatorios.");
      return;
    }

    if (nuevoCliente.telefono.length !== 8) {
      alert("El teléfono debe tener 8 números.");
      return;
    }

    const clienteAgregado = {
      id: clientes.length + 1,
      codigo: `CLI-${String(clientes.length + 1).padStart(3, "0")}`,
      nombre: nuevoCliente.nombre,
      telefono: nuevoCliente.telefono,
      correo: nuevoCliente.correo,
      departamento: nuevoCliente.departamento,
      direccion: nuevoCliente.direccion,
      tipo: nuevoCliente.tipo,
      fechaRegistro: nuevoCliente.fechaRegistro,
    };

    setClientes([...clientes, clienteAgregado]);
    setMostrarModal(false);
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    const coincideBusqueda =
      cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.telefono.includes(busqueda) ||
      cliente.codigo.toLowerCase().includes(busqueda.toLowerCase());

    const coincideTipo =
      tipoAplicado === "Todos" || cliente.tipo === tipoAplicado;

    const coincideDepartamento =
      departamentoAplicado === "Todos" ||
      cliente.departamento === departamentoAplicado;

    return coincideBusqueda && coincideTipo && coincideDepartamento;
  });

  const totalClientes = clientes.length;

  const clientesNuevos = clientes.filter(
    (cliente) => cliente.tipo === "Nuevo"
  ).length;

  const clientesFrecuentes = clientes.filter(
    (cliente) => cliente.tipo === "Frecuente"
  ).length;

  const clientesInactivos = clientes.filter(
    (cliente) => cliente.tipo === "Inactivo"
  ).length;

  const clientesActivos = totalClientes - clientesInactivos;

  const clientesRecientes = [...clientes].slice(-5).reverse();

  return (
    <section className="clientes-page">
      <div className="clientes-titulo">
        <h2>Clientes</h2>
      </div>

      <div className="clientes-estadisticas">
        <div className="cliente-stat-card">
         
          <div>
            <span>Clientes registrados</span>
            <strong>{totalClientes}</strong>
          </div>
        </div>

        <div className="cliente-stat-card">
        
          <div>
            <span>Clientes nuevos</span>
            <strong>{clientesNuevos}</strong>
            <small>Este mes</small>
          </div>
        </div>

        <div className="cliente-stat-card">
          
          <div>
            <span>Clientes frecuentes</span>
            <strong>{clientesFrecuentes}</strong>
            <small>Compras recurrentes</small>
          </div>
        </div>

        <div className="cliente-stat-card">
          
          <div>
            <span>Clientes activos</span>
            <strong>{clientesActivos}</strong>
            <small>Con actividad reciente</small>
          </div>
        </div>
      </div>

      <div className="clientes-filtros">
        <div className="clientes-buscador">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span></span>
        </div>

        <div className="campo-filtro">
          <label>Tipo de cliente</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option>Todos</option>
            <option>Frecuente</option>
            <option>Nuevo</option>
            <option>Ocasional</option>
            <option>Inactivo</option>
          </select>
        </div>

        <div className="campo-filtro">
          <label>Departamento</label>
          <select
            value={filtroDepartamento}
            onChange={(e) => setFiltroDepartamento(e.target.value)}
          >
            <option>Todos</option>
            <option>Managua</option>
            <option>León</option>
            <option>Masaya</option>
            <option>Granada</option>
            <option>Estelí</option>
            <option>Chinandega</option>
            <option>Carazo</option>
            <option>Rivas</option>
            <option>Matagalpa</option>
          </select>
        </div>

        <button className="btn-filtrar" onClick={aplicarFiltros}>
          Filtrar
        </button>

        <button className="btn-limpiar" onClick={limpiarFiltros}>
          Limpiar
        </button>

        <button className="btn-agregar-cliente" onClick={abrirModal}>
          + Agregar cliente
        </button>
      </div>

      <div className="clientes-contenido">
        <div className="clientes-tabla-card">
          <h3>Listado de clientes</h3>

          <div className="clientes-tabla-scroll">
            <table className="clientes-tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Departamento</th>
                  <th>Tipo</th>
                  <th>Fecha de registro</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>{cliente.codigo}</td>
                      <td>{cliente.nombre}</td>
                      <td>{cliente.telefono}</td>
                      <td>{cliente.departamento}</td>
                      <td>
                        <span
                          className={`cliente-tipo ${cliente.tipo.toLowerCase()}`}
                        >
                          {cliente.tipo}
                        </span>
                      </td>
                      <td>{cliente.fechaRegistro}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="sin-clientes">
                      No se encontraron clientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="clientes-paneles">
          <div className="clientes-recientes-card">
            <h3>Clientes recientes</h3>

            {clientesRecientes.map((cliente) => (
              <div className="cliente-reciente" key={cliente.id}>
                <div className="cliente-reciente-icon"></div>
                <div>
                  <strong>{cliente.nombre}</strong>
                  <span>{cliente.fechaRegistro}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="clientes-resumen-card">
            <h3>Resumen de clientes</h3>

            <div className="resumen-item">
              <span>Frecuentes</span>
              <strong>{clientesFrecuentes}</strong>
            </div>

            <div className="resumen-item">
              <span>Nuevos</span>
              <strong>{clientesNuevos}</strong>
            </div>

            <div className="resumen-item">
              <span>Ocasionales</span>
              <strong>
                {
                  clientes.filter((cliente) => cliente.tipo === "Ocasional")
                    .length
                }
              </strong>
            </div>

            <div className="resumen-item">
              <span>Inactivos</span>
              <strong>{clientesInactivos}</strong>
            </div>

            <div className="resumen-total">
              <span>Total</span>
              <strong>{totalClientes}</strong>
            </div>
          </div>
        </div>
      </div>

      {mostrarModal && (
        <div className="modal-clientes-fondo">
          <div className="modal-clientes">
            <div className="modal-clientes-header">
              <h3>Agregar cliente</h3>

              <button type="button" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="form-clientes" onSubmit={guardarCliente}>
              <div className="form-clientes-grid">
                <div className="campo-cliente">
                  <label>Nombre completo *</label>
                  <input
                    type="text"
                    placeholder="Ingrese el nombre completo"
                    value={nuevoCliente.nombre}
                    onChange={manejarNombre}
                  />
                </div>

                <div className="campo-cliente">
                  <label>Teléfono *</label>
                  <input
                    type="text"
                    placeholder="Ingrese el teléfono"
                    value={nuevoCliente.telefono}
                    onChange={manejarTelefono}
                    maxLength="8"
                  />
                </div>

                <div className="campo-cliente">
                  <label>Correo electrónico *</label>
                  <input
                    type="email"
                    placeholder="Ingrese el correo electrónico"
                    name="correo"
                    value={nuevoCliente.correo}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="campo-cliente">
                  <label>Departamento *</label>
                  <select
                    name="departamento"
                    value={nuevoCliente.departamento}
                    onChange={manejarCambio}
                  >
                    <option value="">Seleccione el departamento</option>
                    <option value="Managua">Managua</option>
                    <option value="León">León</option>
                    <option value="Masaya">Masaya</option>
                    <option value="Granada">Granada</option>
                    <option value="Estelí">Estelí</option>
                    <option value="Chinandega">Chinandega</option>
                    <option value="Carazo">Carazo</option>
                    <option value="Rivas">Rivas</option>
                    <option value="Matagalpa">Matagalpa</option>
                  </select>
                </div>

                <div className="campo-cliente">
                  <label>Tipo de cliente *</label>
                  <select
                    name="tipo"
                    value={nuevoCliente.tipo}
                    onChange={manejarCambio}
                  >
                    <option value="">Seleccione el tipo</option>
                    <option value="Frecuente">Frecuente</option>
                    <option value="Nuevo">Nuevo</option>
                    <option value="Ocasional">Ocasional</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div className="campo-cliente">
                  <label>Fecha de registro *</label>
                  <input
                    type="date"
                    name="fechaRegistro"
                    value={nuevoCliente.fechaRegistro}
                    min={obtenerFechaActual()}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="campo-cliente campo-cliente-ancho">
                  <label>Dirección *</label>
                  <input
                    type="text"
                    placeholder="Ingrese la dirección"
                    name="direccion"
                    value={nuevoCliente.direccion}
                    onChange={manejarCambio}
                  />
                </div>

                <div className="campo-cliente campo-cliente-ancho">
                  <label>Notas adicionales</label>
                  <textarea
                    placeholder="Notas adicionales opcional"
                    name="notas"
                    value={nuevoCliente.notas}
                    onChange={manejarCambio}
                  ></textarea>
                </div>
              </div>

              <div className="modal-clientes-botones">
                <button
                  type="button"
                  className="btn-cancelar-cliente"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-guardar-cliente">
                  Guardar cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Clientes;
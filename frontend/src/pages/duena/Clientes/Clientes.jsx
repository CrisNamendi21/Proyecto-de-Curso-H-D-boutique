import { useEffect, useState } from "react";
import {
  crearClienteCompleto,
  obtenerClientes,
  obtenerClientesRecientes,
  obtenerDepartamentos,
  obtenerMunicipiosPorDepartamento,
  obtenerResumenClientes,
} from "../../../api/api";
import "./Clientes.css";

const resumenInicial = {
  clientes_registrados: 0,
  clientes_nuevos_mes: 0,
  clientes_activos: 0,
  clientes_con_direccion: 0,
};

const formularioInicial = {
  nombres: "",
  apellidos: "",
  telefono: "",
  idDepartamento: "",
  idMunicipio: "",
  direccion: "",
};

function Clientes() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("Todos");
  const [clientes, setClientes] = useState([]);
  const [clientesRecientes, setClientesRecientes] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [resumen, setResumen] = useState(resumenInicial);
  const [nuevoCliente, setNuevoCliente] = useState(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [cargandoMunicipios, setCargandoMunicipios] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarClientes = async (filtros = {}) => {
    setCargando(true);
    setError("");

    try {
      const [resumenRespuesta, clientesRespuesta, recientesRespuesta] =
        await Promise.all([
          obtenerResumenClientes(),
          obtenerClientes(filtros),
          obtenerClientesRecientes(),
        ]);

      setResumen(resumenRespuesta || resumenInicial);
      setClientes(clientesRespuesta || []);
      setClientesRecientes(recientesRespuesta || []);
    } catch (errorClientes) {
      console.error("Error al cargar clientes:", errorClientes);
      setClientes([]);
      setClientesRecientes([]);
      setResumen(resumenInicial);
      setError(
        errorClientes.message || "No se pudieron cargar los clientes."
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarDepartamentos = async () => {
    try {
      const departamentosRespuesta = await obtenerDepartamentos();
      setDepartamentos(departamentosRespuesta || []);
    } catch (errorDepartamentos) {
      console.error("Error al cargar departamentos:", errorDepartamentos);
      setDepartamentos([]);
      setError(
        errorDepartamentos.message || "No se pudieron cargar departamentos."
      );
    }
  };

  const cargarMunicipios = async (idDepartamento) => {
    if (!idDepartamento) {
      setMunicipios([]);
      return;
    }

    setCargandoMunicipios(true);
    setError("");

    try {
      const municipiosRespuesta = await obtenerMunicipiosPorDepartamento(
        idDepartamento
      );
      setMunicipios(municipiosRespuesta || []);
    } catch (errorMunicipios) {
      console.error("Error al cargar municipios:", errorMunicipios);
      setMunicipios([]);
      setError(errorMunicipios.message || "No se pudieron cargar municipios.");
    } finally {
      setCargandoMunicipios(false);
    }
  };

  useEffect(() => {
    cargarClientes();
    cargarDepartamentos();
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarClientes({
        busqueda: busqueda.trim(),
        departamento: filtroDepartamento,
      });
    }, 250);

    return () => clearTimeout(temporizador);
  }, [busqueda, filtroDepartamento]);

  const abrirModal = () => {
    setNuevoCliente(formularioInicial);
    setMunicipios([]);
    setError("");
    setMensaje("");
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setNuevoCliente(formularioInicial);
    setMunicipios([]);
    setGuardando(false);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    if (name === "idDepartamento") {
      setNuevoCliente((clienteActual) => ({
        ...clienteActual,
        idDepartamento: value,
        idMunicipio: "",
      }));
      cargarMunicipios(value);
      return;
    }

    setNuevoCliente((clienteActual) => ({
      ...clienteActual,
      [name]: value,
    }));
  };

  const manejarTexto = (e) => {
    const { name, value } = e.target;

    if (/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]*$/.test(value)) {
      setNuevoCliente((clienteActual) => ({
        ...clienteActual,
        [name]: value,
      }));
    }
  };

  const manejarTelefono = (e) => {
    const valor = e.target.value;

    if (/^[0-9]*$/.test(valor)) {
      setNuevoCliente((clienteActual) => ({
        ...clienteActual,
        telefono: valor,
      }));
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroDepartamento("Todos");
    setMensaje("");
  };

  const validarCliente = () => {
    if (!nuevoCliente.nombres.trim()) {
      return "El nombre del cliente es obligatorio.";
    }

    if (!nuevoCliente.apellidos.trim()) {
      return "El apellido del cliente es obligatorio.";
    }

    if (nuevoCliente.telefono && nuevoCliente.telefono.length !== 8) {
      return "El teléfono debe tener 8 números.";
    }

    if (!nuevoCliente.idDepartamento) {
      return "Debes seleccionar un departamento.";
    }

    if (!nuevoCliente.idMunicipio) {
      return "Debes seleccionar un municipio.";
    }

    const municipioSeleccionado = municipios.find(
      (municipio) =>
        String(municipio.ID_Municipio) === String(nuevoCliente.idMunicipio)
    );

    if (
      !municipioSeleccionado ||
      String(municipioSeleccionado.ID_Departamento) !==
        String(nuevoCliente.idDepartamento)
    ) {
      return "El municipio seleccionado no pertenece al departamento indicado.";
    }

    if (!nuevoCliente.direccion.trim()) {
      return "La dirección del cliente es obligatoria.";
    }

    return "";
  };

  const guardarCliente = async (e) => {
    e.preventDefault();

    const errorValidacion = validarCliente();

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    const payload = {
      Nombres: nuevoCliente.nombres.trim(),
      Apellidos: nuevoCliente.apellidos.trim(),
      NumeroTelefono: nuevoCliente.telefono.trim() || null,
      Direccion: nuevoCliente.direccion.trim(),
      ID_Departamento: Number(nuevoCliente.idDepartamento),
      ID_Municipio: Number(nuevoCliente.idMunicipio),
    };

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await crearClienteCompleto(payload);
      setMensaje("Cliente creado correctamente.");
      cerrarModal();
      await cargarClientes({
        busqueda: busqueda.trim(),
        departamento: filtroDepartamento,
      });
    } catch (errorGuardar) {
      console.error("Error al guardar cliente:", errorGuardar);
      setError(errorGuardar.message || "No se pudo guardar el cliente.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="clientes-page">
      <div className="clientes-titulo">
        <h2>Clientes</h2>
      </div>

      {mensaje && <div className="clientes-mensaje">{mensaje}</div>}
      {error && <div className="clientes-error">{error}</div>}

      <div className="clientes-estadisticas">
        <div className="cliente-stat-card">
          <div>
            <span>Clientes registrados</span>
            <strong>{resumen.clientes_registrados}</strong>
          </div>
        </div>

        <div className="cliente-stat-card">
          <div>
            <span>Clientes nuevos</span>
            <strong>{resumen.clientes_nuevos_mes}</strong>
            <small>Este mes</small>
          </div>
        </div>

        <div className="cliente-stat-card">
          <div>
            <span>Clientes activos</span>
            <strong>{resumen.clientes_activos}</strong>
          </div>
        </div>

        <div className="cliente-stat-card">
          <div>
            <span>Clientes con dirección</span>
            <strong>{resumen.clientes_con_direccion}</strong>
          </div>
        </div>
      </div>

      <div className="clientes-filtros">
        <div className="clientes-buscador">
          <input
            type="text"
            placeholder="Buscar por ID, nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span></span>
        </div>

        <div className="campo-filtro">
          <label>Departamento</label>
          <select
            value={filtroDepartamento}
            onChange={(e) => setFiltroDepartamento(e.target.value)}
          >
            <option value="Todos">Todos</option>
            {departamentos.map((departamento) => (
              <option
                key={departamento.ID_Departamento}
                value={departamento.ID_Departamento}
              >
                {departamento.Departamento}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-limpiar" onClick={limpiarFiltros}>
          Limpiar
        </button>

        <button className="btn-agregar-cliente" onClick={abrirModal}>
          + Agregar cliente
        </button>
      </div>

      <div className="clientes-contenido clientes-contenido-simple">
        <div className="clientes-tabla-card">
          <h3>Listado de clientes</h3>

          <div className="clientes-tabla-scroll">
            <table className="clientes-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Departamento</th>
                  <th>Municipio</th>
                  <th>Dirección</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="7" className="sin-clientes">
                      Cargando clientes...
                    </td>
                  </tr>
                ) : clientes.length > 0 ? (
                  clientes.map((cliente) => (
                    <tr key={cliente.ID_Cliente}>
                      <td>{cliente.ID_Cliente}</td>
                      <td>{cliente.NombreCompleto}</td>
                      <td>{cliente.NumeroTelefono || "Sin teléfono"}</td>
                      <td>{cliente.Departamento || "Sin departamento"}</td>
                      <td>{cliente.Municipio || "No registrado"}</td>
                      <td>{cliente.Direccion || "Sin dirección"}</td>
                      <td>
                        <span
                          className={
                            cliente.Estado === "ACTIVO"
                              ? "cliente-estado activo"
                              : "cliente-estado inactivo"
                          }
                        >
                          {cliente.Estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="sin-clientes">
                      No se encontraron clientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="clientes-paneles clientes-paneles-simple">
          <div className="clientes-recientes-card">
            <h3>Clientes recientes</h3>

            {clientesRecientes.length > 0 ? (
              clientesRecientes.map((cliente) => (
                <div className="cliente-reciente" key={cliente.ID_Cliente}>
                  <div className="cliente-reciente-icon"></div>
                  <div>
                    <strong>{cliente.NombreCompleto}</strong>
                    <span>ID {cliente.ID_Cliente}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="clientes-vacio">No hay clientes registrados.</p>
            )}
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
                  <label>Nombres *</label>
                  <input
                    type="text"
                    placeholder="Ingrese los nombres"
                    name="nombres"
                    value={nuevoCliente.nombres}
                    onChange={manejarTexto}
                  />
                </div>

                <div className="campo-cliente">
                  <label>Apellidos *</label>
                  <input
                    type="text"
                    placeholder="Ingrese los apellidos"
                    name="apellidos"
                    value={nuevoCliente.apellidos}
                    onChange={manejarTexto}
                  />
                </div>

                <div className="campo-cliente">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ingrese el teléfono"
                    value={nuevoCliente.telefono}
                    onChange={manejarTelefono}
                    maxLength="8"
                  />
                </div>

                <div className="campo-cliente">
                  <label>Departamento *</label>
                  <select
                    name="idDepartamento"
                    value={nuevoCliente.idDepartamento}
                    onChange={manejarCambio}
                  >
                    <option value="">Seleccione el departamento</option>
                    {departamentos.map((departamento) => (
                      <option
                        key={departamento.ID_Departamento}
                        value={departamento.ID_Departamento}
                      >
                        {departamento.Departamento}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="campo-cliente">
                  <label>Municipio *</label>
                  <select
                    name="idMunicipio"
                    value={nuevoCliente.idMunicipio}
                    onChange={manejarCambio}
                    disabled={!nuevoCliente.idDepartamento || cargandoMunicipios}
                  >
                    <option value="">
                      {cargandoMunicipios
                        ? "Cargando municipios..."
                        : "Seleccione el municipio"}
                    </option>
                    {municipios.map((municipio) => (
                      <option
                        key={municipio.ID_Municipio}
                        value={municipio.ID_Municipio}
                      >
                        {municipio.Municipio}
                      </option>
                    ))}
                  </select>
                  {nuevoCliente.idDepartamento &&
                    !cargandoMunicipios &&
                    municipios.length === 0 && (
                      <small>No hay municipios disponibles para este departamento.</small>
                    )}
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
              </div>

              <div className="modal-clientes-botones">
                <button
                  type="button"
                  className="btn-cancelar-cliente"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-guardar-cliente"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar cliente"}
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

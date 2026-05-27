import { useEffect, useState } from "react";
import {
  cambiarEstadoEmpleado,
  crearEmpleadoCompleto,
  obtenerDepartamentos,
  obtenerEmpleados,
  obtenerMunicipiosPorDepartamento,
  obtenerResumenEmpleados,
} from "../../../api/api";
import "./Empleados.css";

const resumenInicial = {
  empleados_registrados: 0,
  activos: 0,
  inactivos: 0,
  colaboradores: 0,
};

const formularioInicial = {
  nombres: "",
  apellidos: "",
  telefono: "",
  correo: "",
  cargo: "Empleado",
  fechaIngreso: "",
  direccion: "",
  idDepartamento: "",
  idMunicipio: "",
};

function Empleados() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [resumen, setResumen] = useState(resumenInicial);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    ...formularioInicial,
    fechaIngreso: obtenerFechaActual(),
  });
  const [cargando, setCargando] = useState(true);
  const [cargandoMunicipios, setCargandoMunicipios] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [empleadoProcesando, setEmpleadoProcesando] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarEmpleados = async (filtros = {}) => {
    setCargando(true);
    setError("");

    try {
      const [resumenRespuesta, empleadosRespuesta] = await Promise.all([
        obtenerResumenEmpleados(),
        obtenerEmpleados(filtros),
      ]);

      setResumen(resumenRespuesta || resumenInicial);
      setEmpleados(empleadosRespuesta || []);
    } catch (errorEmpleados) {
      console.error("Error al cargar empleados:", errorEmpleados);
      setResumen(resumenInicial);
      setEmpleados([]);
      setError(errorEmpleados.message || "No se pudieron cargar empleados.");
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
    cargarEmpleados();
    cargarDepartamentos();
  }, []);

  const abrirModal = () => {
    setNuevoEmpleado({
      ...formularioInicial,
      fechaIngreso: obtenerFechaActual(),
    });
    setMunicipios([]);
    setError("");
    setMensaje("");
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setMunicipios([]);
    setGuardando(false);
  };

  const soloLetras = (valor) => {
    return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  };

  const soloNumeros = (valor) => {
    return valor.replace(/[^0-9]/g, "");
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    if (name === "nombres" || name === "apellidos") {
      setNuevoEmpleado((empleadoActual) => ({
        ...empleadoActual,
        [name]: soloLetras(value),
      }));
      return;
    }

    if (name === "telefono") {
      setNuevoEmpleado((empleadoActual) => ({
        ...empleadoActual,
        telefono: soloNumeros(value).slice(0, 8),
      }));
      return;
    }

    if (name === "idDepartamento") {
      setNuevoEmpleado((empleadoActual) => ({
        ...empleadoActual,
        idDepartamento: value,
        idMunicipio: "",
      }));
      cargarMunicipios(value);
      return;
    }

    setNuevoEmpleado((empleadoActual) => ({
      ...empleadoActual,
      [name]: value,
    }));
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstadoFiltro("Todos");
    setMensaje("");
    cargarEmpleados();
  };

  const aplicarFiltros = () => {
    setMensaje("");
    cargarEmpleados({
      busqueda: busqueda.trim(),
      estado: estadoFiltro,
    });
  };

  const validarEmpleado = () => {
    if (!nuevoEmpleado.nombres.trim()) {
      return "El nombre del empleado es obligatorio.";
    }

    if (!nuevoEmpleado.apellidos.trim()) {
      return "El apellido del empleado es obligatorio.";
    }

    if (nuevoEmpleado.telefono.length !== 8) {
      return "El teléfono debe tener 8 dígitos.";
    }

    if (!nuevoEmpleado.fechaIngreso) {
      return "La fecha de ingreso es obligatoria.";
    }

    if (!nuevoEmpleado.direccion.trim()) {
      return "La dirección del empleado es obligatoria.";
    }

    if (!nuevoEmpleado.idDepartamento) {
      return "Debes seleccionar un departamento.";
    }

    if (!nuevoEmpleado.idMunicipio) {
      return "Debes seleccionar un municipio.";
    }

    const municipioSeleccionado = municipios.find(
      (municipio) =>
        String(municipio.ID_Municipio) === String(nuevoEmpleado.idMunicipio)
    );

    if (
      !municipioSeleccionado ||
      String(municipioSeleccionado.ID_Departamento) !==
        String(nuevoEmpleado.idDepartamento)
    ) {
      return "El municipio seleccionado no pertenece al departamento indicado.";
    }

    return "";
  };

  const agregarEmpleado = async (e) => {
    e.preventDefault();

    const errorValidacion = validarEmpleado();

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    const payload = {
      Nombres: nuevoEmpleado.nombres.trim(),
      Apellidos: nuevoEmpleado.apellidos.trim(),
      NumeroTelefono: nuevoEmpleado.telefono.trim(),
      CorreoProfesional: nuevoEmpleado.correo.trim() || null,
      Cargo: nuevoEmpleado.cargo.trim() || "Empleado",
      FechaInicio: nuevoEmpleado.fechaIngreso,
      Direccion: nuevoEmpleado.direccion.trim(),
      ID_Departamento: Number(nuevoEmpleado.idDepartamento),
      ID_Municipio: Number(nuevoEmpleado.idMunicipio),
    };

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await crearEmpleadoCompleto(payload);
      setMensaje("Empleado creado correctamente.");
      cerrarModal();
      await cargarEmpleados({
        busqueda: busqueda.trim(),
        estado: estadoFiltro,
      });
    } catch (errorGuardar) {
      console.error("Error al guardar empleado:", errorGuardar);
      setError(errorGuardar.message || "No se pudo guardar el empleado.");
    } finally {
      setGuardando(false);
    }
  };

  const manejarEstadoEmpleado = async (empleado) => {
    const nuevoEstado = empleado.Estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const confirmar = window.confirm(
      `¿Deseas ${nuevoEstado === "ACTIVO" ? "activar" : "desactivar"} este empleado?`
    );

    if (!confirmar) {
      return;
    }

    setEmpleadoProcesando(empleado.ID_Empleado);
    setError("");
    setMensaje("");

    try {
      await cambiarEstadoEmpleado(empleado.ID_Empleado, nuevoEstado);
      setMensaje(`Empleado ${nuevoEstado === "ACTIVO" ? "activado" : "desactivado"} correctamente.`);
      await cargarEmpleados({
        busqueda: busqueda.trim(),
        estado: estadoFiltro,
      });
    } catch (errorEstado) {
      console.error("Error al cambiar estado:", errorEstado);
      setError(errorEstado.message || "No se pudo cambiar el estado.");
    } finally {
      setEmpleadoProcesando(null);
    }
  };

  return (
    <div className="empleados-page">
      <div className="empleados-header">
        <div>
          <h2>Empleados</h2>
          <p>Gestión de empleados registrados en H&D Boutique</p>
        </div>
      </div>

      {mensaje && <div className="empleados-mensaje">{mensaje}</div>}
      {error && <div className="empleados-error">{error}</div>}

      <div className="empleados-resumen">
        <div className="empleado-card">
          <span>Empleados registrados</span>
          <strong>{resumen.empleados_registrados}</strong>
        </div>

        <div className="empleado-card">
          <span>Activos</span>
          <strong>{resumen.activos}</strong>
        </div>

        <div className="empleado-card">
          <span>Inactivos</span>
          <strong>{resumen.inactivos}</strong>
        </div>

        <div className="empleado-card">
          <span>Colaboradores</span>
          <strong>{resumen.colaboradores}</strong>
        </div>
      </div>

      <div className="empleados-filtros">
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        >
          <option value="Todos">Estado: Todos</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>

        <button className="btn-filtrar" onClick={aplicarFiltros}>
          Filtrar
        </button>

        <button className="btn-limpiar" onClick={limpiarFiltros}>
          Limpiar
        </button>

        <button className="btn-agregar-empleado" onClick={abrirModal}>
          + Agregar empleado
        </button>
      </div>

      <div className="empleados-tabla-contenedor">
        <h3>Listado de empleados</h3>

        <div className="empleados-tabla-scroll">
          <table className="empleados-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Cargo</th>
                <th>Estado</th>
                <th>Fecha de ingreso</th>
                <th>Dirección</th>
                <th>Departamento</th>
                <th>Municipio</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="11" className="sin-resultados">
                    Cargando empleados...
                  </td>
                </tr>
              ) : empleados.length > 0 ? (
                empleados.map((empleado) => (
                  <tr key={empleado.ID_Empleado}>
                    <td>{empleado.ID_Empleado}</td>
                    <td>{empleado.NombreCompleto}</td>
                    <td>{empleado.NumeroTelefono}</td>
                    <td>{empleado.CorreoProfesional || "No registrado"}</td>
                    <td>{empleado.Cargo || "No registrado"}</td>
                    <td>
                      <span className={`estado ${empleado.Estado.toLowerCase()}`}>
                        {empleado.Estado}
                      </span>
                    </td>
                    <td>{empleado.FechaInicio}</td>
                    <td>{empleado.Direccion || "No registrada"}</td>
                    <td>{empleado.Departamento || "No registrado"}</td>
                    <td>{empleado.Municipio || "No registrado"}</td>
                    <td>
                      <button
                        type="button"
                        className={
                          empleado.Estado === "ACTIVO"
                            ? "btn-estado-empleado desactivar"
                            : "btn-estado-empleado activar"
                        }
                        onClick={() => manejarEstadoEmpleado(empleado)}
                        disabled={empleadoProcesando === empleado.ID_Empleado}
                      >
                        {empleado.Estado === "ACTIVO" ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="sin-resultados">
                    No se encontraron empleados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && (
        <div className="modal-empleado-fondo">
          <div className="modal-empleado">
            <div className="modal-empleado-header">
              <h3>Agregar empleado</h3>

              <button type="button" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="form-empleado" onSubmit={agregarEmpleado}>
              <div className="grupo-form">
                <label>Nombres *</label>
                <input
                  type="text"
                  name="nombres"
                  value={nuevoEmpleado.nombres}
                  onChange={manejarCambio}
                  placeholder="Ingrese los nombres"
                />
              </div>

              <div className="grupo-form">
                <label>Apellidos *</label>
                <input
                  type="text"
                  name="apellidos"
                  value={nuevoEmpleado.apellidos}
                  onChange={manejarCambio}
                  placeholder="Ingrese los apellidos"
                />
              </div>

              <div className="grupo-form">
                <label>Teléfono *</label>
                <input
                  type="text"
                  name="telefono"
                  value={nuevoEmpleado.telefono}
                  onChange={manejarCambio}
                  placeholder="Ingrese el teléfono"
                  maxLength="8"
                />
              </div>

              <div className="grupo-form">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  name="correo"
                  value={nuevoEmpleado.correo}
                  onChange={manejarCambio}
                  placeholder="Ingrese el correo electrónico"
                />
              </div>

              <div className="grupo-form">
                <label>Cargo</label>
                <input
                  type="text"
                  name="cargo"
                  value={nuevoEmpleado.cargo}
                  onChange={manejarCambio}
                  placeholder="Empleado"
                />
              </div>

              <div className="grupo-form">
                <label>Fecha de ingreso *</label>
                <input
                  type="date"
                  name="fechaIngreso"
                  value={nuevoEmpleado.fechaIngreso}
                  onChange={manejarCambio}
                />
              </div>

              <div className="grupo-form">
                <label>Departamento *</label>
                <select
                  name="idDepartamento"
                  value={nuevoEmpleado.idDepartamento}
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

              <div className="grupo-form">
                <label>Municipio *</label>
                <select
                  name="idMunicipio"
                  value={nuevoEmpleado.idMunicipio}
                  onChange={manejarCambio}
                  disabled={!nuevoEmpleado.idDepartamento || cargandoMunicipios}
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
                {nuevoEmpleado.idDepartamento &&
                  !cargandoMunicipios &&
                  municipios.length === 0 && (
                    <small>No hay municipios disponibles para este departamento.</small>
                  )}
              </div>

              <div className="grupo-form grupo-form-completo">
                <label>Dirección *</label>
                <input
                  type="text"
                  name="direccion"
                  value={nuevoEmpleado.direccion}
                  onChange={manejarCambio}
                  placeholder="Ingrese la dirección"
                />
              </div>

              <div className="modal-empleado-botones">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-guardar" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Empleados;

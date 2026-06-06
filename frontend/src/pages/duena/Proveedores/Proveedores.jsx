import { useEffect, useState } from "react";
import {
  cambiarEstadoProveedor,
  crearProveedorCompleto,
  obtenerDepartamentos,
  obtenerMunicipiosPorDepartamento,
  obtenerProveedores,
  obtenerResumenProveedores,
} from "../../../api/api";
import "./Proveedores.css";

const resumenInicial = {
  total_proveedores: 0,
  activos: 0,
  inactivos: 0,
};

function Proveedores() {
  const crearFormularioVacio = () => ({
    nombreEmpresa: "",
    nombreContacto: "",
    apellidoContacto: "",
    telefono: "",
    correo: "",
    direccion: "",
    idDepartamento: "",
    idMunicipio: "",
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [resumen, setResumen] = useState(resumenInicial);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [nuevoProveedor, setNuevoProveedor] = useState(crearFormularioVacio);
  const [cargando, setCargando] = useState(true);
  const [cargandoMunicipios, setCargandoMunicipios] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [proveedorProcesando, setProveedorProcesando] = useState(null);
  const [error, setError] = useState("");
  const [erroresFormulario, setErroresFormulario] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const telefonoEsValido = (telefono) => {
    const telefonoLimpio = String(telefono || "").trim();

    return (
      /^\d{8}$/.test(telefonoLimpio) &&
      Number(telefonoLimpio) > 70000000 &&
      Number(telefonoLimpio) < 90000000
    );
  };

  const cargarDatos = async () => {
    setCargando(true);
    setError("");

    try {
      const [resumenRespuesta, proveedoresRespuesta, departamentosRespuesta] =
        await Promise.all([
          obtenerResumenProveedores(),
          obtenerProveedores(),
          obtenerDepartamentos(),
        ]);

      setResumen(resumenRespuesta || resumenInicial);
      setProveedores(proveedoresRespuesta || []);
      setDepartamentos(departamentosRespuesta || []);
    } catch (errorCarga) {
      console.error("Error al cargar proveedores:", errorCarga);
      setError(errorCarga.message || "No se pudieron cargar los proveedores.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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

  const abrirModal = () => {
    setError("");
    setErroresFormulario([]);
    setMensaje("");
    setNuevoProveedor(crearFormularioVacio());
    setMunicipios([]);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setNuevoProveedor(crearFormularioVacio());
    setMunicipios([]);
    setErroresFormulario([]);
    setGuardando(false);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    if (["nombreEmpresa", "nombreContacto", "apellidoContacto"].includes(name)) {
      const soloLetras = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/g, "");

      setNuevoProveedor((proveedorActual) => ({
        ...proveedorActual,
        [name]: soloLetras,
      }));
      setErroresFormulario([]);
      return;
    }

    if (name === "telefono") {
      const soloNumeros = value.replace(/[^0-9]/g, "").slice(0, 8);

      setNuevoProveedor((proveedorActual) => ({
        ...proveedorActual,
        telefono: soloNumeros,
      }));
      setErroresFormulario([]);
      return;
    }

    if (name === "idDepartamento") {
      setNuevoProveedor((proveedorActual) => ({
        ...proveedorActual,
        idDepartamento: value,
        idMunicipio: "",
      }));
      setErroresFormulario([]);
      cargarMunicipios(value);
      return;
    }

    setNuevoProveedor((proveedorActual) => ({
      ...proveedorActual,
      [name]: value,
    }));
    setErroresFormulario([]);
  };

  const validarProveedor = () => {
    const errores = [];

    if (!nuevoProveedor.nombreEmpresa.trim()) {
      errores.push("El nombre del proveedor es obligatorio.");
    }

    if (!nuevoProveedor.nombreContacto.trim()) {
      errores.push("El nombre de contacto es obligatorio.");
    }

    if (!nuevoProveedor.apellidoContacto.trim()) {
      errores.push("El apellido de contacto es obligatorio.");
    }

    if (!telefonoEsValido(nuevoProveedor.telefono)) {
      errores.push(
        "El teléfono debe contener solo números, exactamente 8 dígitos y estar entre 70000001 y 89999999."
      );
    }

    if (!nuevoProveedor.correo.trim()) {
      errores.push("El correo profesional es obligatorio.");
    }

    if (!nuevoProveedor.direccion.trim()) {
      errores.push("La dirección del proveedor es obligatoria.");
    }

    if (!nuevoProveedor.idDepartamento) {
      errores.push("Debes seleccionar un departamento.");
    }

    if (!nuevoProveedor.idMunicipio) {
      errores.push("Debes seleccionar un municipio.");
    }

    const municipioSeleccionado = municipios.find(
      (municipio) =>
        String(municipio.ID_Municipio) === String(nuevoProveedor.idMunicipio)
    );

    if (
      nuevoProveedor.idMunicipio &&
      (!municipioSeleccionado ||
        String(municipioSeleccionado.ID_Departamento) !==
          String(nuevoProveedor.idDepartamento))
    ) {
      errores.push("El municipio seleccionado no pertenece al departamento indicado.");
    }

    return errores;
  };

  const guardarProveedor = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    const erroresValidacion = validarProveedor();

    if (erroresValidacion.length > 0) {
      setErroresFormulario(erroresValidacion);
      setError("");
      return;
    }

    const payload = {
      NombreEmpresa: nuevoProveedor.nombreEmpresa.trim(),
      NombreDeContacto: nuevoProveedor.nombreContacto.trim(),
      ApellidoDeContacto: nuevoProveedor.apellidoContacto.trim(),
      NumeroTelefono: nuevoProveedor.telefono.trim(),
      CorreoProfesional: nuevoProveedor.correo.trim(),
      Direccion: nuevoProveedor.direccion.trim(),
      ID_Departamento: Number(nuevoProveedor.idDepartamento),
      ID_Municipio: Number(nuevoProveedor.idMunicipio),
    };

    setGuardando(true);

    try {
      await crearProveedorCompleto(payload);
      setMensaje("Proveedor creado correctamente.");
      cerrarModal();
      await cargarDatos();
    } catch (errorGuardar) {
      console.error("Error al guardar proveedor:", errorGuardar);
      setError(errorGuardar.message || "No se pudo guardar el proveedor.");
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async (proveedor) => {
    const nuevoEstado = proveedor.Estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    setError("");
    setMensaje("");
    setProveedorProcesando(proveedor.ID_Proveedor);

    try {
      await cambiarEstadoProveedor(proveedor.ID_Proveedor, nuevoEstado);
      setMensaje(
        `Proveedor ${nuevoEstado === "ACTIVO" ? "activado" : "desactivado"} correctamente.`
      );
      await cargarDatos();
    } catch (errorEstado) {
      console.error("Error al cambiar estado:", errorEstado);
      setError(errorEstado.message || "No se pudo cambiar el estado.");
    } finally {
      setProveedorProcesando(null);
    }
  };

  return (
    <div className="proveedores-modulo">
      <section className="proveedores-header">
        <div>
          <p className="proveedores-subtitle">Gestión de proveedores</p>
          <h2 className="proveedores-title">Proveedores</h2>
        </div>

        <button className="btn-nuevo-proveedor" onClick={abrirModal}>
          + Nuevo proveedor
        </button>
      </section>

      {cargando && <p className="estado-proveedores-mensaje">Cargando proveedores...</p>}
      {error && <p className="error-proveedores">{error}</p>}
      {mensaje && <p className="exito-proveedores">{mensaje}</p>}

      <section className="proveedores-cards">
        <article className="proveedor-card">
          <span>Total proveedores</span>
          <strong>{resumen.total_proveedores}</strong>
        </article>

        <article className="proveedor-card">
          <span>Activos</span>
          <strong>{resumen.activos}</strong>
        </article>

        <article className="proveedor-card">
          <span>Inactivos</span>
          <strong>{resumen.inactivos}</strong>
        </article>
      </section>

      <section className="proveedores-table-section">
        <div className="table-header">
          <h3>Lista de proveedores</h3>
          <p>Control de proveedores registrados en H&amp;D Boutique</p>
        </div>

        <div className="proveedores-table-container">
          <table className="proveedores-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Departamento</th>
                <th>Municipio</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {proveedores.length > 0 ? (
                proveedores.map((proveedor) => (
                  <tr key={proveedor.ID_Proveedor}>
                    <td>{proveedor.NombreProveedor}</td>
                    <td>
                      {proveedor.NombreDeContacto} {proveedor.ApellidoDeContacto}
                    </td>
                    <td>{proveedor.NumeroTelefono}</td>
                    <td>{proveedor.Direccion || "Sin dirección"}</td>
                    <td>{proveedor.Departamento || "Sin departamento"}</td>
                    <td>{proveedor.Municipio || "No registrado"}</td>
                    <td>
                      <span
                        className={
                          proveedor.Estado === "ACTIVO"
                            ? "estado activo"
                            : "estado inactivo"
                        }
                      >
                        {proveedor.Estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={
                          proveedor.Estado === "ACTIVO"
                            ? "btn-estado-proveedor desactivar"
                            : "btn-estado-proveedor activar"
                        }
                        disabled={proveedorProcesando === proveedor.ID_Proveedor}
                        onClick={() => alternarEstado(proveedor)}
                      >
                        {proveedorProcesando === proveedor.ID_Proveedor
                          ? "Actualizando..."
                          : proveedor.Estado === "ACTIVO"
                          ? "Desactivar"
                          : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="sin-resultados">
                    No hay proveedores registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {mostrarModal && (
        <div className="modal-proveedor-overlay" onClick={cerrarModal}>
          <div className="modal-proveedor" onClick={(e) => e.stopPropagation()}>
            <div className="modal-proveedor-header">
              <div>
                <p>Registro de proveedor</p>
                <h3>Nuevo proveedor</h3>
              </div>

              <button className="modal-close" onClick={cerrarModal}>
                ×
              </button>
            </div>

            <form className="proveedor-form" onSubmit={guardarProveedor}>
              {error && <p className="error-modal-proveedor">{error}</p>}

              {erroresFormulario.length > 0 && (
                <div className="errores-formulario-proveedor" role="alert">
                  <strong>Revisa estos datos:</strong>
                  <ul>
                    {erroresFormulario.map((errorFormulario) => (
                      <li key={errorFormulario}>{errorFormulario}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="form-group">
                <label>Nombre del proveedor</label>
                <input
                  type="text"
                  name="nombreEmpresa"
                  value={nuevoProveedor.nombreEmpresa}
                  onChange={manejarCambio}
                  placeholder="Ej: Textiles Managua"
                />
              </div>

              <div className="form-group">
                <label>Nombre de contacto</label>
                <input
                  type="text"
                  name="nombreContacto"
                  value={nuevoProveedor.nombreContacto}
                  onChange={manejarCambio}
                  placeholder="Ej: María"
                />
              </div>

              <div className="form-group">
                <label>Apellido de contacto</label>
                <input
                  type="text"
                  name="apellidoContacto"
                  value={nuevoProveedor.apellidoContacto}
                  onChange={manejarCambio}
                  placeholder="Ej: López"
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={nuevoProveedor.telefono}
                  onChange={manejarCambio}
                  placeholder="Ej: 88889999"
                  maxLength="8"
                />
              </div>

              <div className="form-group">
                <label>Correo profesional</label>
                <input
                  type="email"
                  name="correo"
                  value={nuevoProveedor.correo}
                  onChange={manejarCambio}
                  placeholder="proveedor@correo.com"
                />
              </div>

              <div className="form-group">
                <label>Departamento</label>
                <select
                  name="idDepartamento"
                  value={nuevoProveedor.idDepartamento}
                  onChange={manejarCambio}
                >
                  <option value="">Seleccionar departamento</option>
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

              <div className="form-group">
                <label>Municipio</label>
                <select
                  name="idMunicipio"
                  value={nuevoProveedor.idMunicipio}
                  onChange={manejarCambio}
                  disabled={!nuevoProveedor.idDepartamento || cargandoMunicipios}
                >
                  <option value="">
                    {cargandoMunicipios
                      ? "Cargando municipios..."
                      : "Seleccionar municipio"}
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
                {nuevoProveedor.idDepartamento &&
                  !cargandoMunicipios &&
                  municipios.length === 0 && (
                    <small>No hay municipios disponibles para este departamento.</small>
                  )}
              </div>

              <div className="form-group direccion-grupo">
                <label>Dirección exacta</label>
                <input
                  type="text"
                  name="direccion"
                  value={nuevoProveedor.direccion}
                  onChange={manejarCambio}
                  placeholder="Ej: Mercado Oriental, módulo 3"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-guardar" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Proveedores;

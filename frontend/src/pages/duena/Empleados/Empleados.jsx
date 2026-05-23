import { useState } from "react";
import "./Empleados.css";

function Empleados() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const [empleados, setEmpleados] = useState([
    {
      id: 1,
      nombre: "María José Martínez",
      telefono: "8888-1234",
      correo: "maria@gmail.com",
      rol: "Colaborador",
      estado: "Activo",
      fechaIngreso: "2026-05-21",
      direccion: "Managua",
      notas: "",
    },
    {
      id: 2,
      nombre: "Carlos Andrés López",
      telefono: "8811-5678",
      correo: "carlos@gmail.com",
      rol: "Colaborador",
      estado: "Activo",
      fechaIngreso: "2026-05-21",
      direccion: "Masaya",
      notas: "",
    },
    {
      id: 3,
      nombre: "Andrea Valentina Ruiz",
      telefono: "8855-2468",
      correo: "andrea@gmail.com",
      rol: "Colaborador",
      estado: "Inactivo",
      fechaIngreso: "2026-05-21",
      direccion: "Managua",
      notas: "",
    },
  ]);

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [mostrarModal, setMostrarModal] = useState(false);

  const [nuevoEmpleado, setNuevoEmpleado] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    estado: "",
    fechaIngreso: obtenerFechaActual(),
    direccion: "",
    notas: "",
  });

  const soloLetras = (valor) => {
    return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  };

  const soloNumeros = (valor) => {
    return valor.replace(/[^0-9]/g, "");
  };

  const formatearTelefono = (valor) => {
    const numeros = soloNumeros(valor).slice(0, 8);

    if (numeros.length > 4) {
      return `${numeros.slice(0, 4)}-${numeros.slice(4)}`;
    }

    return numeros;
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    if (name === "nombre") {
      setNuevoEmpleado({
        ...nuevoEmpleado,
        [name]: soloLetras(value),
      });
      return;
    }

    if (name === "telefono") {
      setNuevoEmpleado({
        ...nuevoEmpleado,
        telefono: formatearTelefono(value),
      });
      return;
    }

    setNuevoEmpleado({
      ...nuevoEmpleado,
      [name]: value,
    });
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstadoFiltro("Todos");
  };

  const agregarEmpleado = (e) => {
    e.preventDefault();

    if (
      nuevoEmpleado.nombre.trim() === "" ||
      nuevoEmpleado.telefono.trim() === "" ||
      nuevoEmpleado.correo.trim() === "" ||
      nuevoEmpleado.estado === "" ||
      nuevoEmpleado.fechaIngreso === "" ||
      nuevoEmpleado.direccion.trim() === ""
    ) {
      alert("Complete todos los campos obligatorios.");
      return;
    }

    if (nuevoEmpleado.telefono.length < 9) {
      alert("El teléfono debe tener 8 dígitos.");
      return;
    }

    const empleado = {
      id: empleados.length + 1,
      nombre: nuevoEmpleado.nombre.trim(),
      telefono: nuevoEmpleado.telefono.trim(),
      correo: nuevoEmpleado.correo.trim(),
      rol: "Colaborador",
      estado: nuevoEmpleado.estado,
      fechaIngreso: nuevoEmpleado.fechaIngreso,
      direccion: nuevoEmpleado.direccion.trim(),
      notas: nuevoEmpleado.notas.trim(),
    };

    setEmpleados([...empleados, empleado]);

    setNuevoEmpleado({
      nombre: "",
      telefono: "",
      correo: "",
      estado: "",
      fechaIngreso: obtenerFechaActual(),
      direccion: "",
      notas: "",
    });

    setMostrarModal(false);
  };

  const empleadosFiltrados = empleados.filter((empleado) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      empleado.nombre.toLowerCase().includes(texto) ||
      empleado.telefono.includes(texto) ||
      empleado.correo.toLowerCase().includes(texto) ||
      empleado.rol.toLowerCase().includes(texto) ||
      empleado.direccion.toLowerCase().includes(texto);

    const coincideEstado =
      estadoFiltro === "Todos" || empleado.estado === estadoFiltro;

    return coincideBusqueda && coincideEstado;
  });

  const totalEmpleados = empleados.length;
  const activos = empleados.filter((e) => e.estado === "Activo").length;
  const inactivos = empleados.filter((e) => e.estado === "Inactivo").length;
  const colaboradores = empleados.filter(
    (e) => e.rol === "Colaborador"
  ).length;

  return (
    <div className="empleados-page">
      <div className="empleados-header">
        <div>
          <h2>Empleados</h2>
          <p>Gestión de empleados registrados en H&D Boutique</p>
        </div>
      </div>

      <div className="empleados-resumen">
        <div className="empleado-card">
          <span>Empleados registrados</span>
          <strong>{totalEmpleados}</strong>
        </div>

        <div className="empleado-card">
          <span>Activos</span>
          <strong>{activos}</strong>
        </div>

        <div className="empleado-card">
          <span>Inactivos</span>
          <strong>{inactivos}</strong>
        </div>

        <div className="empleado-card">
          <span>Colaboradores</span>
          <strong>{colaboradores}</strong>
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
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>

        <button className="btn-filtrar">Filtrar</button>

        <button className="btn-limpiar" onClick={limpiarFiltros}>
          Limpiar
        </button>

        <button
          className="btn-agregar-empleado"
          onClick={() => setMostrarModal(true)}
        >
          + Agregar empleado
        </button>
      </div>

      <div className="empleados-tabla-contenedor">
        <h3>Listado de empleados</h3>

        <table className="empleados-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha de ingreso</th>
              <th>Dirección</th>
            </tr>
          </thead>

          <tbody>
            {empleadosFiltrados.length > 0 ? (
              empleadosFiltrados.map((empleado) => (
                <tr key={empleado.id}>
                  <td>{empleado.nombre}</td>
                  <td>{empleado.telefono}</td>
                  <td>{empleado.correo}</td>
                  <td>{empleado.rol}</td>
                  <td>
                    <span
                      className={`estado ${empleado.estado.toLowerCase()}`}
                    >
                      {empleado.estado}
                    </span>
                  </td>
                  <td>{empleado.fechaIngreso}</td>
                  <td>{empleado.direccion}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="sin-resultados">
                  No se encontraron empleados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="modal-empleado-fondo">
          <div className="modal-empleado">
            <div className="modal-empleado-header">
              <h3>Agregar empleado</h3>

              <button type="button" onClick={() => setMostrarModal(false)}>
                ×
              </button>
            </div>

            <form className="form-empleado" onSubmit={agregarEmpleado}>
              <div className="grupo-form">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevoEmpleado.nombre}
                  onChange={manejarCambio}
                  placeholder="Ingrese el nombre completo"
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
                />
              </div>

              <div className="grupo-form">
                <label>Correo electrónico *</label>
                <input
                  type="email"
                  name="correo"
                  value={nuevoEmpleado.correo}
                  onChange={manejarCambio}
                  placeholder="Ingrese el correo electrónico"
                />
              </div>

              <div className="grupo-form">
                <label>Fecha de ingreso *</label>
                <input
                  type="date"
                  name="fechaIngreso"
                  value={nuevoEmpleado.fechaIngreso}
                  min={obtenerFechaActual()}
                  onChange={manejarCambio}
                />
              </div>

              <div className="grupo-form">
                <label>Dirección *</label>
                <input
                  type="text"
                  name="direccion"
                  value={nuevoEmpleado.direccion}
                  onChange={manejarCambio}
                  placeholder="Ingrese la dirección"
                />
              </div>

              <div className="grupo-form">
                <label>Estado *</label>
                <select
                  name="estado"
                  value={nuevoEmpleado.estado}
                  onChange={manejarCambio}
                >
                  <option value="">Seleccione el estado</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="grupo-form grupo-form-completo">
                <label>Notas</label>
                <textarea
                  name="notas"
                  value={nuevoEmpleado.notas}
                  onChange={manejarCambio}
                  placeholder="Notas adicionales"
                ></textarea>
              </div>

              <div className="modal-empleado-botones">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setMostrarModal(false)}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-guardar">
                  Guardar empleado
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
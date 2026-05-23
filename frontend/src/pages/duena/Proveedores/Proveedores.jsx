import { useState } from "react";
import "./Proveedores.css";

function Proveedores() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const fechaActual = obtenerFechaActual();

  const [mostrarModal, setMostrarModal] = useState(false);

  const [proveedores, setProveedores] = useState([
    {
      id: 1,
      fechaRegistro: fechaActual,
      nombre: "Textiles Managua",
      telefono: "88889999",
      direccion: "Mercado Oriental, Managua",
      categoria: "Ropa",
      estado: "Activo",
    },
    {
      id: 2,
      fechaRegistro: fechaActual,
      nombre: "Calzado Elegante",
      telefono: "77776666",
      direccion: "Carretera Norte, Managua",
      categoria: "Zapatos",
      estado: "Activo",
    },
  ]);

  const [nuevoProveedor, setNuevoProveedor] = useState({
    fechaRegistro: fechaActual,
    nombre: "",
    telefono: "",
    direccion: "",
    categoria: "",
    estado: "Activo",
  });

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    if (name === "nombre" || name === "categoria") {
      const soloLetras = value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");

      setNuevoProveedor({
        ...nuevoProveedor,
        [name]: soloLetras,
      });

      return;
    }

    if (name === "telefono") {
      const soloNumeros = value.replace(/[^0-9]/g, "");

      setNuevoProveedor({
        ...nuevoProveedor,
        [name]: soloNumeros,
      });

      return;
    }

    setNuevoProveedor({
      ...nuevoProveedor,
      [name]: value,
    });
  };

  const cerrarModal = () => {
    setMostrarModal(false);

    setNuevoProveedor({
      fechaRegistro: fechaActual,
      nombre: "",
      telefono: "",
      direccion: "",
      categoria: "",
      estado: "Activo",
    });
  };

  const guardarProveedor = (e) => {
    e.preventDefault();

    if (
      nuevoProveedor.fechaRegistro.trim() === "" ||
      nuevoProveedor.nombre.trim() === "" ||
      nuevoProveedor.telefono.trim() === "" ||
      nuevoProveedor.direccion.trim() === "" ||
      nuevoProveedor.categoria.trim() === ""
    ) {
      alert("Por favor completa todos los campos.");
      return;
    }

    if (nuevoProveedor.fechaRegistro < fechaActual) {
      alert("La fecha no puede ser anterior a la fecha actual.");
      return;
    }

    if (nuevoProveedor.telefono.length < 8) {
      alert("El teléfono debe tener 8 dígitos.");
      return;
    }

    const proveedorNuevo = {
      id: proveedores.length + 1,
      ...nuevoProveedor,
    };

    setProveedores([...proveedores, proveedorNuevo]);
    cerrarModal();
  };

  return (
    <div className="proveedores-modulo">
      <section className="proveedores-header">
        <div>
          <p className="proveedores-subtitle">Gestión de proveedores</p>
          <h2 className="proveedores-title">Proveedores</h2>
        </div>

        <button
          className="btn-nuevo-proveedor"
          onClick={() => setMostrarModal(true)}
        >
          + Nuevo proveedor
        </button>
      </section>

      <section className="proveedores-cards">
        <article className="proveedor-card">
          <span>Total proveedores</span>
          <strong>{proveedores.length}</strong>
        </article>

        <article className="proveedor-card">
          <span>Activos</span>
          <strong>
            {proveedores.filter((proveedor) => proveedor.estado === "Activo").length}
          </strong>
        </article>

        <article className="proveedor-card">
          <span>Inactivos</span>
          <strong>
            {
              proveedores.filter((proveedor) => proveedor.estado === "Inactivo")
                .length
            }
          </strong>
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
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Categoría</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {proveedores.map((proveedor) => (
                <tr key={proveedor.id}>
                  <td>{proveedor.fechaRegistro}</td>
                  <td>{proveedor.nombre}</td>
                  <td>{proveedor.telefono}</td>
                  <td>{proveedor.direccion}</td>
                  <td>{proveedor.categoria}</td>
                  <td>
                    <span
                      className={
                        proveedor.estado === "Activo"
                          ? "estado activo"
                          : "estado inactivo"
                      }
                    >
                      {proveedor.estado}
                    </span>
                  </td>
                </tr>
              ))}
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
              <div className="form-group">
                <label>Fecha de registro</label>
                <input
                  type="date"
                  name="fechaRegistro"
                  value={nuevoProveedor.fechaRegistro}
                  min={fechaActual}
                  onChange={manejarCambio}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nombre del proveedor</label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevoProveedor.nombre}
                  onChange={manejarCambio}
                  placeholder="Ej: Textiles Managua"
                  required
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
                  required
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={nuevoProveedor.direccion}
                  onChange={manejarCambio}
                  placeholder="Ej: Managua"
                  required
                />
              </div>

              <div className="form-group">
                <label>Categoría que suministra</label>
                <input
                  type="text"
                  name="categoria"
                  value={nuevoProveedor.categoria}
                  onChange={manejarCambio}
                  placeholder="Ej: Ropa"
                  required
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado"
                  value={nuevoProveedor.estado}
                  onChange={manejarCambio}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-guardar">
                  Guardar proveedor
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
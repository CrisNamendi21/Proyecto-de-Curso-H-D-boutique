import { useEffect, useState } from "react";
import { obtenerClientesColaborador } from "../../../api/api";
import "../../duena/Clientes/Clientes.css";

function ClientesLectura() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarClientes = async () => {
      setCargando(true);
      setError("");

      try {
        const respuesta = await obtenerClientesColaborador({ busqueda });
        setClientes(respuesta || []);
      } catch (errorCarga) {
        setClientes([]);
        setError(errorCarga.message || "No se pudieron cargar los clientes.");
      } finally {
        setCargando(false);
      }
    };

    const temporizador = setTimeout(cargarClientes, 300);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  return (
    <section className="clientes-page">
      <div className="clientes-header">
        <div className="clientes-titulo">
          <h2>Clientes</h2>
          <p>Consulta de clientes para operaciones de venta.</p>
        </div>
      </div>

      <section className="clientes-filtros">
        <div className="campo-filtro">
          <label>Buscar cliente</label>
          <input
            type="text"
            placeholder="Nombre, apellido o teléfono"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </section>

      {cargando && <p className="estado-clientes">Cargando clientes...</p>}
      {error && <p className="error-clientes">{error}</p>}

      <section className="clientes-tabla-card">
        <h3>Listado de clientes</h3>

        <table className="clientes-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.ID_Cliente}>
                <td>{cliente.ID_Cliente}</td>
                <td>{cliente.NombreCompleto}</td>
                <td>{cliente.NumeroTelefono || "No registrado"}</td>
                <td>{cliente.Estado || "No registrado"}</td>
              </tr>
            ))}

            {!cargando && clientes.length === 0 && (
              <tr>
                <td colSpan="4" className="sin-resultados">
                  No se encontraron clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </section>
  );
}

export default ClientesLectura;

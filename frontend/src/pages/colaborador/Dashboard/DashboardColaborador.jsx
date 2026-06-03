import { useEffect, useState } from "react";
import "../../duena/Dashboard/DashboardDuena.css";
import "./DashboardColaborador.css";

import { obtenerDashboardColaborador, registrarVentaColaborador } from "../../../api/api";
import ClientesLectura from "./ClientesLectura";
import NuevaVenta from "../../duena/NuevaVenta/NuevaVenta";
import ProductosLectura from "./ProductosLectura";
import RecibosColaborador from "./RecibosColaborador";

const resumenInicial = {
  ventas_hoy: 0,
  total_vendido_hoy: 0,
  productos_vendidos_hoy: 0,
};

function DashboardColaborador({ sesion, cerrarSesion }) {
  const [vistaActual, setVistaActual] = useState("dashboard");
  const [dashboard, setDashboard] = useState({
    resumen: resumenInicial,
    ultimos_recibos: [],
    productos_bajo_stock: [],
  });
  const [cargandoDashboard, setCargandoDashboard] = useState(true);
  const [errorDashboard, setErrorDashboard] = useState("");

  const formatearDinero = (valor) => {
    return `C$ ${Number(valor || 0).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  useEffect(() => {
    const cargarDashboard = async () => {
      setCargandoDashboard(true);
      setErrorDashboard("");

      try {
        const respuesta = await obtenerDashboardColaborador();
        setDashboard({
          resumen: respuesta?.resumen || resumenInicial,
          ultimos_recibos: respuesta?.ultimos_recibos || [],
          productos_bajo_stock: respuesta?.productos_bajo_stock || [],
        });
      } catch (error) {
        setErrorDashboard(
          error.message || "No se pudo cargar el dashboard del colaborador."
        );
      } finally {
        setCargandoDashboard(false);
      }
    };

    if (vistaActual === "dashboard") {
      cargarDashboard();
    }
  }, [vistaActual]);

  return (
    <div className="app colaborador-theme">
      <aside className="sidebar">
        <div className="brand">
          <h1>H&amp;D Boutique</h1>
          <p>Panel de colaborador</p>
        </div>

        <nav className="menu">
          <button
            className={vistaActual === "dashboard" ? "menu-item active" : "menu-item"}
            onClick={() => setVistaActual("dashboard")}
          >
            Inicio
          </button>

          <button
            className={vistaActual === "nuevaVenta" ? "menu-item active" : "menu-item"}
            onClick={() => setVistaActual("nuevaVenta")}
          >
            Nueva venta
          </button>

          <button
            className={vistaActual === "productos" ? "menu-item active" : "menu-item"}
            onClick={() => setVistaActual("productos")}
          >
            Productos
          </button>

          <button
            className={vistaActual === "clientes" ? "menu-item active" : "menu-item"}
            onClick={() => setVistaActual("clientes")}
          >
            Clientes
          </button>

          <button
            className={vistaActual === "recibos" ? "menu-item active" : "menu-item"}
            onClick={() => setVistaActual("recibos")}
          >
            Mis recibos
          </button>
        </nav>

        <button className="logout-btn" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div></div>

          <div className="topbar-right">
            <span className="user-label">{sesion?.nombre || "Colaborador"}</span>
          </div>
        </header>

        <section className="dashboard-content">
          {vistaActual === "dashboard" && (
            <>
              <div className="dashboard-header">
                <h2 className="page-title">Inicio</h2>
              </div>

              <div className="colaborador-welcome">
                <div className="colaborador-panel">
                  <h3>Bienvenido, {sesion?.nombre || "Colaborador"}</h3>
                  <p>
                    Desde este panel puedes registrar ventas, consultar productos
                    consultar clientes y revisar tus recibos.
                  </p>
                </div>

                <div className="colaborador-panel">
                  <h3>Acceso activo</h3>
                  <span className="colaborador-badge">Colaborador</span>
                </div>
              </div>

              <div className="cards-grid">
                <div className="dashboard-card">
                  <h3>Ventas de hoy</h3>
                  <div className="card-main-value">
                    {dashboard.resumen.ventas_hoy}
                  </div>
                  <p>Registradas por mí</p>
                  <div className="card-line"></div>
                </div>

                <div className="dashboard-card">
                  <h3>Total vendido hoy</h3>
                  <div className="card-main-value">
                    {formatearDinero(dashboard.resumen.total_vendido_hoy)}
                  </div>
                  <p>Monto propio del día</p>
                  <div className="card-line"></div>
                </div>

                <div className="dashboard-card">
                  <h3>Productos vendidos</h3>
                  <div className="card-main-value">
                    {dashboard.resumen.productos_vendidos_hoy}
                  </div>
                  <p>Unidades vendidas hoy</p>
                  <div className="card-line"></div>
                </div>

                <div className="dashboard-card">
                  <h3>Alertas de stock</h3>
                  <div className="card-main-value">
                    {dashboard.productos_bajo_stock.length}
                  </div>
                  <p>Productos entre 1 y 5 unidades</p>
                  <div className="card-line"></div>
                </div>
              </div>

              {cargandoDashboard && (
                <p className="estado-colaborador">Cargando datos del colaborador...</p>
              )}

              {errorDashboard && (
                <p className="error-colaborador">{errorDashboard}</p>
              )}

              <div className="colaborador-dashboard-grid">
                <article className="colaborador-panel">
                  <h3>Últimos recibos generados por mí</h3>
                  <table className="colaborador-tabla">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Cliente</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.ultimos_recibos.map((recibo) => (
                        <tr key={recibo.ID_Recibo}>
                          <td>{recibo.numero_recibo}</td>
                          <td>{recibo.cliente}</td>
                          <td>{formatearDinero(recibo.total)}</td>
                        </tr>
                      ))}
                      {dashboard.ultimos_recibos.length === 0 && (
                        <tr>
                          <td colSpan="3">No hay recibos propios recientes.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </article>

                <article className="colaborador-panel">
                  <h3>Productos con bajo stock</h3>
                  <table className="colaborador-tabla">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Talla</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.productos_bajo_stock.map((producto) => (
                        <tr key={producto.ID_Producto}>
                          <td>{producto.Nombre}</td>
                          <td>{producto.Talla || "Sin talla"}</td>
                          <td>{producto.Stock}</td>
                        </tr>
                      ))}
                      {dashboard.productos_bajo_stock.length === 0 && (
                        <tr>
                          <td colSpan="3">No hay alertas de stock.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </article>
              </div>
            </>
          )}

          {vistaActual === "nuevaVenta" && (
            <div className="vista-modulo">
              <NuevaVenta
                idEmpleado={sesion?.id_empleado}
                registrarVenta={registrarVentaColaborador}
              />
            </div>
          )}

          {vistaActual === "productos" && (
            <div className="vista-modulo">
              <ProductosLectura />
            </div>
          )}

          {vistaActual === "clientes" && (
            <div className="vista-modulo">
              <ClientesLectura />
            </div>
          )}

          {vistaActual === "recibos" && (
            <div className="vista-modulo">
              <RecibosColaborador />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default DashboardColaborador;

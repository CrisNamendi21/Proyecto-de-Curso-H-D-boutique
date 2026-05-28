import { useState } from "react";
import "../../duena/Dashboard/DashboardDuena.css";

import Clientes from "../../duena/Clientes/Clientes";
import NuevaVenta from "../../duena/NuevaVenta/NuevaVenta";
import ProductosLectura from "./ProductosLectura";

function DashboardColaborador({ sesion, cerrarSesion }) {
  const [vistaActual, setVistaActual] = useState("dashboard");

  return (
    <div className="app">
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

              <div className="cards-grid">
                <div className="dashboard-card">
                  <h3>Rol</h3>
                  <div className="card-main-value">Colaborador</div>
                  <p>Acceso operativo</p>
                  <div className="card-line"></div>
                </div>

                <div className="dashboard-card">
                  <h3>Nueva venta</h3>
                  <div className="card-main-value">Ventas</div>
                  <p>Registrar ventas y generar recibo</p>
                  <div className="card-line"></div>
                </div>

                <div className="dashboard-card">
                  <h3>Productos</h3>
                  <div className="card-main-value">Consulta</div>
                  <p>Visualizar inventario disponible</p>
                  <div className="card-line"></div>
                </div>

                <div className="dashboard-card">
                  <h3>Clientes</h3>
                  <div className="card-main-value">Gestion</div>
                  <p>Consultar y registrar clientes</p>
                  <div className="card-line"></div>
                </div>
              </div>
            </>
          )}

          {vistaActual === "nuevaVenta" && (
            <div className="vista-modulo">
              <NuevaVenta idEmpleado={sesion?.id_empleado} />
            </div>
          )}

          {vistaActual === "productos" && (
            <div className="vista-modulo">
              <ProductosLectura />
            </div>
          )}

          {vistaActual === "clientes" && (
            <div className="vista-modulo">
              <Clientes />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default DashboardColaborador;

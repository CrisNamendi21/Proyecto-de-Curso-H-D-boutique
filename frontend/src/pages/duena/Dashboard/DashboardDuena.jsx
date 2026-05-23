import { useState } from "react";
import "./DashboardDuena.css";

import Productos from "../Productos/Productos";
import Proveedores from "../Proveedores/Proveedores";
import Clientes from "../Clientes/Clientes";
import Empleados from "../Empleados/Empleados";
import Compras from "../Compras/Compras";
//parte de cris en el frontend//
import NuevaVenta from "../NuevaVenta/NuevaVenta"
import Ventas from "../Ventas/Ventas"
import Recibos from "../Recibos/Recibos"


// import NuevaVenta from "./pages/duena/NuevaVenta/NuevaVenta";
// import Ventas from "./pages/duena/Ventas/Ventas";
// import Recibos from "./pages/duena/Recibos/Recibos";


function DashboardDuena({ setRol }) {
  const [vistaActual, setVistaActual] = useState("dashboard");
  const [mostrarModalVentaFlash, setMostrarModalVentaFlash] = useState(false);

  const [clienteVentaFlash, setClienteVentaFlash] = useState("");
  const [fechaVentaFlash, setFechaVentaFlash] = useState("");

  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const manejarClienteVentaFlash = (e) => {
    const valor = e.target.value;
    const soloLetras = valor.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "");
    setClienteVentaFlash(soloLetras);
  };

  const cerrarModalVentaFlash = () => {
    setMostrarModalVentaFlash(false);
    setClienteVentaFlash("");
    setFechaVentaFlash("");
  };

  const guardarVentaFlash = (e) => {
    e.preventDefault();

    const fechaActual = obtenerFechaActual();

    if (clienteVentaFlash.trim() === "") {
      alert("El nombre del cliente es obligatorio y solo debe contener letras.");
      return;
    }

    if (fechaVentaFlash === "") {
      alert("Debes seleccionar una fecha.");
      return;
    }

    if (fechaVentaFlash < fechaActual) {
      alert("No puedes seleccionar una fecha anterior a la fecha actual.");
      return;
    }

    alert("Venta flash guardada correctamente.");
    cerrarModalVentaFlash();
  };

  return (
    <>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <h1>H&amp;D Boutique</h1>
            <p>Panel de dueña</p>
          </div>

          <nav className="menu">
            <button
              className={
                vistaActual === "dashboard" ? "menu-item active" : "menu-item"
              }
              onClick={() => setVistaActual("dashboard")}
            >
              Inicio / Dashboard
            </button>

            <button
              className={
                vistaActual === "nuevaVenta" ? "menu-item active" : "menu-item"
              }
              onClick={() => setVistaActual("nuevaVenta")}
            >
              Nueva venta
            </button>

            <button
              className={
                vistaActual === "ventas" ? "menu-item active" : "menu-item"
              }
              onClick={() => setVistaActual("ventas")}
            >
              Ventas
            </button>

            <button
              className={
                vistaActual === "recibos" ? "menu-item active" : "menu-item"
              }
              onClick={() => setVistaActual("recibos")}
            >
              Recibos
            </button>

            <button
              className={
                vistaActual === "productos" ? "menu-item active" : "menu-item"
              }
              onClick={() => setVistaActual("productos")}
            >
              Productos / Inventario
            </button>

            <button
              className={
                vistaActual === "compras" ? "menu-item active" : "menu-item"
              }
              onClick={() => setVistaActual("compras")}
            >
              Compras
            </button>

            <button
              className={
                vistaActual === "proveedores" ? "menu-item active" : "menu-item"
              }
              onClick={() => setVistaActual("proveedores")}
            >
              Proveedores
            </button>

            <button
              className={
                vistaActual === "clientes" ? "menu-item active" : "menu-item"
              }
              onClick={() => setVistaActual("clientes")}
              
            >
              Clientes
            </button>

            <button
              className={
                vistaActual === "empleados" ? "menu-item active" : "menu-item"
              }
              onClick={() => setVistaActual("empleados")}
            >
              Empleados
            </button>
          </nav>

          <button className="logout-btn" onClick={() => setRol(null)}>
            Cerrar sesión
          </button>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div></div>

            <div className="topbar-right">
              <span className="user-label">Dueña</span>
            </div>
          </header>

          <section className="dashboard-content">
            {vistaActual === "dashboard" && (
              <>
                <div className="dashboard-header">
                  <h2 className="page-title">Inicio / Dashboard</h2>

                  <button
                    className="quick-top-btn"
                    onClick={() => setMostrarModalVentaFlash(true)}
                  >
                    + VENTA FLASH
                  </button>
                </div>

                <div className="cards-grid">
                  <div className="dashboard-card">
                    <h3>Ventas del día</h3>
                    <div className="card-main-value">$ 3,250.00</div>
                    <p>5 ventas</p>
                    <div className="card-line"></div>
                  </div>

                  <div className="dashboard-card">
                    <h3>Ventas del mes</h3>
                    <div className="card-main-value">$ 42,850.00</div>
                    <p>86 ventas</p>
                    <div className="card-line"></div>
                  </div>

                  <div className="dashboard-card">
                    <h3>Stock bajo</h3>
                    <div className="card-main-value">7</div>
                    <p>Ver productos</p>
                    <div className="card-line"></div>
                  </div>

                  <div className="dashboard-card">
                    <h3>Productos vendidos</h3>
                    <div className="card-main-value">128</div>
                    <p>Este mes</p>
                    <div className="card-line"></div>
                  </div>
                </div>

                <div className="dashboard-row">
                  <div className="panel large-panel">
                    <h3>Resumen de ventas</h3>

                    <div className="chart-legend">
                      <span>Ventas semanales</span>
                    </div>

                    <div className="fake-chart">
                      <div className="chart-area">
                        <div className="chart-column">
                          <div className="bar" style={{ height: "72px" }}></div>
                          <span>Lun</span>
                        </div>

                        <div className="chart-column">
                          <div className="bar" style={{ height: "120px" }}></div>
                          <span>Mar</span>
                        </div>

                        <div className="chart-column">
                          <div className="bar" style={{ height: "98px" }}></div>
                          <span>Mié</span>
                        </div>

                        <div className="chart-column">
                          <div className="bar" style={{ height: "152px" }}></div>
                          <span>Jue</span>
                        </div>

                        <div className="chart-column">
                          <div className="bar" style={{ height: "205px" }}></div>
                          <span>Vie</span>
                        </div>

                        <div className="chart-column">
                          <div className="bar" style={{ height: "192px" }}></div>
                          <span>Sáb</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="panel sales-panel">
                    <h3>Últimas ventas</h3>

                    <table className="sales-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Producto</th>
                          <th>Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr>
                          <td>12/05/2025</td>
                          <td>María López</td>
                          <td>Vestido floral</td>
                          <td>$ 750.00</td>
                        </tr>

                        <tr>
                          <td>12/05/2025</td>
                          <td>Ana Torres</td>
                          <td>Blusa manga corta</td>
                          <td>$ 420.00</td>
                        </tr>

                        <tr>
                          <td>11/05/2025</td>
                          <td>Carmen Ruiz</td>
                          <td>Pantalón lino</td>
                          <td>$ 680.00</td>
                        </tr>

                        <tr>
                          <td>11/05/2025</td>
                          <td>Laura Gómez</td>
                          <td>Falda plisada</td>
                          <td>$ 550.00</td>
                        </tr>

                        <tr>
                          <td>11/05/2025</td>
                          <td>Sofía Ramírez</td>
                          <td>Top escote</td>
                          <td>$ 390.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {vistaActual === "productos" && (
              <div className="vista-modulo">
                <Productos />
              </div>
            )}

            {vistaActual === "proveedores" && (
              <div className="vista-modulo">
                <Proveedores />
              </div>
            )}


            {vistaActual === "nuevaVenta" && (
              <div className="vista-modulo">
                <NuevaVenta />
              </div>
            )}

            
            {vistaActual === "ventas" && (
              <div className="vista-modulo">
                <Ventas />
              </div>
            )}
            
            {vistaActual === "recibos" && (
              <div className="vista-modulo">
                <Recibos />
              </div>
            )}


            {vistaActual === "compras" && (
              <div className="vista-modulo">
                <Compras />
              </div>
            )}

            {vistaActual === "clientes" && (
              <div className="vista-modulo">
                <Clientes />
              </div>
            )}
            
            
            {vistaActual === "empleados" && (
              <div className="vista-modulo">
                <Empleados />
              </div>
            )}


          </section>
        </main>
      </div>

      {mostrarModalVentaFlash && (
        <div className="modal-overlay" onClick={cerrarModalVentaFlash}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Venta flash</h3>

              <button className="close-btn" onClick={cerrarModalVentaFlash}>
                ×
              </button>
            </div>

            <form className="sale-form" onSubmit={guardarVentaFlash}>
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente</label>
                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    value={clienteVentaFlash}
                    onChange={manejarClienteVentaFlash}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={fechaVentaFlash}
                    min={obtenerFechaActual()}
                    onChange={(e) => setFechaVentaFlash(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Producto</label>
                  <input type="text" placeholder="Nombre del producto" />
                </div>

                <div className="form-group">
                  <label>Cantidad</label>
                  <input type="number" min="1" placeholder="0" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio unitario</label>
                  <input type="number" min="0" placeholder="0.00" />
                </div>

                <div className="form-group">
                  <label>Método de pago</label>
                  <select required>
                    <option value="">Seleccionar</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Observación</label>
                  <textarea
                    rows="3"
                    placeholder="Detalle adicional de la venta"
                  ></textarea>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cerrarModalVentaFlash}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primary">
                  Guardar venta flash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default DashboardDuena;
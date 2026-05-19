import { useState } from "react";
import "./DashboardDuena.css";

function DashboardDuena({ setRol }) {
  const [mostrarModalVentaFlash, setMostrarModalVentaFlash] = useState(false);

  return (
    <>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <h1>H&amp;D Boutique</h1>
            <p>Panel de dueña</p>
          </div>

          <nav className="menu">
            <button className="menu-item active">Inicio / Dashboard</button>
            <button className="menu-item">Nueva venta</button>
            <button className="menu-item">Ventas</button>
            <button className="menu-item">Recibos</button>
            <button className="menu-item">Productos / Inventario</button>
            <button className="menu-item">Compras</button>
            <button className="menu-item">Proveedores</button>
            <button className="menu-item">Clientes</button>
            <button className="menu-item">Empleados</button>
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
                  <span>• Ventas</span>
                  <span>• Venta semanal</span>
                </div>

                <div className="fake-chart">
                  <div className="chart-bars">
                    <div className="bar" style={{ height: "58px" }}></div>
                    <div className="bar" style={{ height: "98px" }}></div>
                    <div className="bar" style={{ height: "83px" }}></div>
                    <div className="bar" style={{ height: "128px" }}></div>
                    <div className="bar" style={{ height: "174px" }}></div>
                    <div className="bar" style={{ height: "165px" }}></div>
                  </div>

                  <div className="chart-labels">
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
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
          </section>
        </main>
      </div>

      {mostrarModalVentaFlash && (
        <div
          className="modal-overlay"
          onClick={() => setMostrarModalVentaFlash(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Venta flash</h3>

              <button
                className="close-btn"
                onClick={() => setMostrarModalVentaFlash(false)}
              >
                ×
              </button>
            </div>

            <form className="sale-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente</label>
                  <input type="text" placeholder="Nombre del cliente" />
                </div>

                <div className="form-group">
                  <label>Fecha</label>
                  <input type="date" />
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
                  <select>
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
                  onClick={() => setMostrarModalVentaFlash(false)}
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
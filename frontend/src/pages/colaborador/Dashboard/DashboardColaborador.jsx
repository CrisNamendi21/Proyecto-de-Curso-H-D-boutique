import { useState } from "react";
import "./DashboardColaborador.css";

function DashboardColaborador({ setRol }) {
  const [mostrarVentaFlash, setMostrarVentaFlash] = useState(false);
  const [metodoPago, setMetodoPago] = useState("");

  const cerrarSesion = () => {
    setRol(null);
  };

  return (
    <div className="colaborador-page">
      <aside className="colaborador-sidebar">
        <div className="colaborador-logo">
          <h1>H&amp;D Boutique</h1>
          <p>Panel de colaborador</p>
        </div>

        <nav className="colaborador-menu">
          <button className="active">Inicio</button>
          <button>Nueva venta</button>
          <button>Ventas del día</button>
          <button>Recibos</button>
          <button>Productos</button>
          <button>Clientes</button>
          <button onClick={cerrarSesion} className="logout-btn">
            Cerrar sesión
          </button>
        </nav>
      </aside>

      <main className="colaborador-main">
        <section className="colaborador-header">
          <div>
            <h2>Inicio</h2>
            <p>Resumen general del día</p>
          </div>

          <button
            className="venta-flash-btn"
            onClick={() => setMostrarVentaFlash(true)}
          >
            Venta Flash
          </button>
        </section>

        <section className="colaborador-cards">
          <div className="colaborador-card">
            <p>Ventas del día</p>
            <h3>$ 3,250.00</h3>
            <span>Ingresos generados hoy</span>
          </div>

          <div className="colaborador-card">
            <p>Productos vendidos</p>
            <h3>28</h3>
            <span>Total de prendas vendidas</span>
          </div>

          <div className="colaborador-card">
            <p>Clientes atendidos</p>
            <h3>16</h3>
            <span>Clientes registrados hoy</span>
          </div>

          <div className="colaborador-card">
            <p>Recibos emitidos</p>
            <h3>12</h3>
            <span>Comprobantes generados</span>
          </div>
        </section>

        <section className="colaborador-content">
          <div className="ventas-resumen">
            <h3>Resumen de ventas</h3>

            <div className="grafica-falsa">
              <div style={{ height: "35%" }}></div>
              <div style={{ height: "55%" }}></div>
              <div style={{ height: "45%" }}></div>
              <div style={{ height: "70%" }}></div>
              <div style={{ height: "85%" }}></div>
              <div style={{ height: "75%" }}></div>
            </div>

            <div className="dias-grafica">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
            </div>
          </div>

          <div className="ultimas-ventas">
            <h3>Últimas ventas</h3>

            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Producto</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>11:45 AM</td>
                  <td>Cliente general</td>
                  <td>Blusa</td>
                  <td>$ 650.00</td>
                </tr>

                <tr>
                  <td>10:30 AM</td>
                  <td>Cliente general</td>
                  <td>Jean</td>
                  <td>$ 420.00</td>
                </tr>

                <tr>
                  <td>09:15 AM</td>
                  <td>Cliente general</td>
                  <td>Vestido</td>
                  <td>$ 380.00</td>
                </tr>

                <tr>
                  <td>08:20 AM</td>
                  <td>Cliente general</td>
                  <td>Camisa</td>
                  <td>$ 210.00</td>
                </tr>

                <tr>
                  <td>07:50 AM</td>
                  <td>Cliente general</td>
                  <td>Falda</td>
                  <td>$ 150.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {mostrarVentaFlash && (
        <div className="modal-fondo">
          <div className="venta-flash-modal">
            <button
              className="cerrar-modal"
              onClick={() => setMostrarVentaFlash(false)}
            >
              ×
            </button>

            <h2>Venta Flash</h2>
            <p>Registra una venta rápida del colaborador.</p>

            <div className="form-flash">
              <label>Producto</label>
              <input type="text" placeholder="Ej: Blusa casual" />

              <label>Cantidad</label>
              <input type="number" placeholder="Ej: 1" />

              <label>Total</label>
              <input type="number" placeholder="Ej: 350" />

              <label>Método de pago</label>
              <div className="metodos-pago">
                <button
                  type="button"
                  className={metodoPago === "Efectivo" ? "seleccionado" : ""}
                  onClick={() => setMetodoPago("Efectivo")}
                >
                  Efectivo
                </button>

                <button
                  type="button"
                  className={
                    metodoPago === "Transferencia" ? "seleccionado" : ""
                  }
                  onClick={() => setMetodoPago("Transferencia")}
                >
                  Transferencia
                </button>
              </div>

              <button className="registrar-flash">Registrar venta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardColaborador;
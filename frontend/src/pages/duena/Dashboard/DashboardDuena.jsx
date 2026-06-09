import { useEffect, useMemo, useState } from "react";
import {
  obtenerClientesTop,
  obtenerDashboard,
  obtenerProductosTop,
  obtenerResumenVentasDashboard,
} from "../../../api/api";
import "./DashboardDuena.css";

import Productos from "../Productos/Productos";
import Proveedores from "../Proveedores/Proveedores";
import Clientes from "../Clientes/Clientes";
import Empleados from "../Empleados/Empleados";
import Compras from "../Compras/Compras";
import Perdidas from "../Perdidas/Perdidas";
//parte de cris en el frontend//
import NuevaVenta from "../NuevaVenta/NuevaVenta";
import Ventas from "../Ventas/Ventas";
import Recibos from "../Recibos/Recibos";


const resumenInicial = {
  ventas_dia: 0,
  cantidad_ventas_dia: 0,
  ventas_mes: 0,
  cantidad_ventas_mes: 0,
  stock_bajo: 0,
  productos_vendidos_mes: 0,
};

const ventasSemanalesIniciales = [
  { dia: "Lun", total: 0 },
  { dia: "Mar", total: 0 },
  { dia: "Mié", total: 0 },
  { dia: "Jue", total: 0 },
  { dia: "Vie", total: 0 },
  { dia: "Sáb", total: 0 },
  { dia: "Dom", total: 0 },
];

function formatearMoneda(valor) {
  const numero = Number(valor) || 0;

  return `C$ ${numero.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "-";
  }

  const [anio, mes, dia] = fecha.split("-");

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
}

const resumenVentasInicial = {
  periodo: "semanal",
  titulo: "Semana actual",
  etiquetas: ventasSemanalesIniciales.map((venta) => venta.dia),
  datos: ventasSemanalesIniciales.map((venta) => ({
    etiqueta: venta.dia,
    total_vendido: venta.total,
    cantidad_ventas: 0,
  })),
  total_periodo: 0,
  cantidad_ventas_periodo: 0,
};

const mesesFiltro = [
  { valor: 1, nombre: "Enero" },
  { valor: 2, nombre: "Febrero" },
  { valor: 3, nombre: "Marzo" },
  { valor: 4, nombre: "Abril" },
  { valor: 5, nombre: "Mayo" },
  { valor: 6, nombre: "Junio" },
  { valor: 7, nombre: "Julio" },
  { valor: 8, nombre: "Agosto" },
  { valor: 9, nombre: "Septiembre" },
  { valor: 10, nombre: "Octubre" },
  { valor: 11, nombre: "Noviembre" },
  { valor: 12, nombre: "Diciembre" },
];

function DashboardDuena({ setRol }) {
  const fechaActual = new Date();
  const [vistaActual, setVistaActual] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [periodoVentas, setPeriodoVentas] = useState("semanal");
  const [mesVentas, setMesVentas] = useState(fechaActual.getMonth() + 1);
  const [anioVentas, setAnioVentas] = useState(fechaActual.getFullYear());
  const [resumenVentas, setResumenVentas] = useState(resumenVentasInicial);
  const [cargandoResumenVentas, setCargandoResumenVentas] = useState(true);
  const [errorResumenVentas, setErrorResumenVentas] = useState("");
  const [periodoTop, setPeriodoTop] = useState("mensual");
  const [clientesTop, setClientesTop] = useState([]);
  const [productosTop, setProductosTop] = useState([]);
  const [cargandoDashboard, setCargandoDashboard] = useState(true);
  const [errorDashboard, setErrorDashboard] = useState("");

  const cargarDashboard = async () => {
    try {
      setCargandoDashboard(true);
      setErrorDashboard("");

      const datos = await obtenerDashboard();
      setDashboard(datos);
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
      setErrorDashboard("No se pudieron cargar los datos del dashboard.");
    } finally {
      setCargandoDashboard(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  useEffect(() => {
    const cargarResumenVentas = async () => {
      try {
        setCargandoResumenVentas(true);
        setErrorResumenVentas("");

        const filtros = {
          periodo: periodoVentas,
          anio: anioVentas,
        };

        if (periodoVentas === "mensual") {
          filtros.mes = mesVentas;
        }

        // El grafico usa datos agrupados por backend; el frontend solo cambia el periodo.
        const datos = await obtenerResumenVentasDashboard(filtros);
        setResumenVentas(datos || resumenVentasInicial);
      } catch (error) {
        console.error("Error al cargar resumen de ventas:", error);
        setResumenVentas(resumenVentasInicial);
        setErrorResumenVentas(
          error.message || "No se pudo cargar el resumen de ventas."
        );
      } finally {
        setCargandoResumenVentas(false);
      }
    };

    cargarResumenVentas();
  }, [periodoVentas, mesVentas, anioVentas]);

  useEffect(() => {
    const cargarEstadisticasTop = async () => {
      try {
        const [clientesRespuesta, productosRespuesta] = await Promise.all([
          obtenerClientesTop(periodoTop),
          obtenerProductosTop(periodoTop),
        ]);

        setClientesTop(clientesRespuesta || []);
        setProductosTop(productosRespuesta || []);
      } catch (error) {
        console.error("Error al cargar estadísticas top:", error);
        setClientesTop([]);
        setProductosTop([]);
      }
    };

    cargarEstadisticasTop();
  }, [periodoTop]);

  const resumen = dashboard?.resumen || resumenInicial;
  const ultimasVentas = dashboard?.ultimas_ventas || [];
  const aniosFiltro = useMemo(() => {
    const anioBase = new Date().getFullYear();

    return Array.from({ length: 7 }, (_, indice) => anioBase - indice);
  }, []);
  const datosGraficoVentas = resumenVentas?.datos || resumenVentasInicial.datos;
  const hayVentasPeriodo = Number(resumenVentas?.cantidad_ventas_periodo || 0) > 0;

  const maxVentaPeriodo = useMemo(() => {
    const maximo = Math.max(
      ...datosGraficoVentas.map((venta) => Number(venta.total_vendido) || 0)
    );

    return maximo > 0 ? maximo : 1;
  }, [datosGraficoVentas]);

  const obtenerAlturaBarraPeriodo = (total) => {
    const valor = Number(total) || 0;

    if (valor <= 0) {
      return "8px";
    }

    return `${Math.max((valor / maxVentaPeriodo) * 170, 26)}px`;
  };

  const cambiarPeriodoVentas = (periodo) => {
    setPeriodoVentas(periodo);
  };

  const volverPeriodoActual = () => {
    const hoy = new Date();
    setPeriodoVentas("semanal");
    setMesVentas(hoy.getMonth() + 1);
    setAnioVentas(hoy.getFullYear());
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
                vistaActual === "perdidas" ? "menu-item active" : "menu-item"
              }
              onClick={() => setVistaActual("perdidas")}
            >
              Pérdidas
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
                </div>

                {cargandoDashboard && (
                  <p className="dashboard-estado">
                    Cargando datos del dashboard...
                  </p>
                )}

                {errorDashboard && (
                  <p className="dashboard-error">{errorDashboard}</p>
                )}

                <div className="cards-grid">
                  <div className="dashboard-card">
                    <h3>Ventas del día</h3>
                    <div className="card-main-value">
                      {formatearMoneda(resumen.ventas_dia)}
                    </div>
                    <p>{resumen.cantidad_ventas_dia} ventas</p>
                    <div className="card-line"></div>
                  </div>

                  <div className="dashboard-card">
                    <h3>Ventas del mes</h3>
                    <div className="card-main-value">
                      {formatearMoneda(resumen.ventas_mes)}
                    </div>
                    <p>{resumen.cantidad_ventas_mes} ventas</p>
                    <div className="card-line"></div>
                  </div>

                  <div className="dashboard-card alerta-stock">
                    <h3>Stock bajo</h3>
                    <div className="card-main-value">{resumen.stock_bajo}</div>
                    <p>Productos con stock &lt;= 5</p>
                    <div className="card-line"></div>
                  </div>

                  <div className="dashboard-card">
                    <h3>Productos vendidos</h3>
                    <div className="card-main-value">
                      {resumen.productos_vendidos_mes}
                    </div>
                    <p>Este mes</p>
                    <div className="card-line"></div>
                  </div>
                </div>

                <div className="dashboard-row">
                  <div className="panel large-panel">
                    <div className="ventas-resumen-header">
                      <div>
                        <h3>Resumen de ventas</h3>
                        <p>{resumenVentas?.titulo || "Semana actual"}</p>
                      </div>

                      <button
                        className="periodo-actual-btn"
                        type="button"
                        onClick={volverPeriodoActual}
                      >
                        Actual
                      </button>
                    </div>

                    <div className="periodo-selector" aria-label="Periodo de ventas">
                      {["semanal", "mensual", "anual"].map((periodo) => (
                        <button
                          key={periodo}
                          type="button"
                          className={
                            periodoVentas === periodo
                              ? "periodo-opcion active"
                              : "periodo-opcion"
                          }
                          onClick={() => cambiarPeriodoVentas(periodo)}
                        >
                          {periodo === "semanal" && "Semanal"}
                          {periodo === "mensual" && "Mensual"}
                          {periodo === "anual" && "Anual"}
                        </button>
                      ))}
                    </div>

                    <div className="periodo-filtros">
                      {periodoVentas === "mensual" && (
                        <select
                          value={mesVentas}
                          onChange={(e) => setMesVentas(Number(e.target.value))}
                        >
                          {mesesFiltro.map((mes) => (
                            <option key={mes.valor} value={mes.valor}>
                              {mes.nombre}
                            </option>
                          ))}
                        </select>
                      )}

                      {periodoVentas !== "semanal" && (
                        <select
                          value={anioVentas}
                          onChange={(e) => setAnioVentas(Number(e.target.value))}
                        >
                          {aniosFiltro.map((anio) => (
                            <option key={anio} value={anio}>
                              {anio}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="ventas-periodo-metricas">
                      <div>
                        <span>Total vendido</span>
                        <strong>{formatearMoneda(resumenVentas?.total_periodo)}</strong>
                      </div>
                      <div>
                        <span>Cantidad de ventas</span>
                        <strong>{resumenVentas?.cantidad_ventas_periodo || 0}</strong>
                      </div>
                    </div>

                    {cargandoResumenVentas && (
                      <p className="resumen-ventas-estado">
                        Cargando resumen de ventas...
                      </p>
                    )}

                    {errorResumenVentas && (
                      <p className="resumen-ventas-error">{errorResumenVentas}</p>
                    )}

                    {!cargandoResumenVentas && !errorResumenVentas && !hayVentasPeriodo && (
                      <p className="resumen-ventas-vacio">
                        No hay ventas registradas para este periodo.
                      </p>
                    )}

                    <div className="fake-chart">
                      <div className="chart-area ventas-periodo-chart">
                        {datosGraficoVentas.map((venta) => (
                          <div className="chart-column" key={venta.etiqueta}>
                            {Number(venta.total_vendido) > 0 ? (
                              <strong className="bar-value">
                                {formatearMoneda(venta.total_vendido)}
                              </strong>
                            ) : (
                              <span className="bar-value bar-value-empty" />
                            )}
                            <div
                              className="bar"
                              title={`${formatearMoneda(
                                venta.total_vendido
                              )} - ${venta.cantidad_ventas} ventas`}
                              style={{
                                height: obtenerAlturaBarraPeriodo(
                                  venta.total_vendido
                                ),
                              }}
                            ></div>
                            <span>{venta.etiqueta}</span>
                          </div>
                        ))}
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
                        {ultimasVentas.length > 0 ? (
                          ultimasVentas.map((venta) => (
                            <tr key={venta.id_venta}>
                              <td>{formatearFecha(venta.fecha)}</td>
                              <td>{venta.cliente}</td>
                              <td>{venta.producto}</td>
                              <td>{formatearMoneda(venta.total)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="sin-ventas-dashboard" colSpan="4">
                              No hay ventas registradas todavía.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="panel estadisticas-top-panel">
                  <div className="estadisticas-top-header">
                    <h3>Estadísticas de ventas</h3>
                    <select
                      value={periodoTop}
                      onChange={(e) => setPeriodoTop(e.target.value)}
                    >
                      <option value="general">General</option>
                      <option value="mensual">Mensual</option>
                      <option value="semanal">Semanal</option>
                    </select>
                  </div>

                  <div className="estadisticas-top-grid">
                    <div>
                      <h4>Clientes que más han comprado</h4>
                      <table className="sales-table">
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            <th>Compras</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientesTop.length > 0 ? (
                            clientesTop.map((cliente) => (
                              <tr key={cliente.ID_Cliente}>
                                <td>{cliente.cliente}</td>
                                <td>{cliente.compras}</td>
                                <td>{formatearMoneda(cliente.total)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="sin-ventas-dashboard" colSpan="3">
                                No hay clientes para este periodo.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h4>Productos más vendidos</h4>
                      <table className="sales-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosTop.length > 0 ? (
                            productosTop.map((producto) => (
                              <tr key={producto.ID_Producto}>
                                <td>{producto.producto}</td>
                                <td>{producto.cantidad}</td>
                                <td>{formatearMoneda(producto.total)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="sin-ventas-dashboard" colSpan="3">
                                No hay productos para este periodo.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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

            {vistaActual === "perdidas" && (
              <div className="vista-modulo">
                <Perdidas />
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
    </>
  );
}

export default DashboardDuena;

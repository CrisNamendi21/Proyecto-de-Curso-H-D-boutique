import "./App.css";

import { useEffect, useState } from "react";
import {
  eliminarToken,
  obtenerToken,
  obtenerUsuarioActual,
} from "./api/api";
import InicioSesion from "./pages/InicioSesion/InicioSesion";
import DashboardColaborador from "./pages/colaborador/Dashboard/DashboardColaborador";
import DashboardDuena from "./pages/duena/Dashboard/DashboardDuena";

function App() {
  const [sesion, setSesion] = useState(null);
  const [validandoSesion, setValidandoSesion] = useState(Boolean(obtenerToken()));

  useEffect(() => {
    const validarTokenGuardado = async () => {
      const token = obtenerToken();

      if (!token) {
        setValidandoSesion(false);
        return;
      }

      try {
        const usuarioActual = await obtenerUsuarioActual();
        setSesion(usuarioActual);
      } catch {
        eliminarToken();
      } finally {
        setValidandoSesion(false);
      }
    };

    validarTokenGuardado();
  }, []);

  const manejarLoginCorrecto = (datosSesion) => {
    setSesion({
      rol: datosSesion.rol,
      nombre: datosSesion.nombre,
      usuario: datosSesion.usuario,
      id_empleado: datosSesion.id_empleado,
    });
  };

  const cerrarSesion = () => {
    eliminarToken();
    setSesion(null);
  };

  if (!sesion) {
    if (validandoSesion) {
      return (
        <main className="login-page">
          <section className="login-card">
            <h1>H&amp;D Boutique</h1>
            <p>Validando sesión...</p>
          </section>
        </main>
      );
    }

    return <InicioSesion onLoginCorrecto={manejarLoginCorrecto} />;
  }

  if (sesion.rol === "duena") {
    return <DashboardDuena setRol={cerrarSesion} />;
  }

  return <DashboardColaborador sesion={sesion} cerrarSesion={cerrarSesion} />;
}

export default App;

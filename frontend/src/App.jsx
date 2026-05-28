import "./App.css";

import { useEffect, useState } from "react";
import {
  eliminarToken,
  obtenerToken,
  obtenerUsuarioActual,
} from "./api/api";
import InicioSesion from "./pages/InicioSesion/InicioSesion";
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

  return <DashboardDuena setRol={cerrarSesion} />;
}

export default App;

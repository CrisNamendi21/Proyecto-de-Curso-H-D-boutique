import { useState } from "react";
import { iniciarSesionDuena } from "../../api/api";
import "./InicioSesion.css";

function InicioSesion({ onLoginCorrecto }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setCargando(true);

    try {
      const sesion = await iniciarSesionDuena({
        Usuario: usuario,
        Password: password,
      });

      onLoginCorrecto(sesion);
    } catch (error) {
      setMensaje(error.message || "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>H&amp;D Boutique</h1>
        <p>Sistema administrativo interno</p>

        <h2>Inicio de sesión</h2>

        <form className="login-form" onSubmit={manejarSubmit}>
          <div className="login-field">
            <label>Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingrese el usuario"
              autoComplete="username"
              required
            />
          </div>

          <div className="login-field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              required
            />
          </div>

          {mensaje && <p className="login-error">{mensaje}</p>}

          <button className="login-btn duena" type="submit" disabled={cargando}>
            {cargando ? "Validando..." : "Ingresar como dueña"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default InicioSesion;

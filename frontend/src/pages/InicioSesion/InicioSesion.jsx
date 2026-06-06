import { useState } from "react";
import { iniciarSesion } from "../../api/api";
import "./InicioSesion.css";

function InicioSesion({ onLoginCorrecto }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [erroresFormulario, setErroresFormulario] = useState([]);
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    const errores = [];

    if (!usuario.trim()) {
      errores.push("Ingresa tu usuario.");
    }

    if (!password.trim()) {
      errores.push("Ingresa tu contraseña.");
    }

    if (errores.length > 0) {
      setErroresFormulario(errores);
      return;
    }

    setErroresFormulario([]);
    setCargando(true);

    try {
      const sesion = await iniciarSesion({
        Usuario: usuario,
        Password: password,
      });

      onLoginCorrecto(sesion);
    } catch (error) {
      setMensaje(
        error.message ||
          "No pudimos iniciar sesión. Revisa tus datos e intenta nuevamente."
      );
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

        <form className="login-form" onSubmit={manejarSubmit} noValidate>
          <div className="login-field">
            <label>Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value);
                setErroresFormulario([]);
                setMensaje("");
              }}
              placeholder="Ingrese el usuario"
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label>Contraseña</label>
            <div className="password-input">
              <input
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErroresFormulario([]);
                  setMensaje("");
                }}
                placeholder="Contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                className={`password-toggle ${
                  mostrarPassword ? "visible" : ""
                }`}
                onClick={() => setMostrarPassword(!mostrarPassword)}
                aria-label={
                  mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                title={
                  mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                <span aria-hidden="true" />
              </button>
            </div>
          </div>

          {erroresFormulario.length > 0 && (
            <div className="login-error-list" role="alert">
              {erroresFormulario.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          {mensaje && <p className="login-error">{mensaje}</p>}

          <button className="login-btn duena" type="submit" disabled={cargando}>
            {cargando ? "Validando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default InicioSesion;

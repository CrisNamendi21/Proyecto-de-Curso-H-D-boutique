import { useState } from "react";
import "./InicioSesion.css";

function InicioSesion({ setRol }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setError("");

    if (usuario.trim() === "" || contrasena.trim() === "") {
      setError("Debe ingresar usuario y contraseña.");
      return;
    }

    try {
      const respuesta = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: usuario,
          contrasena: contrasena,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        setError(data.detail || "Usuario o contraseña incorrectos.");
        return;
      }

      setRol(data.rol);
    } catch (error) {
      setError("No se pudo conectar con el servidor.");
    }
  };

  return (
    <main className="inicio-sesion-page">
      <section className="inicio-sesion-card">
        <h1>H&D Boutique</h1>
        <p>Ingrese sus credenciales para acceder al sistema</p>

        <form className="inicio-sesion-form" onSubmit={iniciarSesion}>
          <div className="campo-login">
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Ingrese su usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <div className="campo-login">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Ingrese su contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </div>

          {error && <p className="mensaje-error-login">{error}</p>}

          <button className="btn-ingresar" type="submit">
            Ingresar
          </button>
        </form>
      </section>
    </main>
  );
}

export default InicioSesion;
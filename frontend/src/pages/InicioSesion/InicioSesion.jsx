import "./InicioSesion.css";

function InicioSesion({ setRol }) {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <h1>H&D Boutique</h1>
          <p>Sistema de control de inventario, compras y ventas</p>
        </div>

        <div className="login-content">
          <h2>Selecciona tu perfil</h2>
          <p>Elige el panel al que deseas ingresar.</p>

          <div className="login-options">
            <button className="login-btn duena" onClick={() => setRol("duena")}>
              Entrar como Dueña
            </button>

            <button
              className="login-btn colaborador"
              onClick={() => setRol("colaborador")}
            >
              Entrar como Colaborador
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default InicioSesion;
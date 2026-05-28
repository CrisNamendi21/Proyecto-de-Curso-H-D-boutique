import { useState } from "react";
import "./App.css";

import InicioSesion from "./pages/iniciosesion/InicioSesion";
import DashboardDuena from "./pages/duena/Dashboard/DashboardDuena";

function App() {
  const [rol, setRol] = useState(null);

  if (rol === "duena") {
    return <DashboardDuena setRol={setRol} />;
  }

  if (rol === "colaborador") {
    return (
      <main className="login-page">
        <section className="login-card">
          <h1>H&D Boutique</h1>
          <p>Panel del colaborador</p>
          <h2>Dashboard de colaborador pendiente</h2>

          <div className="login-options">
            <button
              className="login-btn colaborador"
              onClick={() => setRol(null)}
            >
              Volver al inicio
            </button>
          </div>
        </section>
      </main>
    );
  }

  return <InicioSesion setRol={setRol} />;
}

export default App;
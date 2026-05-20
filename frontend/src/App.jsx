import { useState } from "react";
import "./App.css";

import InicioSesion from "./pages/InicioSesion/InicioSesion";
import DashboardDuena from "./pages/duena/Dashboard/DashboardDuena";
import DashboardColaborador from "./pages/colaborador/Dashboard/DashboardColaborador";

function App() {
  const [rol, setRol] = useState(null);

  if (rol === "duena") {
    return <DashboardDuena setRol={setRol} />;
  }

  if (rol === "colaborador") {
    return <DashboardColaborador setRol={setRol} />;
  }

  return <InicioSesion setRol={setRol} />;
}

export default App;
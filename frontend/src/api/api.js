const API_URL = "http://127.0.0.1:8000";

async function procesarRespuesta(respuesta, mensajeError) {
  let datos = null;

  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    const detalle = datos?.detail;

    if (Array.isArray(detalle)) {
      throw new Error("Hay campos inválidos o incompletos en la solicitud.");
    }

    throw new Error(detalle || mensajeError);
  }

  return datos;
}

export async function obtenerDatos(ruta) {
  try {
    const respuesta = await fetch(`${API_URL}${ruta}`);

    return await procesarRespuesta(
      respuesta,
      "Error al obtener datos del servidor"
    );
  } catch (error) {
    console.error("Error en obtenerDatos:", error);
    throw error;
  }
}

export async function enviarDatos(ruta, datos) {
  try {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    return await procesarRespuesta(
      respuesta,
      "Error al enviar datos al servidor"
    );
  } catch (error) {
    console.error("Error en enviarDatos:", error);
    throw error;
  }
}

export async function actualizarDatos(ruta, datos) {
  try {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    return await procesarRespuesta(
      respuesta,
      "Error al actualizar datos en el servidor"
    );
  } catch (error) {
    console.error("Error en actualizarDatos:", error);
    throw error;
  }
}

export function obtenerProductos() {
  return obtenerDatos("/productos/");
}

export function obtenerTiposPago() {
  return obtenerDatos("/tipos-pago/");
}

export function obtenerDepartamentos() {
  return obtenerDatos("/departamentos/");
}

export function obtenerMunicipios() {
  return obtenerDatos("/municipios/");
}

export function obtenerMunicipiosPorDepartamento(idDepartamento) {
  return obtenerDatos(`/municipios/departamento/${idDepartamento}`);
}

export function registrarVentaCompleta(datos) {
  return enviarDatos("/ventas/registrar-completa", datos);
}

export function obtenerDashboard() {
  return obtenerDatos("/dashboard/");
}

export function obtenerResumenVentasDia(filtros = {}) {
  const params = new URLSearchParams();

  if (filtros.fecha) {
    params.append("fecha", filtros.fecha);
  }

  if (filtros.cliente) {
    params.append("cliente", filtros.cliente);
  }

  if (filtros.metodoPago && filtros.metodoPago !== "Todos") {
    params.append("metodo_pago", filtros.metodoPago);
  }

  const query = params.toString();

  return obtenerDatos(`/ventas/resumen-dia${query ? `?${query}` : ""}`);
}

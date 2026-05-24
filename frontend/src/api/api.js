const API_URL = "http://127.0.0.1:8000";

export async function obtenerDatos(ruta) {
  try {
    const respuesta = await fetch(`${API_URL}${ruta}`);

    if (!respuesta.ok) {
      throw new Error("Error al obtener datos del servidor");
    }

    return await respuesta.json();
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

    if (!respuesta.ok) {
      throw new Error("Error al enviar datos al servidor");
    }

    return await respuesta.json();
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

    if (!respuesta.ok) {
      throw new Error("Error al actualizar datos en el servidor");
    }

    return await respuesta.json();
  } catch (error) {
    console.error("Error en actualizarDatos:", error);
    throw error;
  }
}
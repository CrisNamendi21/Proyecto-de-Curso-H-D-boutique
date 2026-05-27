const API_URL = "http://127.0.0.1:8000";

async function procesarRespuesta(respuesta, mensajeError) {
  let datos;

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

export function obtenerProductosInventario() {
  return obtenerDatos("/productos/");
}

export function obtenerResumenInventario() {
  return obtenerDatos("/productos/resumen-inventario");
}

export function crearProductoCompleto(datos) {
  return enviarDatos("/productos/registrar-completo", datos);
}

export function obtenerCategorias() {
  return obtenerDatos("/categorias/");
}

export function obtenerTallas() {
  return obtenerDatos("/tallas/");
}

export function obtenerProveedores() {
  return obtenerDatos("/proveedores/");
}

export function obtenerResumenProveedores() {
  return obtenerDatos("/proveedores/resumen");
}

export function crearProveedorCompleto(datos) {
  return enviarDatos("/proveedores/registrar-completo", datos);
}

export async function cambiarEstadoProveedor(idProveedor, estado) {
  try {
    const respuesta = await fetch(`${API_URL}/proveedores/${idProveedor}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Estado: estado }),
    });

    return await procesarRespuesta(
      respuesta,
      "Error al cambiar el estado del proveedor"
    );
  } catch (error) {
    console.error("Error en cambiarEstadoProveedor:", error);
    throw error;
  }
}

export function obtenerResumenClientes() {
  return obtenerDatos("/clientes/resumen");
}

export function obtenerClientes(filtros = {}) {
  const params = new URLSearchParams();

  if (filtros.busqueda) {
    params.append("busqueda", filtros.busqueda);
  }

  if (filtros.departamento && filtros.departamento !== "Todos") {
    params.append("departamento", filtros.departamento);
  }

  const query = params.toString();

  return obtenerDatos(`/clientes/${query ? `?${query}` : ""}`);
}

export function obtenerClientesRecientes() {
  return obtenerDatos("/clientes/recientes");
}

export function crearClienteCompleto(datos) {
  return enviarDatos("/clientes/registrar-completo", datos);
}

export function buscarClientes(busqueda) {
  const params = new URLSearchParams();
  params.append("busqueda", busqueda);

  return obtenerDatos(`/clientes/buscar?${params.toString()}`);
}

export function obtenerResumenEmpleados() {
  return obtenerDatos("/empleados/resumen");
}

export function obtenerEmpleados(filtros = {}) {
  const params = new URLSearchParams();

  if (filtros.busqueda) {
    params.append("busqueda", filtros.busqueda);
  }

  if (filtros.estado && filtros.estado !== "Todos") {
    params.append("estado", filtros.estado);
  }

  const query = params.toString();

  return obtenerDatos(`/empleados/${query ? `?${query}` : ""}`);
}

export function crearEmpleadoCompleto(datos) {
  return enviarDatos("/empleados/registrar-completo", datos);
}

export async function cambiarEstadoEmpleado(idEmpleado, estado) {
  try {
    const respuesta = await fetch(`${API_URL}/empleados/${idEmpleado}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Estado: estado }),
    });

    return await procesarRespuesta(
      respuesta,
      "Error al cambiar el estado del empleado"
    );
  } catch (error) {
    console.error("Error en cambiarEstadoEmpleado:", error);
    throw error;
  }
}

export function obtenerResumenCompras() {
  return obtenerDatos("/compras/resumen");
}

export function obtenerCompras(filtros = {}) {
  const params = new URLSearchParams();

  if (filtros.busqueda) {
    params.append("busqueda", filtros.busqueda);
  }

  if (filtros.proveedor) {
    params.append("proveedor", filtros.proveedor);
  }

  if (filtros.fecha) {
    params.append("fecha", filtros.fecha);
  }

  if (filtros.estado) {
    params.append("estado", filtros.estado);
  }

  const query = params.toString();

  return obtenerDatos(`/compras/${query ? `?${query}` : ""}`);
}

export function obtenerProductosPorProveedor(idProveedor) {
  return obtenerDatos(`/proveedores/${idProveedor}/productos`);
}

export function registrarCompraCompleta(datos) {
  return enviarDatos("/compras/registrar-completa", datos);
}

export function marcarCompraRecibida(idCompra) {
  return actualizarDatos(`/compras/${idCompra}/recibir`, {});
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

export function obtenerResumenRecibos() {
  return obtenerDatos("/recibos/resumen");
}

export function obtenerRecibos(filtros = {}) {
  const params = new URLSearchParams();

  if (filtros.fecha) {
    params.append("fecha", filtros.fecha);
  }

  if (filtros.busqueda) {
    params.append("busqueda", filtros.busqueda);
  }

  if (filtros.medioPago && filtros.medioPago !== "Todos") {
    params.append("medio_pago", filtros.medioPago);
  }

  const query = params.toString();

  return obtenerDatos(`/recibos/${query ? `?${query}` : ""}`);
}

export function obtenerUltimoRecibo() {
  return obtenerDatos("/recibos/ultimo");
}

export function obtenerDetalleRecibo(idRecibo) {
  return obtenerDatos(`/recibos/${idRecibo}`);
}

export async function descargarPdfRecibo(idRecibo) {
  try {
    const respuesta = await fetch(`${API_URL}/recibos/${idRecibo}/pdf`);

    if (!respuesta.ok) {
      await procesarRespuesta(respuesta, "Error al descargar el PDF del recibo");
    }

    const blob = await respuesta.blob();
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = `recibo-${idRecibo}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error en descargarPdfRecibo:", error);
    throw error;
  }
}

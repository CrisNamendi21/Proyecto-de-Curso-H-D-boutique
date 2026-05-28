import { useEffect, useMemo, useState } from "react";
import {
  buscarClientes,
  obtenerDepartamentos,
  obtenerMunicipiosPorDepartamento,
  obtenerProductos,
  obtenerTiposPago,
  registrarVentaCompleta,
} from "../../../api/api";
import "./NuevaVenta.css";

const ID_EMPLEADO_TEMPORAL = 1;

function NuevaVenta({ idEmpleado = ID_EMPLEADO_TEMPORAL }) {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const [productos, setProductos] = useState([]);
  const [tiposPago, setTiposPago] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [cargandoMunicipios, setCargandoMunicipios] = useState(false);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [registrandoVenta, setRegistrandoVenta] = useState(false);

  const [tipoCliente, setTipoCliente] = useState("generico");
  const [nombresCliente, setNombresCliente] = useState("");
  const [apellidosCliente, setApellidosCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [direccionCliente, setDireccionCliente] = useState("");
  const [departamentoCliente, setDepartamentoCliente] = useState("");
  const [municipioCliente, setMunicipioCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);
  const [mostrarSugerenciasClientes, setMostrarSugerenciasClientes] =
    useState(false);
  const [fecha, setFecha] = useState(obtenerFechaActual());
  const [metodoPago, setMetodoPago] = useState("");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [costoDelivery, setCostoDelivery] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [productosVenta, setProductosVenta] = useState([]);
  const [notas, setNotas] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");

  const mostrarMensaje = (texto, tipo = "info") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  const formatearDinero = (valor) => {
    return `C$ ${Number(valor).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const convertirACentavos = (valor) => Math.round((Number(valor) || 0) * 100);

  const obtenerTipoPagoPorNombre = (nombre) => {
    return tiposPago.find((tipoPago) =>
      tipoPago.NombrePago.toLowerCase().includes(nombre)
    );
  };

  const cargarDatosIniciales = async () => {
    setCargandoDatos(true);

    try {
      const [productosRespuesta, tiposPagoRespuesta, departamentosRespuesta] =
        await Promise.all([
          obtenerProductos(),
          obtenerTiposPago(),
          obtenerDepartamentos(),
        ]);

      setProductos(productosRespuesta);
      setTiposPago(tiposPagoRespuesta);
      setDepartamentos(departamentosRespuesta);
      setMensaje("");
    } catch (error) {
      mostrarMensaje(
        error.message || "No se pudieron cargar los datos del servidor.",
        "error"
      );
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    const cargarMunicipios = async () => {
      if (tipoCliente !== "delivery" || !departamentoCliente) {
        setMunicipios([]);
        setMunicipioCliente("");
        return;
      }

      setCargandoMunicipios(true);

      try {
        const municipiosRespuesta = await obtenerMunicipiosPorDepartamento(
          departamentoCliente
        );

        setMunicipios(municipiosRespuesta);
      } catch (error) {
        setMunicipios([]);
        mostrarMensaje(
          error.message || "No se pudieron cargar los municipios.",
          "error"
        );
      } finally {
        setCargandoMunicipios(false);
      }
    };

    cargarMunicipios();
  }, [departamentoCliente, tipoCliente]);

  useEffect(() => {
    if (tipoCliente !== "delivery") {
      setSugerenciasClientes([]);
      setMostrarSugerenciasClientes(false);
      setBuscandoClientes(false);
      return;
    }

    const termino = nombresCliente.trim();

    if (
      clienteSeleccionado &&
      String(clienteSeleccionado.Nombres || "") === termino
    ) {
      setSugerenciasClientes([]);
      setMostrarSugerenciasClientes(false);
      setBuscandoClientes(false);
      return;
    }

    if (termino.length < 2) {
      setSugerenciasClientes([]);
      setMostrarSugerenciasClientes(false);
      setBuscandoClientes(false);
      return;
    }

    const temporizador = setTimeout(async () => {
      setBuscandoClientes(true);

      try {
        const clientesRespuesta = await buscarClientes(termino);
        setSugerenciasClientes(clientesRespuesta || []);
        setMostrarSugerenciasClientes(true);
      } catch (error) {
        setSugerenciasClientes([]);
        setMostrarSugerenciasClientes(false);
        mostrarMensaje(
          error.message || "No se pudieron buscar clientes existentes.",
          "error"
        );
      } finally {
        setBuscandoClientes(false);
      }
    }, 300);

    return () => clearTimeout(temporizador);
  }, [clienteSeleccionado, nombresCliente, tipoCliente]);

  const manejarTextoCliente = (setter) => (e) => {
    const valor = e.target.value;

    if (/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/.test(valor)) {
      setClienteSeleccionado(null);
      setter(valor);
    }
  };

  const manejarMetodoPago = (e) => {
    setMetodoPago(e.target.value);
    setReferenciaPago("");
    setMontoEfectivo("");
    setMontoTransferencia("");
    setMensaje("");
  };

  const manejarDepartamentoCliente = (e) => {
    setDepartamentoCliente(e.target.value);
    setMunicipioCliente("");
    setClienteSeleccionado(null);
    setMensaje("");
  };

  const manejarTipoCliente = (e) => {
    const nuevoTipo = e.target.value;

    setTipoCliente(nuevoTipo);
    setNombresCliente("");
    setApellidosCliente("");
    setTelefonoCliente("");
    setDireccionCliente("");
    setDepartamentoCliente("");
    setMunicipioCliente("");
    setClienteSeleccionado(null);
    setSugerenciasClientes([]);
    setMostrarSugerenciasClientes(false);
    setMunicipios([]);
    setCostoDelivery("");
    setMensaje("");
  };

  const clienteTieneDeliveryCompleto = (cliente) => {
    return Boolean(
      cliente?.ID_Cliente &&
        cliente?.Nombres &&
        cliente?.Apellidos &&
        cliente?.NumeroTelefono &&
        cliente?.Direccion &&
        cliente?.ID_Departamento &&
        cliente?.ID_Municipio
    );
  };

  const seleccionarClienteSugerido = async (cliente) => {
    setNombresCliente(cliente.Nombres || "");
    setApellidosCliente(cliente.Apellidos || "");
    setTelefonoCliente(cliente.NumeroTelefono || "");
    setDireccionCliente(cliente.Direccion || "");
    setClienteSeleccionado(cliente);
    setSugerenciasClientes([]);
    setMostrarSugerenciasClientes(false);
    setMensaje("");

    if (cliente.ID_Departamento) {
      const idDepartamento = String(cliente.ID_Departamento);
      setDepartamentoCliente(idDepartamento);

      try {
        setCargandoMunicipios(true);
        const municipiosRespuesta = await obtenerMunicipiosPorDepartamento(
          idDepartamento
        );

        setMunicipios(municipiosRespuesta || []);
        setMunicipioCliente(
          cliente.ID_Municipio ? String(cliente.ID_Municipio) : ""
        );
      } catch (error) {
        setMunicipios([]);
        setMunicipioCliente("");
        mostrarMensaje(
          error.message || "No se pudieron cargar los municipios del cliente.",
          "error"
        );
      } finally {
        setCargandoMunicipios(false);
      }
      return;
    }

    setDepartamentoCliente("");
    setMunicipioCliente("");
    setMunicipios([]);
  };

  const describirUbicacionCliente = (cliente) => {
    const partes = [cliente.Departamento, cliente.Municipio].filter(Boolean);

    return partes.length > 0 ? partes.join(", ") : "Sin ubicación registrada";
  };

  const productosFiltrados = productos.filter((producto) =>
    producto.Nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const obtenerPrecioProducto = (producto) => {
    return Number(producto.PrecioUnitario) || 0;
  };

  const obtenerTallaProducto = (producto) => {
    return producto.Talla || producto.NombreTalla || "Sin talla";
  };

  const agregarProducto = (producto) => {
    setMensaje("");

    const precio = obtenerPrecioProducto(producto);

    if (precio <= 0) {
      mostrarMensaje(
        "Este producto no tiene precio de venta configurado.",
        "error"
      );
      return;
    }

    if (producto.Stock <= 0) {
      mostrarMensaje("Este producto no tiene stock disponible.", "error");
      return;
    }

    const productoExistente = productosVenta.find(
      (item) => item.ID_Producto === producto.ID_Producto
    );

    if (productoExistente) {
      if (productoExistente.Cantidad >= producto.Stock) {
        mostrarMensaje(
          "No puedes agregar más unidades que el stock disponible.",
          "error"
        );
        return;
      }

      setProductosVenta(
        productosVenta.map((item) =>
          item.ID_Producto === producto.ID_Producto
            ? { ...item, Cantidad: item.Cantidad + 1 }
            : item
        )
      );
      return;
    }

    setProductosVenta([
      ...productosVenta,
      {
        ID_Producto: producto.ID_Producto,
        Nombre: producto.Nombre,
        Stock: producto.Stock,
        ID_Talla: producto.ID_Talla,
        Talla: obtenerTallaProducto(producto),
        PrecioUnitario: precio,
        Cantidad: 1,
      },
    ]);
  };

  const aumentarCantidad = (idProducto) => {
    setMensaje("");

    setProductosVenta(
      productosVenta.map((item) => {
        if (item.ID_Producto === idProducto) {
          if (item.Cantidad >= item.Stock) {
            mostrarMensaje("No puedes superar el stock disponible.", "error");
            return item;
          }

          return { ...item, Cantidad: item.Cantidad + 1 };
        }

        return item;
      })
    );
  };

  const disminuirCantidad = (idProducto) => {
    setMensaje("");

    setProductosVenta(
      productosVenta
        .map((item) => {
          if (item.ID_Producto !== idProducto) {
            return item;
          }

          if (item.Cantidad > 1) {
            return { ...item, Cantidad: item.Cantidad - 1 };
          }

          return null;
        })
        .filter(Boolean)
    );
  };

  const eliminarProducto = (idProducto) => {
    setProductosVenta(
      productosVenta.filter((item) => item.ID_Producto !== idProducto)
    );
  };

  const vaciarProductosVenta = () => {
    setProductosVenta([]);
    setMensaje("");
  };

  const vaciarVenta = () => {
    setTipoCliente("generico");
    setNombresCliente("");
    setApellidosCliente("");
    setTelefonoCliente("");
    setDireccionCliente("");
    setDepartamentoCliente("");
    setMunicipioCliente("");
    setClienteSeleccionado(null);
    setSugerenciasClientes([]);
    setMostrarSugerenciasClientes(false);
    setMunicipios([]);
    setFecha(obtenerFechaActual());
    setMetodoPago("");
    setReferenciaPago("");
    setMontoEfectivo("");
    setMontoTransferencia("");
    setCostoDelivery("");
    setBusqueda("");
    setProductosVenta([]);
    setNotas("");
    setMensaje("");
  };

  const totalProductos = useMemo(() => {
    return productosVenta.reduce(
      (total, item) => total + item.PrecioUnitario * item.Cantidad,
      0
    );
  }, [productosVenta]);

  const costoDeliveryNumerico =
    tipoCliente === "delivery" ? Number(costoDelivery) || 0 : 0;
  const total = totalProductos + costoDeliveryNumerico;
  const tipoPagoEfectivo = obtenerTipoPagoPorNombre("efectivo");
  const tipoPagoTransferencia = obtenerTipoPagoPorNombre("transferencia");
  const esPagoMixto = metodoPago === "mixto";
  const esPagoTransferencia =
    metodoPago === String(tipoPagoTransferencia?.Tipo_pago);
  const montoEfectivoNumerico = Number(montoEfectivo) || 0;
  const montoTransferenciaNumerico = Number(montoTransferencia) || 0;

  const construirPagos = () => {
    if (esPagoMixto) {
      const pagos = [];

      if (montoEfectivoNumerico > 0) {
        pagos.push({
          Tipo_pago: tipoPagoEfectivo.Tipo_pago,
          Monto: montoEfectivoNumerico,
          Referencia: null,
        });
      }

      if (montoTransferenciaNumerico > 0) {
        pagos.push({
          Tipo_pago: tipoPagoTransferencia.Tipo_pago,
          Monto: montoTransferenciaNumerico,
          Referencia: referenciaPago.trim() || null,
        });
      }

      return pagos;
    }

    return [
      {
        Tipo_pago: Number(metodoPago),
        Monto: total,
        Referencia: esPagoTransferencia ? referenciaPago.trim() || null : null,
      },
    ];
  };

  const validarVenta = () => {
    if (!fecha) {
      return "Debes seleccionar una fecha.";
    }

    if (fecha < obtenerFechaActual()) {
      return "La fecha no puede ser anterior a la fecha actual.";
    }

    if (productosVenta.length === 0) {
      return "Debes agregar al menos un producto a la venta.";
    }

    const productoSinPrecio = productosVenta.find(
      (producto) => producto.PrecioUnitario <= 0
    );

    if (productoSinPrecio) {
      return `El producto ${productoSinPrecio.Nombre} no tiene precio válido.`;
    }

    const productoSinStock = productosVenta.find(
      (producto) => producto.Cantidad > producto.Stock
    );

    if (productoSinStock) {
      return `La cantidad de ${productoSinStock.Nombre} supera el stock disponible.`;
    }

    if (!metodoPago) {
      return "Debes seleccionar un método de pago.";
    }

    if (total <= 0) {
      return "El total de la venta debe ser mayor que cero.";
    }

    if (esPagoMixto) {
      if (!tipoPagoEfectivo || !tipoPagoTransferencia) {
        return "No se encontraron los tipos de pago Efectivo y Transferencia.";
      }

      if (montoEfectivoNumerico < 0 || montoTransferenciaNumerico < 0) {
        return "Los montos del pago mixto no pueden ser negativos.";
      }

      if (montoEfectivoNumerico <= 0 && montoTransferenciaNumerico <= 0) {
        return "Debes ingresar al menos un monto para el pago mixto.";
      }

      if (
        convertirACentavos(montoEfectivoNumerico + montoTransferenciaNumerico) !==
        convertirACentavos(total)
      ) {
        return "La suma del pago en efectivo y transferencia debe coincidir con el total a pagar.";
      }
    }

    if (tipoCliente !== "generico") {
      if (!nombresCliente.trim() || !apellidosCliente.trim()) {
        return "Debes ingresar nombres y apellidos del cliente.";
      }
    }

    if (tipoCliente === "delivery") {
      if (!telefonoCliente.trim()) {
        return "Debes ingresar el teléfono del cliente para delivery.";
      }

      if (!direccionCliente.trim()) {
        return "Debes ingresar la dirección exacta para delivery.";
      }

      if (!departamentoCliente) {
        return "Debes seleccionar el departamento para delivery.";
      }

      if (!municipioCliente) {
        return "Debes seleccionar el municipio para delivery.";
      }

      if (costoDeliveryNumerico <= 0) {
        return "El costo de delivery debe ser mayor que cero.";
      }
    }

    return "";
  };

  const construirPayload = () => {
    const payload = {
      ID_Empleado: idEmpleado,
      CostoDelivery:
        tipoCliente === "delivery" ? costoDeliveryNumerico : null,
      ObservacionRecibo:
        notas.trim() || "Recibo generado automáticamente desde NuevaVenta.",
      productos: productosVenta.map((producto) => ({
        ID_Producto: producto.ID_Producto,
        Cantidad: producto.Cantidad,
        PrecioUnitario: producto.PrecioUnitario,
      })),
      pagos: construirPagos(),
    };

    if (
      tipoCliente === "delivery" &&
      clienteSeleccionado &&
      clienteTieneDeliveryCompleto(clienteSeleccionado) &&
      String(clienteSeleccionado.Nombres || "") === nombresCliente.trim() &&
      String(clienteSeleccionado.Apellidos || "") === apellidosCliente.trim() &&
      String(clienteSeleccionado.NumeroTelefono || "") === telefonoCliente.trim() &&
      String(clienteSeleccionado.Direccion || "") === direccionCliente.trim() &&
      String(clienteSeleccionado.ID_Departamento || "") ===
        String(departamentoCliente) &&
      String(clienteSeleccionado.ID_Municipio || "") === String(municipioCliente)
    ) {
      payload.ID_Cliente = clienteSeleccionado.ID_Cliente;
      return payload;
    }

    if (tipoCliente !== "generico") {
      payload.cliente = {
        Nombres: nombresCliente.trim(),
        Apellidos: apellidosCliente.trim(),
        NumeroTelefono:
          tipoCliente === "delivery" ? telefonoCliente.trim() : null,
        Direccion:
          tipoCliente === "delivery" ? direccionCliente.trim() : null,
        ID_Departamento:
          tipoCliente === "delivery" ? Number(departamentoCliente) : null,
        ID_Municipio:
          tipoCliente === "delivery" ? Number(municipioCliente) : null,
      };
    }

    return payload;
  };

  const finalizarVenta = async () => {
    setMensaje("");

    const errorValidacion = validarVenta();

    if (errorValidacion) {
      mostrarMensaje(errorValidacion, "error");
      return;
    }

    setRegistrandoVenta(true);

    try {
      const respuesta = await registrarVentaCompleta(construirPayload());

      setProductosVenta([]);
      setBusqueda("");
      setReferenciaPago("");
      setNotas("");
      await cargarDatosIniciales();

      mostrarMensaje(
        `${respuesta.mensaje} Venta #${respuesta.ID_Venta}. Total: ${formatearDinero(
          respuesta.TotalVenta
        )}. Recibo generado: ${respuesta.ReciboGenerado ? "sí" : "no"}.`,
        "success"
      );
    } catch (error) {
      mostrarMensaje(
        error.message ||
          "No se pudo registrar la venta. Revisa los datos e intenta nuevamente.",
        "error"
      );
    } finally {
      setRegistrandoVenta(false);
    }
  };

  return (
    <section className="nueva-venta-page">
      <div className="nueva-venta-header">
        <h1>Nueva venta</h1>
      </div>

      <div className="nueva-venta-datos">
        <div className="campo-grupo">
          <label>Tipo de cliente</label>
          <select value={tipoCliente} onChange={manejarTipoCliente}>
            <option value="generico">Sin datos personales</option>
            <option value="nombre">Nombre en recibo</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        <div className="campo-grupo">
          <label>Fecha</label>
          <input
            type="date"
            value={fecha}
            min={obtenerFechaActual()}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="campo-grupo">
          <label>Método de pago</label>
          <select value={metodoPago} onChange={manejarMetodoPago}>
            <option value="">Seleccionar método</option>
            {tiposPago.map((tipoPago) => (
              <option key={tipoPago.Tipo_pago} value={tipoPago.Tipo_pago}>
                {tipoPago.NombrePago}
              </option>
            ))}
            <option value="mixto">Mixto</option>
          </select>
        </div>
      </div>

      {tipoCliente !== "generico" && (
        <div className="nueva-venta-datos datos-cliente-venta">
          <div className="campo-grupo">
            <label>Nombres</label>
            <input
              type="text"
              placeholder="Nombres del cliente"
              value={nombresCliente}
              onChange={manejarTextoCliente(setNombresCliente)}
              onFocus={() => {
                if (
                  tipoCliente === "delivery" &&
                  sugerenciasClientes.length > 0
                ) {
                  setMostrarSugerenciasClientes(true);
                }
              }}
            />

            {tipoCliente === "delivery" &&
              mostrarSugerenciasClientes &&
              (buscandoClientes || sugerenciasClientes.length > 0) && (
                <div className="sugerencias-clientes">
                  {buscandoClientes && (
                    <div className="sugerencia-cliente estado-sugerencia">
                      Buscando clientes...
                    </div>
                  )}

                  {!buscandoClientes &&
                    sugerenciasClientes.map((cliente) => (
                      <button
                        key={cliente.ID_Cliente}
                        type="button"
                        className="sugerencia-cliente"
                        onClick={() => seleccionarClienteSugerido(cliente)}
                      >
                        <strong>{cliente.NombreCompleto}</strong>
                        <span>
                          {cliente.NumeroTelefono || "Sin teléfono"} —{" "}
                          {describirUbicacionCliente(cliente)}
                        </span>
                      </button>
                    ))}
                </div>
              )}
          </div>

          <div className="campo-grupo">
            <label>Apellidos</label>
            <input
              type="text"
              placeholder="Apellidos del cliente"
              value={apellidosCliente}
              onChange={manejarTextoCliente(setApellidosCliente)}
            />
          </div>

          {tipoCliente === "delivery" && (
            <div className="campo-grupo">
              <label>Teléfono</label>
              <input
                type="tel"
                placeholder="Número de teléfono"
                value={telefonoCliente}
                onChange={(e) => setTelefonoCliente(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {tipoCliente === "delivery" && (
        <div className="nueva-venta-datos datos-cliente-venta">
          <div className="campo-grupo">
            <label>Dirección</label>
            <input
              type="text"
              placeholder="Dirección exacta"
              value={direccionCliente}
              onChange={(e) => setDireccionCliente(e.target.value)}
            />
          </div>

          <div className="campo-grupo">
            <label>Departamento</label>
            <select
              value={departamentoCliente}
              onChange={manejarDepartamentoCliente}
            >
              <option value="">Seleccionar departamento</option>
              {departamentos.map((departamento) => (
                <option
                  key={departamento.ID_Departamento}
                  value={departamento.ID_Departamento}
                >
                  {departamento.Departamento}
                </option>
              ))}
            </select>
          </div>

          <div className="campo-grupo">
            <label>Municipio</label>
            <select
              value={municipioCliente}
              onChange={(e) => setMunicipioCliente(e.target.value)}
              disabled={!departamentoCliente || cargandoMunicipios}
            >
              <option value="">
                {cargandoMunicipios
                  ? "Cargando municipios..."
                  : "Seleccionar municipio"}
              </option>
              {municipios.map((municipio) => (
                <option
                  key={municipio.ID_Municipio}
                  value={municipio.ID_Municipio}
                >
                  {municipio.Municipio}
                </option>
              ))}
            </select>

            {departamentoCliente && !cargandoMunicipios && municipios.length === 0 && (
              <p className="ayuda-campo">
                No hay municipios disponibles para este departamento.
              </p>
            )}
          </div>

          <div className="campo-grupo">
            <label>Costo delivery</label>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={costoDelivery}
              onChange={(e) => setCostoDelivery(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="nueva-venta-contenido">
        <article className="panel-venta panel-productos">
          <div className="panel-titulo">
            <h2>Agregar productos</h2>
          </div>

          <div className="busqueda-productos">
            <input
              type="text"
              placeholder="Buscar producto por nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button type="button" onClick={cargarDatosIniciales}>
              Actualizar
            </button>
          </div>

          <div className="tabla-contenedor tabla-productos-disponibles">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Talla</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {cargandoDatos ? (
                  <tr>
                    <td colSpan="5" className="sin-datos">
                      Cargando productos...
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((producto) => (
                    <tr key={producto.ID_Producto}>
                      <td>
                        <strong>{producto.Nombre}</strong>
                      </td>
                      <td>{obtenerTallaProducto(producto)}</td>
                      <td>{formatearDinero(producto.PrecioUnitario || 0)}</td>
                      <td>{producto.Stock}</td>
                      <td>
                        <button
                          className="btn-agregar"
                          type="button"
                          onClick={() => agregarProducto(producto)}
                        >
                          + Agregar
                        </button>
                      </td>
                    </tr>
                  ))
                )}

                {!cargandoDatos && productosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="sin-datos">
                      No se encontraron productos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <div className="panel-derecho">
          <article className="panel-venta panel-productos-venta">
            <div className="panel-titulo fila-titulo">
              <h2>Productos en venta ({productosVenta.length})</h2>

              {productosVenta.length > 0 && (
                <button
                  type="button"
                  className="btn-vaciar"
                  onClick={vaciarProductosVenta}
                >
                  Vaciar todo
                </button>
              )}
            </div>

            <div className="tabla-contenedor tabla-venta">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Talla</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {productosVenta.map((producto) => (
                    <tr key={producto.ID_Producto}>
                      <td>
                        <strong>{producto.Nombre}</strong>
                      </td>
                      <td>{producto.Talla || "Sin talla"}</td>
                      <td>{formatearDinero(producto.PrecioUnitario)}</td>
                      <td>
                        <div className="control-cantidad">
                          <button
                            type="button"
                            onClick={() =>
                              disminuirCantidad(producto.ID_Producto)
                            }
                          >
                            -
                          </button>
                          <span>{producto.Cantidad}</span>
                          <button
                            type="button"
                            onClick={() =>
                              aumentarCantidad(producto.ID_Producto)
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        {formatearDinero(
                          producto.PrecioUnitario * producto.Cantidad
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-eliminar"
                          type="button"
                          onClick={() => eliminarProducto(producto.ID_Producto)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}

                  {productosVenta.length === 0 && (
                    <tr>
                      <td colSpan="6" className="sin-datos">
                        Aún no has agregado productos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel-venta resumen-venta">
            <h2>Resumen de venta</h2>

            <div className="resumen-cuerpo">
              <div className="resumen-linea">
                <span>Total productos</span>
                <strong>{formatearDinero(totalProductos)}</strong>
              </div>

              <div className="resumen-linea">
                <span>Delivery</span>
                <strong>{formatearDinero(costoDeliveryNumerico)}</strong>
              </div>

              <div className="resumen-total">
                <span>Total a pagar</span>
                <strong>{formatearDinero(total)}</strong>
              </div>

              {metodoPago && (
                <div className="bloque-pago">
                  <h3>Detalle del pago</h3>

                  {esPagoMixto ? (
                    <>
                      <div className="campo-pago">
                        <label>Monto en efectivo</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={montoEfectivo}
                          onChange={(e) => setMontoEfectivo(e.target.value)}
                        />
                      </div>

                      <div className="campo-pago">
                        <label>Monto en transferencia</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={montoTransferencia}
                          onChange={(e) =>
                            setMontoTransferencia(e.target.value)
                          }
                        />
                      </div>

                      <div className="campo-pago total-pagado">
                        <label>Total pagado</label>
                        <input
                          type="text"
                          value={formatearDinero(
                            montoEfectivoNumerico + montoTransferenciaNumerico
                          )}
                          readOnly
                        />
                      </div>
                    </>
                  ) : (
                    <div className="campo-pago">
                      <label>Monto a cobrar</label>
                      <input
                        type="number"
                        min="0"
                        value={total}
                        readOnly
                      />
                    </div>
                  )}

                  {(esPagoTransferencia || esPagoMixto) && (
                    <div className="campo-pago">
                      <label>Referencia de transferencia</label>
                      <input
                        type="text"
                        placeholder="Referencia opcional"
                        value={referenciaPago}
                        onChange={(e) => setReferenciaPago(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="notas">
                <label>Notas</label>
                <textarea
                  placeholder="Agrega una nota a la venta..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                ></textarea>
              </div>

              {mensaje && (
                <p className={`mensaje-venta mensaje-${tipoMensaje}`}>
                  {mensaje}
                </p>
              )}
            </div>

            <div className="acciones-venta">
              <button
                type="button"
                className="btn-cancelar"
                onClick={vaciarVenta}
                disabled={registrandoVenta}
              >
                Cancelar venta
              </button>

              <button
                type="button"
                className="btn-finalizar"
                onClick={finalizarVenta}
                disabled={registrandoVenta}
              >
                {registrandoVenta ? "Registrando..." : "Finalizar venta"}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default NuevaVenta;

import { useEffect, useMemo, useState } from "react";
import {
  buscarClientes,
  obtenerDepartamentos,
  obtenerMunicipiosPorDepartamento,
  obtenerProductos,
  obtenerTiposPago,
  descargarPdfRecibo,
  obtenerDetalleRecibo,
  registrarVentaCompleta,
} from "../../../api/api";
import "../Recibos/Recibos.css";
import "./NuevaVenta.css";

const ID_EMPLEADO_TEMPORAL = 1;
const MENSAJE_VENTA_REALIZADA = "Venta realizada";

function NuevaVenta({
  idEmpleado = ID_EMPLEADO_TEMPORAL,
  registrarVenta = registrarVentaCompleta,
  obtenerDetalleReciboVenta = obtenerDetalleRecibo,
  descargarPdfReciboVenta = descargarPdfRecibo,
  obtenerProductosVenta = obtenerProductos,
}) {
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
  const [ultimoCampoMixtoEditado, setUltimoCampoMixtoEditado] = useState(null);
  const [costoDelivery, setCostoDelivery] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [productosVenta, setProductosVenta] = useState([]);
  const [notas, setNotas] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [erroresValidacion, setErroresValidacion] = useState([]);
  const [ventaIntentada, setVentaIntentada] = useState(false);
  const [ultimaVentaExitosa, setUltimaVentaExitosa] = useState(null);
  const [reciboVenta, setReciboVenta] = useState(null);
  const [mostrarModalRecibo, setMostrarModalRecibo] = useState(false);

  const mostrarMensaje = (texto, tipo = "info") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  const limpiarMensajeVentaRealizada = () => {
    if (tipoMensaje === "success" && mensaje === MENSAJE_VENTA_REALIZADA) {
      setMensaje("");
    }
  };

  const mensajeTelefonoDelivery = "Ingrese un número válido";

  const formatearDinero = (valor) => {
    return `C$ ${Number(valor).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const convertirACentavos = (valor) => Math.round((Number(valor) || 0) * 100);
  const formatearMontoPago = (centavos) => (centavos / 100).toFixed(2);

  const limpiarTelefono = (valor) => valor.replace(/\D/g, "").slice(0, 8);

  const telefonoDeliveryEsValido = (telefono) => {
    const telefonoLimpio = String(telefono || "").trim();

    return (
      /^\d{8}$/.test(telefonoLimpio) &&
      Number(telefonoLimpio) > 70000000 &&
      Number(telefonoLimpio) < 90000000
    );
  };

  const normalizarMontoEntrada = (valor) => {
    const valorNormalizado = valor.replace(",", ".").replace(/[^\d.]/g, "");
    const [entero = "", ...decimales] = valorNormalizado.split(".");
    const decimal = decimales.join("").slice(0, 2);

    if (valorNormalizado.includes(".")) {
      return `${entero}.${decimal}`;
    }

    return entero;
  };

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
          obtenerProductosVenta(),
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
    if (tipoMensaje !== "success" || mensaje !== MENSAJE_VENTA_REALIZADA) {
      return undefined;
    }

    const temporizador = setTimeout(() => {
      setMensaje("");
    }, 5000);

    return () => clearTimeout(temporizador);
  }, [mensaje, tipoMensaje]);

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
    if (tipoCliente === "generico") {
      setSugerenciasClientes([]);
      setMostrarSugerenciasClientes(false);
      setBuscandoClientes(false);
      return;
    }

    const termino = `${nombresCliente} ${apellidosCliente}`.trim();

    if (
      clienteSeleccionado &&
      String(clienteSeleccionado.Nombres || "") === nombresCliente.trim() &&
      String(clienteSeleccionado.Apellidos || "") === apellidosCliente.trim()
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
  }, [apellidosCliente, clienteSeleccionado, nombresCliente, tipoCliente]);

  const manejarTextoCliente = (setter) => (e) => {
    const valor = e.target.value;

    if (/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/.test(valor)) {
      limpiarMensajeVentaRealizada();
      setClienteSeleccionado(null);
      setter(valor);
    }
  };

  const manejarMetodoPago = (e) => {
    setMetodoPago(e.target.value);
    setReferenciaPago("");
    setMontoEfectivo("");
    setMontoTransferencia("");
    setUltimoCampoMixtoEditado(null);
    setMensaje("");
    setErroresValidacion([]);
  };

  const manejarTelefonoCliente = (e) => {
    limpiarMensajeVentaRealizada();
    setTelefonoCliente(limpiarTelefono(e.target.value));
    setClienteSeleccionado(null);
    setErroresValidacion([]);
  };

  const actualizarPagoMixto = (campoEditado, valor) => {
    const valorLimpio = normalizarMontoEntrada(valor);
    const centavosTotal = convertirACentavos(total);
    const centavosIngresados = convertirACentavos(valorLimpio);
    const centavosRestantes = Math.max(centavosTotal - centavosIngresados, 0);

    setUltimoCampoMixtoEditado(campoEditado);
    setMensaje("");
    setErroresValidacion([]);

    if (campoEditado === "efectivo") {
      setMontoEfectivo(valorLimpio);
      setMontoTransferencia(formatearMontoPago(centavosRestantes));
      return;
    }

    setMontoTransferencia(valorLimpio);
    setMontoEfectivo(formatearMontoPago(centavosRestantes));
  };

  const manejarDepartamentoCliente = (e) => {
    setDepartamentoCliente(e.target.value);
    setMunicipioCliente("");
    setClienteSeleccionado(null);
    setMensaje("");
    setErroresValidacion([]);
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
    setErroresValidacion([]);
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
    setTelefonoCliente(limpiarTelefono(String(cliente.NumeroTelefono || "")));
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

  const cantidadesReservadas = useMemo(() => {
    // El stock visible descuenta lo que ya esta en la venta antes de confirmar en backend.
    return productosVenta.reduce((reservas, producto) => {
      reservas[producto.ID_Producto] =
        (reservas[producto.ID_Producto] || 0) + producto.Cantidad;
      return reservas;
    }, {});
  }, [productosVenta]);

  const obtenerStockDisponible = (producto) => {
    const stockReal = Number(producto.Stock) || 0;
    const reservado = cantidadesReservadas[producto.ID_Producto] || 0;
    return Math.max(stockReal - reservado, 0);
  };

  const productoActivo = (producto) => {
    return String(producto.Estado || "").trim().toUpperCase() === "ACTIVO";
  };

  const productosCoincidentesBusqueda = productos.filter((producto) => {
    const coincideNombre = producto.Nombre.toLowerCase().includes(
      busqueda.toLowerCase()
    );

    return coincideNombre && productoActivo(producto);
  });

  const productosFiltrados = productosCoincidentesBusqueda.filter(
    (producto) => obtenerStockDisponible(producto) > 0
  );

  const hayProductosSinStockDisponible =
    productosCoincidentesBusqueda.length > 0 && productosFiltrados.length === 0;

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

    const stockDisponible = obtenerStockDisponible(producto);

    if (stockDisponible <= 0) {
      mostrarMensaje("Stock ya agregado completo.", "error");
      return;
    }

    const productoExistente = productosVenta.find(
      (item) => item.ID_Producto === producto.ID_Producto
    );

    if (productoExistente) {
      if (stockDisponible <= 0) {
        mostrarMensaje("Stock ya agregado completo.", "error");
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
            mostrarMensaje("Stock ya agregado completo.", "error");
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

  const limpiarCamposNuevaVenta = () => {
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
    setUltimoCampoMixtoEditado(null);
    setCostoDelivery("");
    setBusqueda("");
    setProductosVenta([]);
    setNotas("");
    setErroresValidacion([]);
    setVentaIntentada(false);
    setReciboVenta(null);
    setMostrarModalRecibo(false);
  };

  const vaciarVenta = () => {
    limpiarCamposNuevaVenta();
    setMensaje("");
    setUltimaVentaExitosa(null);
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
  const errorTelefonoDelivery =
    tipoCliente === "delivery" &&
    telefonoCliente &&
    !telefonoDeliveryEsValido(telefonoCliente)
      ? mensajeTelefonoDelivery
      : "";
  const errorPagoMixto = (() => {
    if (!esPagoMixto) return "";

    if (montoEfectivoNumerico < 0 || montoTransferenciaNumerico < 0) {
      return "Los montos del pago mixto no pueden ser negativos.";
    }

    if (montoEfectivoNumerico > total || montoTransferenciaNumerico > total) {
      return "El monto ingresado no puede ser mayor que el total de la venta.";
    }

    if (
      total > 0 &&
      montoEfectivo !== "" &&
      montoTransferencia !== "" &&
      montoEfectivoNumerico <= 0 &&
      montoTransferenciaNumerico <= 0
    ) {
      return "Debes ingresar al menos un monto para el pago mixto.";
    }

    if (
      montoEfectivo !== "" &&
      montoTransferencia !== "" &&
      convertirACentavos(montoEfectivoNumerico + montoTransferenciaNumerico) !==
        convertirACentavos(total)
    ) {
      return "La suma de efectivo y transferencia debe ser igual al total de la venta.";
    }

    return "";
  })();

  useEffect(() => {
    if (!esPagoMixto || !ultimoCampoMixtoEditado) return;

    const centavosTotal = convertirACentavos(total);

    if (ultimoCampoMixtoEditado === "efectivo" && montoEfectivo !== "") {
      const centavosEfectivo = convertirACentavos(montoEfectivo);
      setMontoTransferencia(
        formatearMontoPago(Math.max(centavosTotal - centavosEfectivo, 0))
      );
    }

    if (
      ultimoCampoMixtoEditado === "transferencia" &&
      montoTransferencia !== ""
    ) {
      const centavosTransferencia = convertirACentavos(montoTransferencia);
      setMontoEfectivo(
        formatearMontoPago(Math.max(centavosTotal - centavosTransferencia, 0))
      );
    }
  }, [
    esPagoMixto,
    montoEfectivo,
    montoTransferencia,
    total,
    ultimoCampoMixtoEditado,
  ]);

  const construirPagos = () => {
    // El backend espera una lista de pagos, incluso cuando solo hay un metodo.
    if (esPagoMixto) {
      return [
        {
          Tipo_pago: tipoPagoEfectivo.Tipo_pago,
          Monto: montoEfectivoNumerico,
          Referencia: null,
        },
        {
          Tipo_pago: tipoPagoTransferencia.Tipo_pago,
          Monto: montoTransferenciaNumerico,
          Referencia: referenciaPago.trim() || null,
        },
      ];
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
    const errores = [];

    if (!fecha) {
      errores.push("Debes seleccionar una fecha.");
    }

    if (fecha && fecha < obtenerFechaActual()) {
      errores.push("La fecha no puede ser anterior a la fecha actual.");
    }

    if (productosVenta.length === 0) {
      errores.push("Debes agregar al menos un producto a la venta.");
    }

    const productoSinPrecio = productosVenta.find(
      (producto) => producto.PrecioUnitario <= 0
    );

    if (productoSinPrecio) {
      errores.push(`El producto ${productoSinPrecio.Nombre} no tiene precio válido.`);
    }

    const productoSinStock = productosVenta.find(
      (producto) => producto.Cantidad > producto.Stock
    );

    if (productoSinStock) {
      errores.push(
        `La cantidad de ${productoSinStock.Nombre} supera el stock disponible.`
      );
    }

    const productoCantidadInvalida = productosVenta.find(
      (producto) =>
        producto.Cantidad === "" ||
        Number(producto.Cantidad) <= 0 ||
        !Number.isFinite(Number(producto.Cantidad))
    );

    if (productoCantidadInvalida) {
      errores.push(
        `La cantidad de ${productoCantidadInvalida.Nombre} debe ser mayor que cero.`
      );
    }

    if (!metodoPago) {
      errores.push("Debes seleccionar un método de pago.");
    }

    if (total <= 0) {
      errores.push("El total de la venta debe ser mayor que cero.");
    }

    if (esPagoMixto) {
      if (!tipoPagoEfectivo || !tipoPagoTransferencia) {
        errores.push("No se encontraron los tipos de pago Efectivo y Transferencia.");
      }

      if (montoEfectivoNumerico < 0 || montoTransferenciaNumerico < 0) {
        errores.push("Los montos del pago mixto no pueden ser negativos.");
      }

      if (montoEfectivoNumerico > total || montoTransferenciaNumerico > total) {
        errores.push("El monto ingresado no puede ser mayor que el total de la venta.");
      }

      if (montoEfectivoNumerico <= 0 && montoTransferenciaNumerico <= 0) {
        errores.push("Debes ingresar al menos un monto para el pago mixto.");
      }

      if (errorPagoMixto) {
        errores.push(errorPagoMixto);
      }

      if (
        convertirACentavos(montoEfectivoNumerico + montoTransferenciaNumerico) !==
        convertirACentavos(total)
      ) {
        errores.push(
          "La suma de efectivo y transferencia debe ser igual al total de la venta."
        );
      }
    }

    if (tipoCliente !== "generico") {
      if (!nombresCliente.trim() || !apellidosCliente.trim()) {
        errores.push("Debes ingresar nombres y apellidos del cliente.");
      }
    }

    if (tipoCliente === "delivery") {
      if (!telefonoCliente.trim()) {
        errores.push("Debes ingresar el teléfono del cliente para delivery.");
      }

      if (!telefonoDeliveryEsValido(telefonoCliente)) {
        errores.push(mensajeTelefonoDelivery);
      }

      if (!direccionCliente.trim()) {
        errores.push("Debes ingresar la dirección exacta para delivery.");
      }

      if (!departamentoCliente) {
        errores.push("Debes seleccionar el departamento para delivery.");
      }

      if (!municipioCliente) {
        errores.push("Debes seleccionar el municipio para delivery.");
      }

      if (costoDeliveryNumerico <= 0) {
        errores.push("El costo de delivery debe ser mayor que cero.");
      }
    }

    return [...new Set(errores)];
  };

  useEffect(() => {
    if (!ventaIntentada) return;

    setErroresValidacion(validarVenta());
  }, [
    ventaIntentada,
    fecha,
    productosVenta,
    metodoPago,
    montoEfectivo,
    montoTransferencia,
    referenciaPago,
    tipoCliente,
    nombresCliente,
    apellidosCliente,
    telefonoCliente,
    direccionCliente,
    departamentoCliente,
    municipioCliente,
    costoDelivery,
    total,
  ]);

  const construirPayload = () => {
    // Si el cliente sugerido ya sirve para la venta, se envia su ID para evitar duplicados.
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
      clienteSeleccionado &&
      String(clienteSeleccionado.Nombres || "") === nombresCliente.trim() &&
      String(clienteSeleccionado.Apellidos || "") === apellidosCliente.trim()
    ) {
      if (
        tipoCliente !== "delivery" ||
        clienteTieneDeliveryCompleto(clienteSeleccionado)
      ) {
        payload.ID_Cliente = clienteSeleccionado.ID_Cliente;
        return payload;
      }
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
    setErroresValidacion([]);
    setVentaIntentada(true);

    const errores = validarVenta();

    if (errores.length > 0) {
      setErroresValidacion(errores);
      mostrarMensaje("Revisa los datos marcados antes de finalizar la venta.", "error");
      return;
    }

    setRegistrandoVenta(true);

    try {
      const respuesta = await registrarVenta(construirPayload());
      const ventaExitosa = {
        idVenta: respuesta.ID_Venta,
        idRecibo: respuesta.ID_Recibo,
        reciboGenerado: Boolean(respuesta.ReciboGenerado),
        total: respuesta.TotalVenta,
      };

      limpiarCamposNuevaVenta();
      setUltimaVentaExitosa(ventaExitosa);
      await cargarDatosIniciales();

      mostrarMensaje(MENSAJE_VENTA_REALIZADA, "success");
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

  const abrirReciboVenta = async ({ imprimir = false } = {}) => {
    if (!ultimaVentaExitosa?.idRecibo) {
      mostrarMensaje("No se encontró el recibo de esta venta.", "error");
      return;
    }

    try {
      const detalle = await obtenerDetalleReciboVenta(ultimaVentaExitosa.idRecibo);
      setReciboVenta(detalle);
      setMostrarModalRecibo(true);

      if (imprimir) {
        setTimeout(() => window.print(), 150);
      }
    } catch (error) {
      mostrarMensaje(error.message || "No se pudo cargar el recibo.", "error");
    }
  };

  const exportarReciboVenta = async () => {
    if (!ultimaVentaExitosa?.idRecibo) return;

    try {
      await descargarPdfReciboVenta(ultimaVentaExitosa.idRecibo);
    } catch (error) {
      mostrarMensaje(error.message || "No se pudo descargar el recibo.", "error");
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
            onChange={(e) => {
              limpiarMensajeVentaRealizada();
              setFecha(e.target.value);
            }}
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
                  tipoCliente !== "generico" &&
                  sugerenciasClientes.length > 0
                ) {
                  setMostrarSugerenciasClientes(true);
                }
              }}
            />

            {tipoCliente !== "generico" &&
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
                inputMode="numeric"
                maxLength="8"
                placeholder="Número de teléfono"
                value={telefonoCliente}
                onChange={manejarTelefonoCliente}
              />
              {errorTelefonoDelivery && (
                <p className="ayuda-campo error-campo">
                  {errorTelefonoDelivery}
                </p>
              )}
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
              onChange={(e) => {
                limpiarMensajeVentaRealizada();
                setDireccionCliente(e.target.value);
              }}
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
              onChange={(e) => {
                limpiarMensajeVentaRealizada();
                setMunicipioCliente(e.target.value);
              }}
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
              onChange={(e) => {
                limpiarMensajeVentaRealizada();
                setCostoDelivery(e.target.value);
              }}
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
              onChange={(e) => {
                limpiarMensajeVentaRealizada();
                setBusqueda(e.target.value);
              }}
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
                      <td>{obtenerStockDisponible(producto)}</td>
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
                      {hayProductosSinStockDisponible
                        ? "Stock ya agregado completo o sin stock disponible."
                        : "No se encontraron productos."}
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

              {tipoCliente === "delivery" && (
                <div className="resumen-delivery">
                  <span>Teléfono delivery</span>
                  <strong>
                    {telefonoCliente || "Pendiente"}
                  </strong>
                </div>
              )}

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
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={montoEfectivo}
                          onChange={(e) =>
                            actualizarPagoMixto("efectivo", e.target.value)
                          }
                        />
                      </div>

                      <div className="campo-pago">
                        <label>Monto en transferencia</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={montoTransferencia}
                          onChange={(e) =>
                            actualizarPagoMixto(
                              "transferencia",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <p
                        className={`ayuda-campo ${
                          errorPagoMixto ? "error-campo" : ""
                        }`}
                      >
                        {errorPagoMixto || "Restante calculado automaticamente."}
                      </p>

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
                        onChange={(e) => {
                          limpiarMensajeVentaRealizada();
                          setReferenciaPago(e.target.value);
                        }}
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
                  onChange={(e) => {
                    limpiarMensajeVentaRealizada();
                    setNotas(e.target.value);
                  }}
                ></textarea>
              </div>

              {mensaje && (
                <p className={`mensaje-venta mensaje-${tipoMensaje}`}>
                  {mensaje}
                </p>
              )}

              {ultimaVentaExitosa && (
                <div className="venta-exitosa-acciones">
                  <div>
                    <span>No. venta</span>
                    <strong>{ultimaVentaExitosa.idVenta}</strong>
                  </div>

                  <div>
                    <span>Recibo generado</span>
                    <strong>{ultimaVentaExitosa.reciboGenerado ? "Sí" : "No"}</strong>
                  </div>

                  {ultimaVentaExitosa.reciboGenerado && (
                    <div className="venta-exitosa-botones">
                      <button
                        type="button"
                        onClick={() => abrirReciboVenta()}
                      >
                        Ver recibo
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirReciboVenta({ imprimir: true })}
                      >
                        Imprimir recibo
                      </button>

                      <button
                        type="button"
                        onClick={exportarReciboVenta}
                      >
                        Exportar PDF
                      </button>
                    </div>
                  )}
                </div>
              )}

              {erroresValidacion.length > 0 && (
                <div className="lista-errores-venta" role="alert">
                  <strong>Para finalizar la venta:</strong>
                  <ul>
                    {erroresValidacion.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
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
                disabled={
                  registrandoVenta ||
                  Boolean(errorTelefonoDelivery) ||
                  Boolean(errorPagoMixto)
                }
              >
                {registrandoVenta ? "Registrando..." : "Finalizar venta"}
              </button>
            </div>
          </article>
        </div>
      </div>

      {mostrarModalRecibo && reciboVenta && (
        <div className="modal-recibo-fondo">
          <div className="modal-recibo">
            <div className="modal-recibo-header">
              <h2>Recibo generado</h2>
              <button type="button" onClick={() => setMostrarModalRecibo(false)}>
                ×
              </button>
            </div>

            <div className="recibo-completo">
              <div className="recibo-completo-encabezado">
                <div>
                  <h2>H&D Boutique</h2>
                  <p>Recibo de venta</p>
                </div>

                <div className="recibo-numero">
                  <span>No. recibo</span>
                  <strong>{reciboVenta.numero_recibo}</strong>
                </div>
              </div>

              <div className="recibo-completo-info">
                <div>
                  <span>No. venta</span>
                  <strong>{reciboVenta.numero_venta}</strong>
                </div>

                <div>
                  <span>Cliente</span>
                  <strong>{reciboVenta.cliente}</strong>
                </div>

                <div>
                  <span>Fecha</span>
                  <strong>{reciboVenta.fecha}</strong>
                </div>

                <div>
                  <span>Método de pago</span>
                  <strong>{reciboVenta.medio_pago}</strong>
                </div>
              </div>

              <div className="recibo-productos">
                <h3>Productos comprados</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Talla</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reciboVenta.productos.map((producto) => (
                      <tr key={`${producto.producto}-${producto.subtotal}`}>
                        <td>{producto.producto}</td>
                        <td>{producto.talla || "Sin talla"}</td>
                        <td>{producto.cantidad}</td>
                        <td>{formatearDinero(producto.precio)}</td>
                        <td>{formatearDinero(producto.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="recibo-completo-totales">
                <div>
                  <span>Total productos</span>
                  <strong>{formatearDinero(reciboVenta.total_productos)}</strong>
                </div>

                <div>
                  <span>Delivery</span>
                  <strong>{formatearDinero(reciboVenta.delivery || 0)}</strong>
                </div>

                <div className="recibo-total-final">
                  <span>Total</span>
                  <strong>{formatearDinero(reciboVenta.total)}</strong>
                </div>
              </div>
            </div>

            <div className="modal-recibo-acciones">
              <button
                type="button"
                className="btn-modal-secundario"
                onClick={() => setMostrarModalRecibo(false)}
              >
                Cerrar
              </button>

              <button
                type="button"
                className="btn-modal-principal"
                onClick={() => window.print()}
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default NuevaVenta;

import { useMemo, useState } from "react";
import "./NuevaVenta.css";

function NuevaVenta() {
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const diferenciaZona = hoy.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(hoy.getTime() - diferenciaZona);
    return fechaLocal.toISOString().split("T")[0];
  };

  const productosIniciales = [
    {
      id: 1,
      nombre: "Blusa Manga Larga",
      precio: 950,
      stock: 8,
    },
    {
      id: 2,
      nombre: "Vestido Floral",
      precio: 1250,
      stock: 12,
    },
    {
      id: 3,
      nombre: "Pantalón Palazzo",
      precio: 1100,
      stock: 5,
    },
    {
      id: 4,
      nombre: "Camisa Oversize",
      precio: 850,
      stock: 3,
    },
    {
      id: 5,
      nombre: "Falda Plisada",
      precio: 780,
      stock: 3,
    },
    {
      id: 6,
      nombre: "Short Denim",
      precio: 650,
      stock: 15,
    },
    {
      id: 7,
      nombre: "Top Básico",
      precio: 450,
      stock: 20,
    },
    {
      id: 8,
      nombre: "Jeans Mom Fit",
      precio: 1350,
      stock: 6,
    },
    {
      id: 9,
      nombre: "Bolso Beige",
      precio: 980,
      stock: 4,
    },
    {
      id: 10,
      nombre: "Sandalias Rosadas",
      precio: 1150,
      stock: 7,
    },
  ];

  const [cliente, setCliente] = useState("");
  const [fecha, setFecha] = useState(obtenerFechaActual());
  const [metodoPago, setMetodoPago] = useState("");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [productosVenta, setProductosVenta] = useState([]);
  const [descuento, setDescuento] = useState("");
  const [notas, setNotas] = useState("");
  const [mensaje, setMensaje] = useState("");

  const formatearDinero = (valor) => {
    return `C$ ${Number(valor).toLocaleString("es-NI", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const manejarCliente = (e) => {
    const valor = e.target.value;

    if (/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/.test(valor)) {
      setCliente(valor);
    }
  };

  const manejarMetodoPago = (e) => {
    const valor = e.target.value;
    setMetodoPago(valor);
    setMontoEfectivo("");
    setMontoTransferencia("");
    setMensaje("");
  };

  const productosFiltrados = productosIniciales.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregarProducto = (producto) => {
    setMensaje("");

    const productoExistente = productosVenta.find(
      (item) => item.id === producto.id
    );

    if (productoExistente) {
      if (productoExistente.cantidad >= producto.stock) {
        setMensaje("No puedes agregar más unidades que el stock disponible.");
        return;
      }

      setProductosVenta(
        productosVenta.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
      return;
    }

    setProductosVenta([...productosVenta, { ...producto, cantidad: 1 }]);
  };

  const aumentarCantidad = (id) => {
    setMensaje("");

    setProductosVenta(
      productosVenta.map((item) => {
        if (item.id === id) {
          if (item.cantidad >= item.stock) {
            setMensaje("No puedes superar el stock disponible.");
            return item;
          }

          return { ...item, cantidad: item.cantidad + 1 };
        }

        return item;
      })
    );
  };

  const disminuirCantidad = (id) => {
    setMensaje("");

    setProductosVenta(
      productosVenta.map((item) =>
        item.id === id && item.cantidad > 1
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
    );
  };

  const eliminarProducto = (id) => {
    setProductosVenta(productosVenta.filter((item) => item.id !== id));
  };

  const vaciarProductosVenta = () => {
    setProductosVenta([]);
    setMensaje("");
  };

  const vaciarVenta = () => {
    setCliente("");
    setFecha(obtenerFechaActual());
    setMetodoPago("");
    setMontoEfectivo("");
    setMontoTransferencia("");
    setBusqueda("");
    setProductosVenta([]);
    setDescuento("");
    setNotas("");
    setMensaje("");
  };

  const subtotal = useMemo(() => {
    return productosVenta.reduce(
      (total, item) => total + item.precio * item.cantidad,
      0
    );
  }, [productosVenta]);

  const descuentoNumerico = Number(descuento) || 0;
  const baseImponible = Math.max(subtotal - descuentoNumerico, 0);
  const impuesto = baseImponible * 0.15;
  const total = baseImponible + impuesto;

  const montoEfectivoNumerico = Number(montoEfectivo) || 0;
  const montoTransferenciaNumerico = Number(montoTransferencia) || 0;
  const totalPagado = montoEfectivoNumerico + montoTransferenciaNumerico;
  const diferenciaPago = total - totalPagado;

  const finalizarVenta = () => {
    if (!cliente.trim()) {
      setMensaje("Debes ingresar el nombre del cliente.");
      return;
    }

    if (!fecha) {
      setMensaje("Debes seleccionar una fecha.");
      return;
    }

    if (fecha < obtenerFechaActual()) {
      setMensaje("La fecha no puede ser anterior a la fecha actual.");
      return;
    }

    if (!metodoPago) {
      setMensaje("Debes seleccionar un método de pago.");
      return;
    }

    if (productosVenta.length === 0) {
      setMensaje("Debes agregar al menos un producto a la venta.");
      return;
    }

    if (descuentoNumerico < 0) {
      setMensaje("El descuento no puede ser negativo.");
      return;
    }

    if (descuentoNumerico > subtotal) {
      setMensaje("El descuento no puede ser mayor que el subtotal.");
      return;
    }

    if (metodoPago === "Efectivo" && montoEfectivoNumerico <= 0) {
      setMensaje("Debes ingresar el monto pagado en efectivo.");
      return;
    }

    if (metodoPago === "Transferencia" && montoTransferenciaNumerico <= 0) {
      setMensaje("Debes ingresar el monto pagado por transferencia.");
      return;
    }

    if (metodoPago === "Mixto") {
      if (montoEfectivoNumerico <= 0 || montoTransferenciaNumerico <= 0) {
        setMensaje(
          "Para pago mixto debes ingresar monto en efectivo y monto por transferencia."
        );
        return;
      }
    }

    if (totalPagado < total) {
      setMensaje("El monto pagado no cubre el total de la venta.");
      return;
    }

    setMensaje("Venta finalizada correctamente. Datos guardados localmente.");
  };

  return (
    <section className="nueva-venta-page">
      <div className="nueva-venta-header">
        <h1>Nueva venta</h1>
      </div>

      <div className="nueva-venta-datos">
        <div className="campo-grupo">
          <label>Cliente</label>
          <input
            type="text"
            placeholder="Buscar por nombre"
            value={cliente}
            onChange={manejarCliente}
          />
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
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Mixto">Efectivo + Transferencia</option>
          </select>
        </div>
      </div>

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
            <button type="button">Filtrar</button>
          </div>

          <div className="tabla-contenedor tabla-productos-disponibles">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {productosFiltrados.map((producto) => (
                  <tr key={producto.id}>
                    <td>
                      <strong>{producto.nombre}</strong>
                    </td>
                    <td>{formatearDinero(producto.precio)}</td>
                    <td>{producto.stock}</td>
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
                ))}

                {productosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="4" className="sin-datos">
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
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {productosVenta.map((producto) => (
                    <tr key={producto.id}>
                      <td>
                        <strong>{producto.nombre}</strong>
                      </td>
                      <td>{formatearDinero(producto.precio)}</td>
                      <td>
                        <div className="control-cantidad">
                          <button
                            type="button"
                            onClick={() => disminuirCantidad(producto.id)}
                          >
                            -
                          </button>
                          <span>{producto.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => aumentarCantidad(producto.id)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        {formatearDinero(producto.precio * producto.cantidad)}
                      </td>
                      <td>
                        <button
                          className="btn-eliminar"
                          type="button"
                          onClick={() => eliminarProducto(producto.id)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}

                  {productosVenta.length === 0 && (
                    <tr>
                      <td colSpan="5" className="sin-datos">
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
                <span>Subtotal</span>
                <strong>{formatearDinero(subtotal)}</strong>
              </div>

              <div className="resumen-linea">
                <span>Descuento</span>
                <div className="descuento-control">
                  <input
                    type="number"
                    min="0"
                    value={descuento}
                    placeholder="0.00"
                    onChange={(e) => setDescuento(e.target.value)}
                  />
                  <span>C$</span>
                </div>
              </div>

              <div className="resumen-linea">
                <span>Impuestos (15%)</span>
                <strong>{formatearDinero(impuesto)}</strong>
              </div>

              <div className="resumen-total">
                <span>Total a pagar</span>
                <strong>{formatearDinero(total)}</strong>
              </div>

              {metodoPago && (
                <div className="bloque-pago">
                  <h3>Detalle del pago</h3>

                  {(metodoPago === "Efectivo" || metodoPago === "Mixto") && (
                    <div className="campo-pago">
                      <label>Monto en efectivo</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={montoEfectivo}
                        onChange={(e) => setMontoEfectivo(e.target.value)}
                      />
                    </div>
                  )}

                  {(metodoPago === "Transferencia" ||
                    metodoPago === "Mixto") && (
                    <div className="campo-pago">
                      <label>Monto por transferencia</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={montoTransferencia}
                        onChange={(e) =>
                          setMontoTransferencia(e.target.value)
                        }
                      />
                    </div>
                  )}

                  <div className="resumen-linea total-pagado">
                    <span>Total pagado</span>
                    <strong>{formatearDinero(totalPagado)}</strong>
                  </div>

                  <div className="resumen-linea">
                    <span>
                      {diferenciaPago > 0 ? "Falta por pagar" : "Cambio"}
                    </span>
                    <strong>{formatearDinero(Math.abs(diferenciaPago))}</strong>
                  </div>
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

              {mensaje && <p className="mensaje-venta">{mensaje}</p>}
            </div>

            <div className="acciones-venta">
              <button
                type="button"
                className="btn-cancelar"
                onClick={vaciarVenta}
              >
                Cancelar venta
              </button>

              <button
                type="button"
                className="btn-finalizar"
                onClick={finalizarVenta}
              >
                Finalizar venta
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default NuevaVenta;
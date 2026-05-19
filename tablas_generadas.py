from typing import Optional
import datetime
import decimal

from sqlalchemy import DECIMAL, Date, ForeignKeyConstraint, Identity, Integer, PrimaryKeyConstraint, Unicode
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass


class Categorias(Base):
    __tablename__ = 'Categorias'
    __table_args__ = (
        PrimaryKeyConstraint('ID_Categoria', name='PK__Categori__02AA0785F601FE9C'),
    )

    ID_Categoria: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    Categoria: Mapped[str] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)

    Productos: Mapped[list['Productos']] = relationship('Productos', back_populates='Categorias_')


class Departamentos(Base):
    __tablename__ = 'Departamentos'
    __table_args__ = (
        PrimaryKeyConstraint('ID_Departamento', name='PK__Departam__249DEFBE1A315132'),
    )

    ID_Departamento: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    Departamento: Mapped[str] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)

    Direccion_clientes: Mapped[list['DireccionClientes']] = relationship('DireccionClientes', back_populates='Departamentos_')
    Direccion_empleados: Mapped[list['DireccionEmpleados']] = relationship('DireccionEmpleados', back_populates='Departamentos_')
    Direccion_proveedores: Mapped[list['DireccionProveedores']] = relationship('DireccionProveedores', back_populates='Departamentos_')
    Municipios: Mapped[list['Municipios']] = relationship('Municipios', back_populates='Departamentos_')


class Tallas(Base):
    __tablename__ = 'Tallas'
    __table_args__ = (
        PrimaryKeyConstraint('ID_Talla', name='PK__Tallas__0C1C76F1E7D9BA97'),
    )

    ID_Talla: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    Talla: Mapped[str] = mapped_column(Unicode(50, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)

    Productos: Mapped[list['Productos']] = relationship('Productos', back_populates='Tallas_')


class TipoPago(Base):
    __tablename__ = 'Tipo_pago'
    __table_args__ = (
        PrimaryKeyConstraint('Tipo_pago', name='PK__Tipo_pag__D789A769680DE84F'),
    )

    Tipo_pago: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    NombrePago: Mapped[str] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)

    Ventas: Mapped[list['Ventas']] = relationship('Ventas', back_populates='Tipo_pago_')


class DireccionClientes(Base):
    __tablename__ = 'Direccion_clientes'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Departamento'], ['Departamentos.ID_Departamento'], name='FK_Direccion_clientes_ID_Departamento__Departamentos_ID_Departamento'),
        PrimaryKeyConstraint('ID_Direccion', name='PK__Direccio__F4CC41727CEEA9C2')
    )

    ID_Direccion: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Departamento: Mapped[int] = mapped_column(Integer, nullable=False)
    Direccion: Mapped[Optional[str]] = mapped_column(Unicode(300, 'SQL_Latin1_General_CP1_CI_AS'))

    Departamentos_: Mapped['Departamentos'] = relationship('Departamentos', back_populates='Direccion_clientes')
    Clientes: Mapped[list['Clientes']] = relationship('Clientes', back_populates='Direccion_clientes')


class DireccionEmpleados(Base):
    __tablename__ = 'Direccion_empleados'
    __table_args__ = (
        ForeignKeyConstraint(['Departamento'], ['Departamentos.ID_Departamento'], name='FK_Direccion_empleados_Departamento__Departamentos_ID_Departamento'),
        PrimaryKeyConstraint('ID_Direccion_empleado', name='PK__Direccio__BAC218F9A1CE354B')
    )

    ID_Direccion_empleado: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    Departamento: Mapped[int] = mapped_column(Integer, nullable=False)
    Direccion: Mapped[Optional[str]] = mapped_column(Unicode(300, 'SQL_Latin1_General_CP1_CI_AS'))

    Departamentos_: Mapped['Departamentos'] = relationship('Departamentos', back_populates='Direccion_empleados')
    Empleados: Mapped[list['Empleados']] = relationship('Empleados', back_populates='Direccion_empleados')


class DireccionProveedores(Base):
    __tablename__ = 'Direccion_proveedores'
    __table_args__ = (
        ForeignKeyConstraint(['Departamento'], ['Departamentos.ID_Departamento'], name='FK_Direccion_proveedores_Departamento__Departamentos_ID_Departamento'),
        PrimaryKeyConstraint('ID_Direccion_proveedores', name='PK__Direccio__1DBBA27E540A8479')
    )

    ID_Direccion_proveedores: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    Departamento: Mapped[int] = mapped_column(Integer, nullable=False)
    Direccion: Mapped[Optional[str]] = mapped_column(Unicode(300, 'SQL_Latin1_General_CP1_CI_AS'))

    Departamentos_: Mapped['Departamentos'] = relationship('Departamentos', back_populates='Direccion_proveedores')
    Proveedores: Mapped[list['Proveedores']] = relationship('Proveedores', back_populates='Direccion_proveedores')


class Municipios(Base):
    __tablename__ = 'Municipios'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Departamento'], ['Departamentos.ID_Departamento'], name='FK_Municipios_ID_Departamento__Departamentos_ID_Departamento'),
        PrimaryKeyConstraint('ID_Municipio', name='PK__Municipi__ED00F5B57440B410')
    )

    ID_Municipio: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Departamento: Mapped[int] = mapped_column(Integer, nullable=False)
    Municipio: Mapped[str] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)

    Departamentos_: Mapped['Departamentos'] = relationship('Departamentos', back_populates='Municipios')


class Productos(Base):
    __tablename__ = 'Productos'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Categoria'], ['Categorias.ID_Categoria'], name='FK_Productos_ID_Categoria__Categorias_ID_Categoria'),
        ForeignKeyConstraint(['ID_Talla'], ['Tallas.ID_Talla'], name='FK_Productos_ID_Talla__Tallas_ID_Talla'),
        PrimaryKeyConstraint('ID_Producto', name='PK__Producto__9B4120E214F5557D')
    )

    ID_Producto: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Categoria: Mapped[int] = mapped_column(Integer, nullable=False)
    ID_Talla: Mapped[int] = mapped_column(Integer, nullable=False)
    Nombre: Mapped[str] = mapped_column(Unicode(150, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    Stock: Mapped[int] = mapped_column(Integer, nullable=False)
    Estado: Mapped[str] = mapped_column(Unicode(50, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    Descripcion: Mapped[Optional[str]] = mapped_column(Unicode(300, 'SQL_Latin1_General_CP1_CI_AS'))

    Categorias_: Mapped['Categorias'] = relationship('Categorias', back_populates='Productos')
    Tallas_: Mapped['Tallas'] = relationship('Tallas', back_populates='Productos')
    ProductoProveedor: Mapped[list['ProductoProveedor']] = relationship('ProductoProveedor', back_populates='Productos_')
    DetalleVenta: Mapped[list['DetalleVenta']] = relationship('DetalleVenta', back_populates='Productos_')


class Clientes(Base):
    __tablename__ = 'Clientes'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Direccion'], ['Direccion_clientes.ID_Direccion'], name='FK_Clientes_ID_Direccion__Direccion_clientes_ID_Direccion'),
        PrimaryKeyConstraint('ID_Cliente', name='PK__Clientes__E005FBFFD75DDDDE')
    )

    ID_Cliente: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Direccion: Mapped[int] = mapped_column(Integer, nullable=False)
    Nombres: Mapped[str] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    Apellidos: Mapped[str] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    Estado: Mapped[str] = mapped_column(Unicode(50, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    NumeroTelefono: Mapped[Optional[str]] = mapped_column(Unicode(20, 'SQL_Latin1_General_CP1_CI_AS'))

    Direccion_clientes: Mapped['DireccionClientes'] = relationship('DireccionClientes', back_populates='Clientes')
    Ventas: Mapped[list['Ventas']] = relationship('Ventas', back_populates='Clientes_')


class Empleados(Base):
    __tablename__ = 'Empleados'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Direccion_empleado'], ['Direccion_empleados.ID_Direccion_empleado'], name='FK_Empleados_ID_Direccion_empleado__Direccion_empleados_ID_Direccion_empleado'),
        PrimaryKeyConstraint('ID_Empleado', name='PK__Empleado__B7872C90156FC16F')
    )

    ID_Empleado: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Direccion_empleado: Mapped[int] = mapped_column(Integer, nullable=False)
    Nombres: Mapped[str] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    Apellidos: Mapped[str] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    NumeroTelefono: Mapped[str] = mapped_column(Unicode(20, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    FechaInicio: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    CorreoProfesional: Mapped[Optional[str]] = mapped_column(Unicode(150, 'SQL_Latin1_General_CP1_CI_AS'))
    Cargo: Mapped[Optional[str]] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'))
    FechaFin: Mapped[Optional[datetime.date]] = mapped_column(Date)

    Direccion_empleados: Mapped['DireccionEmpleados'] = relationship('DireccionEmpleados', back_populates='Empleados')
    Compras: Mapped[list['Compras']] = relationship('Compras', back_populates='Empleados_')
    Ventas: Mapped[list['Ventas']] = relationship('Ventas', back_populates='Empleados_')


class Proveedores(Base):
    __tablename__ = 'Proveedores'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Direccion_proveedores'], ['Direccion_proveedores.ID_Direccion_proveedores'], name='FK_Proveedores_ID_Direccion_proveedores__Direccion_proveedores_ID_Direccion_proveedores'),
        PrimaryKeyConstraint('ID_Proveedor', name='PK__Proveedo__7D65272F22CC976D')
    )

    ID_Proveedor: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Direccion_proveedores: Mapped[int] = mapped_column(Integer, nullable=False)
    NombreEmpresa: Mapped[str] = mapped_column(Unicode(150, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    NombreDeContacto: Mapped[str] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    ApellidoDeContacto: Mapped[str] = mapped_column(Unicode(100, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    NumeroTelefono: Mapped[str] = mapped_column(Unicode(20, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    CorreoProfesional: Mapped[str] = mapped_column(Unicode(150, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    Estado: Mapped[str] = mapped_column(Unicode(50, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)

    Direccion_proveedores: Mapped['DireccionProveedores'] = relationship('DireccionProveedores', back_populates='Proveedores')
    Compras: Mapped[list['Compras']] = relationship('Compras', back_populates='Proveedores_')
    ProductoProveedor: Mapped[list['ProductoProveedor']] = relationship('ProductoProveedor', back_populates='Proveedores_')


class Compras(Base):
    __tablename__ = 'Compras'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Empleado'], ['Empleados.ID_Empleado'], name='FK_Compras_ID_Empleado__Empleados_ID_Empleado'),
        ForeignKeyConstraint(['ID_Proveedor'], ['Proveedores.ID_Proveedor'], name='FK_Compras_ID_Proveedor__Proveedores_ID_Proveedor'),
        PrimaryKeyConstraint('ID_Compra', name='PK__Compras__A9D5994E713CCF1C')
    )

    ID_Compra: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Proveedor: Mapped[int] = mapped_column(Integer, nullable=False)
    ID_Empleado: Mapped[int] = mapped_column(Integer, nullable=False)
    FechaCompra: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    total: Mapped[decimal.Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)
    Descripcion: Mapped[str] = mapped_column(Unicode(300, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    FechaRevision: Mapped[Optional[datetime.date]] = mapped_column(Date)
    CostoDeEnvio: Mapped[Optional[decimal.Decimal]] = mapped_column(DECIMAL(10, 2))
    FechaRelleno: Mapped[Optional[datetime.date]] = mapped_column(Date)

    Empleados_: Mapped['Empleados'] = relationship('Empleados', back_populates='Compras')
    Proveedores_: Mapped['Proveedores'] = relationship('Proveedores', back_populates='Compras')
    DetalleCompras: Mapped[list['DetalleCompras']] = relationship('DetalleCompras', back_populates='Compras_')


class ProductoProveedor(Base):
    __tablename__ = 'ProductoProveedor'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Producto'], ['Productos.ID_Producto'], name='FK_ProductoProveedor_ID_Producto__Productos_ID_Producto'),
        ForeignKeyConstraint(['ID_Proveedor'], ['Proveedores.ID_Proveedor'], name='FK_ProductoProveedor_ID_Proveedor__Proveedores_ID_Proveedor'),
        PrimaryKeyConstraint('ID_ProductoProveedor', name='PK__Producto__90135EC1FB755A00')
    )

    ID_ProductoProveedor: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Producto: Mapped[int] = mapped_column(Integer, nullable=False)
    ID_Proveedor: Mapped[int] = mapped_column(Integer, nullable=False)
    PrecioDeCompra: Mapped[decimal.Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)

    Productos_: Mapped['Productos'] = relationship('Productos', back_populates='ProductoProveedor')
    Proveedores_: Mapped['Proveedores'] = relationship('Proveedores', back_populates='ProductoProveedor')
    DetalleCompras: Mapped[list['DetalleCompras']] = relationship('DetalleCompras', back_populates='ProductoProveedor_')


class Ventas(Base):
    __tablename__ = 'Ventas'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Cliente'], ['Clientes.ID_Cliente'], name='FK_Ventas_ID_Cliente__Clientes_ID_Cliente'),
        ForeignKeyConstraint(['ID_Empleado'], ['Empleados.ID_Empleado'], name='FK_Ventas_ID_Empleado__Empleados_ID_Empleado'),
        ForeignKeyConstraint(['Tipo_pago'], ['Tipo_pago.Tipo_pago'], name='FK_Ventas_Tipo_pago__Tipo_pago_Tipo_pago'),
        PrimaryKeyConstraint('ID_Venta', name='PK__Ventas__3CD842E5682B55E7')
    )

    ID_Venta: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    FechaVenta: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    Tipo_pago: Mapped[int] = mapped_column(Integer, nullable=False)
    ID_Cliente: Mapped[int] = mapped_column(Integer, nullable=False)
    ID_Empleado: Mapped[int] = mapped_column(Integer, nullable=False)
    Total: Mapped[decimal.Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)

    Clientes_: Mapped['Clientes'] = relationship('Clientes', back_populates='Ventas')
    Empleados_: Mapped['Empleados'] = relationship('Empleados', back_populates='Ventas')
    Tipo_pago_: Mapped['TipoPago'] = relationship('TipoPago', back_populates='Ventas')
    DetalleVenta: Mapped[list['DetalleVenta']] = relationship('DetalleVenta', back_populates='Ventas_')
    Devolucion: Mapped[list['Devolucion']] = relationship('Devolucion', back_populates='Ventas_')


class DetalleCompras(Base):
    __tablename__ = 'DetalleCompras'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Compra'], ['Compras.ID_Compra'], name='FK_DetalleCompras_ID_Compra__Compras_ID_Compra'),
        ForeignKeyConstraint(['ID_ProductoProveedor'], ['ProductoProveedor.ID_ProductoProveedor'], name='FK_DetalleCompras_ID_ProductoProveedor__ProductoProveedor_ID_ProductoProveedor'),
        PrimaryKeyConstraint('ID_DetalleCompra', name='PK__DetalleC__01B081C13ECEBE2E')
    )

    ID_DetalleCompra: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_ProductoProveedor: Mapped[int] = mapped_column(Integer, nullable=False)
    ID_Compra: Mapped[int] = mapped_column(Integer, nullable=False)
    Cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[decimal.Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)
    subtotal: Mapped[decimal.Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)

    Compras_: Mapped['Compras'] = relationship('Compras', back_populates='DetalleCompras')
    ProductoProveedor_: Mapped['ProductoProveedor'] = relationship('ProductoProveedor', back_populates='DetalleCompras')


class DetalleVenta(Base):
    __tablename__ = 'DetalleVenta'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Producto'], ['Productos.ID_Producto'], name='FK_DetalleVenta_ID_Producto__Productos_ID_Producto'),
        ForeignKeyConstraint(['ID_Venta'], ['Ventas.ID_Venta'], name='FK_DetalleVenta_ID_Venta__Ventas_ID_Venta'),
        PrimaryKeyConstraint('ID_DetalleVenta', name='PK__DetalleV__0157010A85E8E8EE')
    )

    ID_DetalleVenta: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Venta: Mapped[int] = mapped_column(Integer, nullable=False)
    ID_Producto: Mapped[int] = mapped_column(Integer, nullable=False)
    Cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    PrecioUnitario: Mapped[decimal.Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)
    subtotal: Mapped[decimal.Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)

    Productos_: Mapped['Productos'] = relationship('Productos', back_populates='DetalleVenta')
    Ventas_: Mapped['Ventas'] = relationship('Ventas', back_populates='DetalleVenta')
    DetalleDevolucion: Mapped[list['DetalleDevolucion']] = relationship('DetalleDevolucion', back_populates='DetalleVenta_')


class Devolucion(Base):
    __tablename__ = 'Devolucion'
    __table_args__ = (
        ForeignKeyConstraint(['ID_Venta'], ['Ventas.ID_Venta'], name='FK_Devolucion_ID_Venta__Ventas_ID_Venta'),
        PrimaryKeyConstraint('ID_Devolucion', name='PK__Devoluci__E8BAC41EFC3BC7EC')
    )

    ID_Devolucion: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Venta: Mapped[int] = mapped_column(Integer, nullable=False)
    FechaDevolucion: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    Motivo: Mapped[str] = mapped_column(Unicode(300, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    Estado: Mapped[str] = mapped_column(Unicode(50, 'SQL_Latin1_General_CP1_CI_AS'), nullable=False)
    Total_Devuelto: Mapped[decimal.Decimal] = mapped_column(DECIMAL(10, 2), nullable=False)

    Ventas_: Mapped['Ventas'] = relationship('Ventas', back_populates='Devolucion')
    DetalleDevolucion: Mapped[list['DetalleDevolucion']] = relationship('DetalleDevolucion', back_populates='Devolucion_')


class DetalleDevolucion(Base):
    __tablename__ = 'DetalleDevolucion'
    __table_args__ = (
        ForeignKeyConstraint(['ID_DetalleVenta'], ['DetalleVenta.ID_DetalleVenta'], name='FK_DetalleDevolucion_ID_DetalleVenta__DetalleVenta_ID_DetalleVenta'),
        ForeignKeyConstraint(['ID_Devolucion'], ['Devolucion.ID_Devolucion'], name='FK_DetalleDevolucion_ID_Devolucion__Devolucion_ID_Devolucion'),
        PrimaryKeyConstraint('ID_DetalleDevolucion', name='PK__DetalleD__02F4C898858457B0')
    )

    ID_DetalleDevolucion: Mapped[int] = mapped_column(Integer, Identity(start=1, increment=1), primary_key=True)
    ID_Devolucion: Mapped[int] = mapped_column(Integer, nullable=False)
    ID_DetalleVenta: Mapped[int] = mapped_column(Integer, nullable=False)
    Cantidad: Mapped[int] = mapped_column(Integer, nullable=False)

    DetalleVenta_: Mapped['DetalleVenta'] = relationship('DetalleVenta', back_populates='DetalleDevolucion')
    Devolucion_: Mapped['Devolucion'] = relationship('Devolucion', back_populates='DetalleDevolucion')

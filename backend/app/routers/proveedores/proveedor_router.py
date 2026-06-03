from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.catalogos.departamento_model import Departamento
from app.models.catalogos.municipio_model import Municipio
from app.models.proveedores.proveedor_model import Proveedor
from app.models.proveedores.direccion_proveedor_model import DireccionProveedor
from app.models.productos.producto_model import Producto
from app.models.productos.producto_proveedor_model import ProductoProveedor
from app.models.catalogos.talla_model import Talla
from app.schemas.compras.compra_schema import ProductoProveedorCompraResponse
from app.schemas.proveedores.proveedor_schema import (
    ProveedorCompletoCreate,
    ProveedorCreate,
    ProveedorEstadoUpdate,
    ProveedorListadoResponse,
    ProveedorResumenResponse,
    ProveedorUpdate,
    ProveedorResponse,
)


router = APIRouter(
    prefix="/proveedores",
    tags=["Proveedores"]
)


def _normalizar_estado(estado: str):
    estado_normalizado = estado.strip().upper()

    if estado_normalizado not in ("ACTIVO", "INACTIVO"):
        raise HTTPException(status_code=400, detail="Estado de proveedor inválido.")

    return estado_normalizado


def _proveedor_a_listado(proveedor, direccion, departamento, municipio=None):
    return {
        "ID_Proveedor": proveedor.ID_Proveedor,
        "ID_Direccion_proveedores": proveedor.ID_Direccion_proveedores,
        "FechaRegistro": None,
        "NombreEmpresa": proveedor.NombreEmpresa,
        "NombreProveedor": proveedor.NombreEmpresa,
        "NombreDeContacto": proveedor.NombreDeContacto,
        "ApellidoDeContacto": proveedor.ApellidoDeContacto,
        "NumeroTelefono": proveedor.NumeroTelefono,
        "CorreoProfesional": proveedor.CorreoProfesional,
        "Direccion": direccion.Direccion if direccion else None,
        "ID_Departamento": direccion.Departamento if direccion else None,
        "Departamento": departamento.Departamento if departamento else None,
        "ID_Municipio": direccion.ID_Municipio if direccion else None,
        "Municipio": municipio.Municipio if municipio else None,
        "Estado": proveedor.Estado,
    }


@router.get("/resumen", response_model=ProveedorResumenResponse)
def obtener_resumen_proveedores(db: Session = Depends(get_db)):
    total = db.query(Proveedor).count()
    activos = db.query(Proveedor).filter(
        func.upper(Proveedor.Estado) == "ACTIVO"
    ).count()
    inactivos = db.query(Proveedor).filter(
        func.upper(Proveedor.Estado) == "INACTIVO"
    ).count()

    return {
        "total_proveedores": total,
        "activos": activos,
        "inactivos": inactivos,
    }


@router.get("/", response_model=list[ProveedorListadoResponse])
def listar_proveedores(db: Session = Depends(get_db)):
    proveedores = db.query(Proveedor, DireccionProveedor, Departamento, Municipio).join(
        DireccionProveedor,
        Proveedor.ID_Direccion_proveedores == DireccionProveedor.ID_Direccion_proveedores
    ).outerjoin(
        Departamento,
        DireccionProveedor.Departamento == Departamento.ID_Departamento
    ).outerjoin(
        Municipio,
        DireccionProveedor.ID_Municipio == Municipio.ID_Municipio
    ).order_by(
        Proveedor.ID_Proveedor.desc()
    ).all()

    return [
        _proveedor_a_listado(proveedor, direccion, departamento, municipio)
        for proveedor, direccion, departamento, municipio in proveedores
    ]


@router.get("/{id_proveedor}/productos", response_model=list[ProductoProveedorCompraResponse])
def listar_productos_por_proveedor(id_proveedor: int, db: Session = Depends(get_db)):
    # Compras usa esta ruta para mostrar solo productos vinculados al proveedor seleccionado.
    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == id_proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    productos = db.query(ProductoProveedor, Producto, Talla).join(
        Producto,
        ProductoProveedor.ID_Producto == Producto.ID_Producto
    ).outerjoin(
        Talla,
        Producto.ID_Talla == Talla.ID_Talla
    ).filter(
        ProductoProveedor.ID_Proveedor == id_proveedor
    ).order_by(
        Producto.Nombre.asc()
    ).all()

    return [
        {
            "ID_ProductoProveedor": producto_proveedor.ID_ProductoProveedor,
            "ID_Producto": producto.ID_Producto,
            "Nombre": producto.Nombre,
            "ID_Talla": producto.ID_Talla,
            "Talla": talla.Talla if talla else "Sin talla",
            "PrecioDeCompra": producto_proveedor.PrecioDeCompra,
            "Stock": producto.Stock,
        }
        for producto_proveedor, producto, talla in productos
    ]


@router.get("/{id_proveedor}", response_model=ProveedorResponse)
def obtener_proveedor(id_proveedor: int, db: Session = Depends(get_db)):
    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == id_proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    return proveedor


@router.post("/", response_model=ProveedorResponse)
def crear_proveedor(proveedor: ProveedorCreate, db: Session = Depends(get_db)):
    direccion = db.query(DireccionProveedor).filter(
        DireccionProveedor.ID_Direccion_proveedores == proveedor.ID_Direccion_proveedores
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de proveedor no encontrada")

    nuevo_proveedor = Proveedor(**proveedor.model_dump())

    db.add(nuevo_proveedor)
    db.commit()
    db.refresh(nuevo_proveedor)

    return nuevo_proveedor


@router.post("/registrar-completo", response_model=ProveedorListadoResponse)
def crear_proveedor_completo(
    proveedor: ProveedorCompletoCreate,
    db: Session = Depends(get_db)
):
    if not proveedor.NombreEmpresa.strip():
        raise HTTPException(status_code=400, detail="El nombre del proveedor es obligatorio.")

    if not proveedor.NombreDeContacto.strip():
        raise HTTPException(status_code=400, detail="El nombre de contacto es obligatorio.")

    if not proveedor.ApellidoDeContacto.strip():
        raise HTTPException(status_code=400, detail="El apellido de contacto es obligatorio.")

    if not proveedor.NumeroTelefono.strip():
        raise HTTPException(status_code=400, detail="El teléfono del proveedor es obligatorio.")

    if not proveedor.CorreoProfesional.strip():
        raise HTTPException(status_code=400, detail="El correo profesional es obligatorio.")

    if not proveedor.Direccion.strip():
        raise HTTPException(status_code=400, detail="La dirección del proveedor es obligatoria.")

    departamento = db.query(Departamento).filter(
        Departamento.ID_Departamento == proveedor.ID_Departamento
    ).first()

    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado.")

    municipio = db.query(Municipio).filter(
        Municipio.ID_Municipio == proveedor.ID_Municipio
    ).first()

    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado.")

    if municipio.ID_Departamento != proveedor.ID_Departamento:
        raise HTTPException(
            status_code=400,
            detail="El municipio seleccionado no pertenece al departamento indicado."
        )

    try:
        # Proveedor y direccion se crean en una misma transaccion para mantener el catalogo consistente.
        nueva_direccion = DireccionProveedor(
            Departamento=proveedor.ID_Departamento,
            ID_Municipio=proveedor.ID_Municipio,
            Direccion=proveedor.Direccion.strip(),
        )

        db.add(nueva_direccion)
        db.flush()

        nuevo_proveedor = Proveedor(
            ID_Direccion_proveedores=nueva_direccion.ID_Direccion_proveedores,
            NombreEmpresa=proveedor.NombreEmpresa.strip(),
            NombreDeContacto=proveedor.NombreDeContacto.strip(),
            ApellidoDeContacto=proveedor.ApellidoDeContacto.strip(),
            NumeroTelefono=proveedor.NumeroTelefono.strip(),
            CorreoProfesional=proveedor.CorreoProfesional.strip(),
            Estado="ACTIVO",
        )

        db.add(nuevo_proveedor)
        db.commit()
        db.refresh(nuevo_proveedor)
        db.refresh(nueva_direccion)

        return _proveedor_a_listado(nuevo_proveedor, nueva_direccion, departamento, municipio)
    except Exception:
        db.rollback()
        raise


@router.patch("/{id_proveedor}/estado", response_model=ProveedorListadoResponse)
def cambiar_estado_proveedor(
    id_proveedor: int,
    datos: ProveedorEstadoUpdate,
    db: Session = Depends(get_db)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == id_proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    proveedor.Estado = _normalizar_estado(datos.Estado)
    db.commit()
    db.refresh(proveedor)

    direccion = db.query(DireccionProveedor).filter(
        DireccionProveedor.ID_Direccion_proveedores == proveedor.ID_Direccion_proveedores
    ).first()
    departamento = None

    if direccion:
        departamento = db.query(Departamento).filter(
            Departamento.ID_Departamento == direccion.Departamento
        ).first()
        municipio = None

        if direccion.ID_Municipio is not None:
            municipio = db.query(Municipio).filter(
                Municipio.ID_Municipio == direccion.ID_Municipio
            ).first()
    else:
        municipio = None

    return _proveedor_a_listado(proveedor, direccion, departamento, municipio)


@router.put("/{id_proveedor}", response_model=ProveedorResponse)
def actualizar_proveedor(
    id_proveedor: int,
    proveedor_actualizado: ProveedorUpdate,
    db: Session = Depends(get_db)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.ID_Proveedor == id_proveedor
    ).first()

    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    datos_actualizados = proveedor_actualizado.model_dump(exclude_unset=True)

    if "ID_Direccion_proveedores" in datos_actualizados:
        direccion = db.query(DireccionProveedor).filter(
            DireccionProveedor.ID_Direccion_proveedores == datos_actualizados["ID_Direccion_proveedores"]
        ).first()

        if not direccion:
            raise HTTPException(status_code=404, detail="Dirección de proveedor no encontrada")

    for campo, valor in datos_actualizados.items():
        setattr(proveedor, campo, valor)

    db.commit()
    db.refresh(proveedor)

    return proveedor

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import String, cast, func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.catalogos.departamento_model import Departamento
from app.models.catalogos.municipio_model import Municipio
from app.models.clientes.cliente_model import Cliente
from app.models.clientes.direccion_cliente_model import DireccionCliente
from app.schemas.clientes.cliente_schema import (
    ClienteCompletoCreate,
    ClienteCreate,
    ClienteListadoResponse,
    ClienteResumenResponse,
    ClienteUpdate,
    ClienteResponse,
)


router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"]
)


def _nombre_completo(cliente: Cliente):
    nombres = cliente.Nombres or ""
    apellidos = cliente.Apellidos or ""
    nombre = f"{nombres} {apellidos}".strip()

    return nombre or f"Cliente {cliente.ID_Cliente}"


def _cliente_a_listado(cliente, direccion, departamento, municipio=None):
    return {
        "ID_Cliente": cliente.ID_Cliente,
        "ID_Direccion": cliente.ID_Direccion,
        "Nombres": cliente.Nombres,
        "Apellidos": cliente.Apellidos,
        "NombreCompleto": _nombre_completo(cliente),
        "NumeroTelefono": cliente.NumeroTelefono,
        "Estado": cliente.Estado,
        "Direccion": direccion.Direccion if direccion else None,
        "ID_Departamento": direccion.ID_Departamento if direccion else None,
        "Departamento": departamento.Departamento if departamento else None,
        "ID_Municipio": direccion.ID_Municipio if direccion else None,
        "Municipio": municipio.Municipio if municipio else None,
        "FechaRegistro": None,
    }


@router.get("/resumen", response_model=ClienteResumenResponse)
def obtener_resumen_clientes(db: Session = Depends(get_db)):
    clientes_registrados = db.query(Cliente).count()
    clientes_activos = db.query(Cliente).filter(
        func.upper(Cliente.Estado) == "ACTIVO"
    ).count()
    clientes_con_direccion = db.query(Cliente).join(
        DireccionCliente,
        Cliente.ID_Direccion == DireccionCliente.ID_Direccion
    ).filter(
        DireccionCliente.Direccion.isnot(None),
        func.ltrim(func.rtrim(DireccionCliente.Direccion)) != "",
    ).count()

    return {
        "clientes_registrados": clientes_registrados,
        "clientes_nuevos_mes": 0,
        "clientes_activos": clientes_activos,
        "clientes_con_direccion": clientes_con_direccion,
    }


@router.get("/recientes", response_model=list[ClienteListadoResponse])
def listar_clientes_recientes(db: Session = Depends(get_db)):
    clientes = db.query(Cliente, DireccionCliente, Departamento, Municipio).join(
        DireccionCliente,
        Cliente.ID_Direccion == DireccionCliente.ID_Direccion
    ).outerjoin(
        Departamento,
        DireccionCliente.ID_Departamento == Departamento.ID_Departamento
    ).outerjoin(
        Municipio,
        DireccionCliente.ID_Municipio == Municipio.ID_Municipio
    ).order_by(
        Cliente.ID_Cliente.desc()
    ).limit(5).all()

    return [
        _cliente_a_listado(cliente, direccion, departamento, municipio)
        for cliente, direccion, departamento, municipio in clientes
    ]


@router.get("/buscar", response_model=list[ClienteListadoResponse])
def buscar_clientes(
    busqueda: str,
    db: Session = Depends(get_db),
):
    # Se usa en Nueva Venta para reutilizar clientes existentes antes de crear otro registro.
    termino_limpio = busqueda.strip()

    if len(termino_limpio) < 2:
        return []

    termino = f"%{termino_limpio}%"

    clientes = db.query(Cliente, DireccionCliente, Departamento, Municipio).join(
        DireccionCliente,
        Cliente.ID_Direccion == DireccionCliente.ID_Direccion
    ).outerjoin(
        Departamento,
        DireccionCliente.ID_Departamento == Departamento.ID_Departamento
    ).outerjoin(
        Municipio,
        DireccionCliente.ID_Municipio == Municipio.ID_Municipio
    ).filter(
        or_(
            Cliente.Nombres.ilike(termino),
            Cliente.Apellidos.ilike(termino),
            func.concat(
                func.coalesce(Cliente.Nombres, ""),
                " ",
                func.coalesce(Cliente.Apellidos, "")
            ).ilike(termino),
            Cliente.NumeroTelefono.ilike(termino),
        )
    ).order_by(
        Cliente.ID_Cliente.desc()
    ).limit(5).all()

    return [
        _cliente_a_listado(cliente, direccion, departamento, municipio)
        for cliente, direccion, departamento, municipio in clientes
    ]


@router.get("/", response_model=list[ClienteListadoResponse])
def listar_clientes(
    busqueda: Optional[str] = None,
    departamento: Optional[int] = None,
    db: Session = Depends(get_db),
):
    consulta = db.query(Cliente, DireccionCliente, Departamento, Municipio).join(
        DireccionCliente,
        Cliente.ID_Direccion == DireccionCliente.ID_Direccion
    ).outerjoin(
        Departamento,
        DireccionCliente.ID_Departamento == Departamento.ID_Departamento
    ).outerjoin(
        Municipio,
        DireccionCliente.ID_Municipio == Municipio.ID_Municipio
    )

    if busqueda:
        termino = f"%{busqueda.strip()}%"
        consulta = consulta.filter(
            or_(
                cast(Cliente.ID_Cliente, String).like(termino),
                Cliente.Nombres.ilike(termino),
                Cliente.Apellidos.ilike(termino),
                Cliente.NumeroTelefono.ilike(termino),
            )
        )

    if departamento:
        consulta = consulta.filter(
            DireccionCliente.ID_Departamento == departamento
        )

    clientes = consulta.order_by(Cliente.ID_Cliente.desc()).all()

    return [
        _cliente_a_listado(cliente, direccion, departamento, municipio)
        for cliente, direccion, departamento, municipio in clientes
    ]


@router.get("/{id_cliente}", response_model=ClienteResponse)
def obtener_cliente(id_cliente: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(
        Cliente.ID_Cliente == id_cliente
    ).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return cliente


@router.post("/", response_model=ClienteResponse)
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    direccion = db.query(DireccionCliente).filter(
        DireccionCliente.ID_Direccion == cliente.ID_Direccion
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de cliente no encontrada")

    nuevo_cliente = Cliente(**cliente.model_dump())

    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)

    return nuevo_cliente


@router.post("/registrar-completo", response_model=ClienteListadoResponse)
def crear_cliente_completo(
    cliente: ClienteCompletoCreate,
    db: Session = Depends(get_db)
):
    if not cliente.Nombres.strip():
        raise HTTPException(status_code=400, detail="El nombre del cliente es obligatorio.")

    if not cliente.Apellidos.strip():
        raise HTTPException(status_code=400, detail="El apellido del cliente es obligatorio.")

    if cliente.NumeroTelefono and not cliente.NumeroTelefono.strip():
        raise HTTPException(status_code=400, detail="El teléfono del cliente no puede estar vacío.")

    if not cliente.Direccion.strip():
        raise HTTPException(status_code=400, detail="La dirección del cliente es obligatoria.")

    departamento = db.query(Departamento).filter(
        Departamento.ID_Departamento == cliente.ID_Departamento
    ).first()

    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado.")

    municipio = db.query(Municipio).filter(
        Municipio.ID_Municipio == cliente.ID_Municipio
    ).first()

    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado.")

    if municipio.ID_Departamento != cliente.ID_Departamento:
        raise HTTPException(
            status_code=400,
            detail="El municipio seleccionado no pertenece al departamento indicado."
        )

    try:
        # Cliente y direccion se guardan juntos para no dejar personas sin ubicacion asociada.
        nueva_direccion = DireccionCliente(
            ID_Departamento=cliente.ID_Departamento,
            ID_Municipio=cliente.ID_Municipio,
            Direccion=cliente.Direccion.strip(),
        )

        db.add(nueva_direccion)
        db.flush()

        nuevo_cliente = Cliente(
            ID_Direccion=nueva_direccion.ID_Direccion,
            Nombres=cliente.Nombres.strip(),
            Apellidos=cliente.Apellidos.strip(),
            NumeroTelefono=cliente.NumeroTelefono.strip() if cliente.NumeroTelefono else None,
            Estado="ACTIVO",
        )

        db.add(nuevo_cliente)
        db.commit()
        db.refresh(nuevo_cliente)
        db.refresh(nueva_direccion)

        return _cliente_a_listado(nuevo_cliente, nueva_direccion, departamento, municipio)
    except Exception:
        db.rollback()
        raise


@router.put("/{id_cliente}", response_model=ClienteResponse)
def actualizar_cliente(
    id_cliente: int,
    cliente_actualizado: ClienteUpdate,
    db: Session = Depends(get_db)
):
    cliente = db.query(Cliente).filter(
        Cliente.ID_Cliente == id_cliente
    ).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    datos_actualizados = cliente_actualizado.model_dump(exclude_unset=True)

    if "ID_Direccion" in datos_actualizados:
        direccion = db.query(DireccionCliente).filter(
            DireccionCliente.ID_Direccion == datos_actualizados["ID_Direccion"]
        ).first()

        if not direccion:
            raise HTTPException(status_code=404, detail="Dirección de cliente no encontrada")

    for campo, valor in datos_actualizados.items():
        setattr(cliente, campo, valor)

    db.commit()
    db.refresh(cliente)

    return cliente

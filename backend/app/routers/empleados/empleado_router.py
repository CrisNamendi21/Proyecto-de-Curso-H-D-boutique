from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import String, cast, func, or_
from sqlalchemy.orm import Session

from app.auth.security import generar_hash_password
from app.database import get_db
from app.models.catalogos.departamento_model import Departamento
from app.models.catalogos.municipio_model import Municipio
from app.models.empleados.empleado_model import Empleado
from app.models.empleados.direccion_empleado_model import DireccionEmpleado
from app.models.usuarios.usuario_model import UsuarioSistema
from app.schemas.empleados.empleado_schema import (
    EmpleadoCompletoCreate,
    EmpleadoCreate,
    EmpleadoEstadoUpdate,
    EmpleadoListadoResponse,
    EmpleadoResumenResponse,
    EmpleadoUpdate,
    EmpleadoResponse,
)


router = APIRouter(
    prefix="/empleados",
    tags=["Empleados"]
)


def _estado_empleado(empleado: Empleado):
    return "INACTIVO" if empleado.FechaFin else "ACTIVO"


def _nombre_completo(empleado: Empleado):
    return f"{empleado.Nombres} {empleado.Apellidos}".strip()


def _normalizar_estado(estado: str):
    estado_normalizado = estado.strip().upper()

    if estado_normalizado not in ("ACTIVO", "INACTIVO"):
        raise HTTPException(status_code=400, detail="Estado de empleado inválido.")

    return estado_normalizado


def _usuario_normalizado(usuario: Optional[str]):
    if not usuario:
        return None

    usuario_limpio = usuario.strip()
    return usuario_limpio or None


def _validar_usuario_disponible(db: Session, usuario: Optional[str], id_empleado: Optional[int] = None):
    usuario_limpio = _usuario_normalizado(usuario)

    if not usuario_limpio:
        return None

    consulta = db.query(UsuarioSistema).filter(
        func.lower(UsuarioSistema.Usuario) == usuario_limpio.lower()
    )

    if id_empleado is not None:
        consulta = consulta.filter(UsuarioSistema.ID_Empleado != id_empleado)

    if consulta.first():
        raise HTTPException(status_code=400, detail="El usuario del empleado ya existe.")

    return usuario_limpio


def _crear_o_actualizar_usuario_empleado(
    db: Session,
    empleado: Empleado,
    usuario: Optional[str],
    password: Optional[str] = None
):
    # El usuario de sistema se sincroniza con el estado laboral del empleado.
    usuario_limpio = _validar_usuario_disponible(
        db,
        usuario,
        id_empleado=empleado.ID_Empleado
    )

    usuario_existente = db.query(UsuarioSistema).filter(
        UsuarioSistema.ID_Empleado == empleado.ID_Empleado
    ).first()

    if not usuario_limpio:
        return usuario_existente

    if not usuario_existente and not password:
        raise HTTPException(
            status_code=400,
            detail="La contrasena es obligatoria cuando se asigna usuario."
        )

    if usuario_existente:
        usuario_existente.Usuario = usuario_limpio
        usuario_existente.Rol = "COLABORADOR"
        usuario_existente.Estado = "ACTIVO" if empleado.FechaFin is None else "INACTIVO"

        if password:
            usuario_existente.ContrasenaHash = generar_hash_password(password)

        return usuario_existente

    nuevo_usuario = UsuarioSistema(
        ID_Empleado=empleado.ID_Empleado,
        Usuario=usuario_limpio,
        ContrasenaHash=generar_hash_password(password),
        Rol="COLABORADOR",
        Estado="ACTIVO" if empleado.FechaFin is None else "INACTIVO",
    )

    db.add(nuevo_usuario)
    return nuevo_usuario


def _empleado_a_listado(empleado, direccion, departamento, municipio=None, usuario_sistema=None):
    return {
        "ID_Empleado": empleado.ID_Empleado,
        "ID_Direccion_empleado": empleado.ID_Direccion_empleado,
        "Nombres": empleado.Nombres,
        "Apellidos": empleado.Apellidos,
        "NombreCompleto": _nombre_completo(empleado),
        "NumeroTelefono": empleado.NumeroTelefono,
        "CorreoProfesional": empleado.CorreoProfesional,
        "Cargo": empleado.Cargo,
        "Estado": _estado_empleado(empleado),
        "FechaInicio": empleado.FechaInicio,
        "FechaFin": empleado.FechaFin,
        "Direccion": direccion.Direccion if direccion else None,
        "ID_Departamento": direccion.Departamento if direccion else None,
        "Departamento": departamento.Departamento if departamento else None,
        "ID_Municipio": direccion.ID_Municipio if direccion else None,
        "Municipio": municipio.Municipio if municipio else None,
        "Usuario": usuario_sistema.Usuario if usuario_sistema else None,
    }


@router.get("/resumen", response_model=EmpleadoResumenResponse)
def obtener_resumen_empleados(db: Session = Depends(get_db)):
    empleados_registrados = db.query(Empleado).count()
    activos = db.query(Empleado).filter(Empleado.FechaFin.is_(None)).count()
    inactivos = db.query(Empleado).filter(Empleado.FechaFin.isnot(None)).count()
    colaboradores = db.query(Empleado).filter(
        func.upper(func.coalesce(Empleado.Cargo, "")) == "EMPLEADO"
    ).count()

    return {
        "empleados_registrados": empleados_registrados,
        "activos": activos,
        "inactivos": inactivos,
        "colaboradores": colaboradores,
    }


@router.get("/", response_model=list[EmpleadoListadoResponse])
def listar_empleados(
    busqueda: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
):
    consulta = db.query(Empleado, DireccionEmpleado, Departamento, Municipio, UsuarioSistema).join(
        DireccionEmpleado,
        Empleado.ID_Direccion_empleado == DireccionEmpleado.ID_Direccion_empleado
    ).outerjoin(
        Departamento,
        DireccionEmpleado.Departamento == Departamento.ID_Departamento
    ).outerjoin(
        Municipio,
        DireccionEmpleado.ID_Municipio == Municipio.ID_Municipio
    ).outerjoin(
        UsuarioSistema,
        UsuarioSistema.ID_Empleado == Empleado.ID_Empleado
    )

    if busqueda:
        termino = f"%{busqueda.strip()}%"
        consulta = consulta.filter(
            or_(
                cast(Empleado.ID_Empleado, String).like(termino),
                Empleado.Nombres.ilike(termino),
                Empleado.Apellidos.ilike(termino),
                Empleado.NumeroTelefono.ilike(termino),
                Empleado.CorreoProfesional.ilike(termino),
                UsuarioSistema.Usuario.ilike(termino),
            )
        )

    estado_normalizado = _normalizar_estado(estado) if estado and estado.lower() != "todos" else None

    if estado_normalizado == "ACTIVO":
        consulta = consulta.filter(Empleado.FechaFin.is_(None))
    elif estado_normalizado == "INACTIVO":
        consulta = consulta.filter(Empleado.FechaFin.isnot(None))

    empleados = consulta.order_by(Empleado.ID_Empleado.desc()).all()

    return [
        _empleado_a_listado(empleado, direccion, departamento, municipio, usuario_sistema)
        for empleado, direccion, departamento, municipio, usuario_sistema in empleados
    ]


@router.get("/{id_empleado}", response_model=EmpleadoResponse)
def obtener_empleado(id_empleado: int, db: Session = Depends(get_db)):
    empleado = db.query(Empleado).filter(
        Empleado.ID_Empleado == id_empleado
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    return empleado


@router.post("/", response_model=EmpleadoResponse)
def crear_empleado(empleado: EmpleadoCreate, db: Session = Depends(get_db)):
    direccion = db.query(DireccionEmpleado).filter(
        DireccionEmpleado.ID_Direccion_empleado == empleado.ID_Direccion_empleado
    ).first()

    if not direccion:
        raise HTTPException(status_code=404, detail="Dirección de empleado no encontrada")

    datos_empleado = empleado.model_dump(exclude={"Usuario", "Password"})

    nuevo_empleado = Empleado(**datos_empleado)

    db.add(nuevo_empleado)
    db.flush()
    _crear_o_actualizar_usuario_empleado(
        db,
        nuevo_empleado,
        empleado.Usuario,
        empleado.Password
    )
    db.commit()
    db.refresh(nuevo_empleado)

    return nuevo_empleado


@router.post("/registrar-completo", response_model=EmpleadoListadoResponse)
def crear_empleado_completo(
    empleado: EmpleadoCompletoCreate,
    db: Session = Depends(get_db)
):
    if not empleado.Nombres.strip():
        raise HTTPException(status_code=400, detail="El nombre del empleado es obligatorio.")

    if not empleado.Apellidos.strip():
        raise HTTPException(status_code=400, detail="El apellido del empleado es obligatorio.")

    if not empleado.NumeroTelefono.strip():
        raise HTTPException(status_code=400, detail="El teléfono del empleado es obligatorio.")

    if not empleado.Direccion.strip():
        raise HTTPException(status_code=400, detail="La dirección del empleado es obligatoria.")

    usuario = _usuario_normalizado(empleado.Usuario)

    departamento = db.query(Departamento).filter(
        Departamento.ID_Departamento == empleado.ID_Departamento
    ).first()

    if not departamento:
        raise HTTPException(status_code=404, detail="Departamento no encontrado.")

    municipio = db.query(Municipio).filter(
        Municipio.ID_Municipio == empleado.ID_Municipio
    ).first()

    if not municipio:
        raise HTTPException(status_code=404, detail="Municipio no encontrado.")

    if municipio.ID_Departamento != empleado.ID_Departamento:
        raise HTTPException(
            status_code=400,
            detail="El municipio seleccionado no pertenece al departamento indicado."
        )

    try:
        nueva_direccion = DireccionEmpleado(
            Departamento=empleado.ID_Departamento,
            ID_Municipio=empleado.ID_Municipio,
            Direccion=empleado.Direccion.strip(),
        )

        db.add(nueva_direccion)
        db.flush()

        nuevo_empleado = Empleado(
            ID_Direccion_empleado=nueva_direccion.ID_Direccion_empleado,
            Nombres=empleado.Nombres.strip(),
            Apellidos=empleado.Apellidos.strip(),
            NumeroTelefono=empleado.NumeroTelefono.strip(),
            FechaInicio=empleado.FechaInicio,
            CorreoProfesional=empleado.CorreoProfesional.strip()
            if empleado.CorreoProfesional
            else None,
            Cargo=empleado.Cargo.strip() if empleado.Cargo else "Empleado",
            FechaFin=None,
        )

        db.add(nuevo_empleado)
        db.flush()
        _crear_o_actualizar_usuario_empleado(
            db,
            nuevo_empleado,
            usuario,
            empleado.Password
        )
        db.commit()
        db.refresh(nuevo_empleado)
        db.refresh(nueva_direccion)

        return _empleado_a_listado(nuevo_empleado, nueva_direccion, departamento, municipio)
    except Exception:
        db.rollback()
        raise


@router.patch("/{id_empleado}/estado", response_model=EmpleadoListadoResponse)
def cambiar_estado_empleado(
    id_empleado: int,
    datos: EmpleadoEstadoUpdate,
    db: Session = Depends(get_db)
):
    empleado = db.query(Empleado).filter(
        Empleado.ID_Empleado == id_empleado
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado.")

    estado = _normalizar_estado(datos.Estado)
    # FechaFin funciona como marca de inactividad del empleado y tambien bloquea su usuario.
    empleado.FechaFin = None if estado == "ACTIVO" else date.today()
    usuario_sistema = db.query(UsuarioSistema).filter(
        UsuarioSistema.ID_Empleado == empleado.ID_Empleado
    ).first()

    if usuario_sistema:
        usuario_sistema.Estado = estado

    db.commit()
    db.refresh(empleado)

    direccion = db.query(DireccionEmpleado).filter(
        DireccionEmpleado.ID_Direccion_empleado == empleado.ID_Direccion_empleado
    ).first()
    departamento = None
    municipio = None

    if direccion:
        departamento = db.query(Departamento).filter(
            Departamento.ID_Departamento == direccion.Departamento
        ).first()

        if direccion.ID_Municipio is not None:
            municipio = db.query(Municipio).filter(
                Municipio.ID_Municipio == direccion.ID_Municipio
            ).first()

    return _empleado_a_listado(empleado, direccion, departamento, municipio, usuario_sistema)


@router.put("/{id_empleado}", response_model=EmpleadoResponse)
def actualizar_empleado(
    id_empleado: int,
    empleado_actualizado: EmpleadoUpdate,
    db: Session = Depends(get_db)
):
    empleado = db.query(Empleado).filter(
        Empleado.ID_Empleado == id_empleado
    ).first()

    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    datos_actualizados = empleado_actualizado.model_dump(exclude_unset=True)

    usuario_actualizado = datos_actualizados.pop("Usuario", None)

    if "ID_Direccion_empleado" in datos_actualizados:
        direccion = db.query(DireccionEmpleado).filter(
            DireccionEmpleado.ID_Direccion_empleado == datos_actualizados["ID_Direccion_empleado"]
        ).first()

        if not direccion:
            raise HTTPException(status_code=404, detail="Dirección de empleado no encontrada")

    for campo, valor in datos_actualizados.items():
        setattr(empleado, campo, valor)

    if usuario_actualizado is not None:
        _crear_o_actualizar_usuario_empleado(db, empleado, usuario_actualizado)

    db.commit()
    db.refresh(empleado)

    return empleado

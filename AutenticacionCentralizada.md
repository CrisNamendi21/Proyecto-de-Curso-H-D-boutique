# Autenticacion centralizada

## Problema anterior

El sistema tenia dos caminos de autenticacion: la duena entraba con una credencial fija configurada en el backend y el colaborador entraba desde la tabla `Usuarios`. Eso funcionaba, pero dejaba la logica dividida y hacia mas dificil controlar roles, tokens y permisos desde un solo lugar.

## Decision aplicada

La autenticacion queda centralizada en la tabla `Usuarios`. Tanto `DUENA` como `COLABORADOR` usan el mismo endpoint:

```txt
POST /auth/login
```

JWT se mantiene. No se reemplazo por validaciones simples en frontend. El token sigue siendo el mecanismo principal para mantener la sesion y para que el backend pueda identificar el usuario actual.

## Tabla Usuarios

La tabla `Usuarios` guarda los datos de acceso:

```txt
ID_Usuario
ID_Empleado
Usuario
ContrasenaHash
Rol
Estado
FechaCreacion
```

`Usuarios.ID_Empleado` se relaciona con `Empleados.ID_Empleado`. La tabla `Empleados` queda solo para datos personales y laborales. No debe tener columnas `Usuario` ni `PasswordHash`.

## Flujo de login

1. El frontend envia `Usuario` y `Password` a `/auth/login`.
2. El backend busca el usuario en `dbo.Usuarios`.
3. El backend valida que el usuario exista.
4. El backend valida que `Estado` sea `ACTIVO`.
5. El backend valida que el empleado relacionado no tenga `FechaFin`.
6. El backend compara el password recibido contra `ContrasenaHash`.
7. Si todo esta correcto, genera un JWT.
8. El frontend guarda el token.
9. El frontend redirige segun el rol:
   - `DUENA`: dashboard de duena.
   - `COLABORADOR`: dashboard de colaborador.

## Datos dentro del JWT

El token incluye estos datos minimos:

```txt
id_usuario
sub
nombre
rol
id_empleado
exp
```

`sub` guarda el nombre de usuario. `rol` se normaliza en minuscula dentro del backend para que el frontend pueda comparar `duena` o `colaborador`.

## Roles

Los roles esperados en la base son:

```txt
DUENA
COLABORADOR
```

En `backend/app/auth/security.py` quedo preparada la funcion `requerir_roles(...)` para proteger rutas por rol cuando se empiecen a cerrar permisos de modulos administrativos.

## Contrasenas

La contrasena real no se guarda en archivos ni en tablas. Solo se guarda el hash en:

```txt
dbo.Usuarios.ContrasenaHash
```

Si alguien olvida su contrasena, no se puede recuperar desde el hash. Se debe generar una nueva contrasena y guardar un nuevo hash.

Para generar hashes nuevos se agrego:

```txt
backend/scripts/generar_hash_password.py
```

## Cuenta de duena

La duena ya no debe depender de una credencial fija quemada en el backend. Para crearla en `Usuarios`, se agrego:

```txt
backend/scripts/crear_usuario_duena.sql
```

Antes de ejecutarlo, se debe confirmar que el valor `@ID_Empleado_Duena` corresponde a una persona real en `dbo.Empleados`. El script no elimina datos y no modifica al colaborador existente.

## Archivos modificados

```txt
backend/app/auth/security.py
backend/app/config.py
backend/app/routers/auth/auth_router.py
backend/app/schemas/auth/auth_schema.py
backend/.env.example
frontend/src/App.jsx
```

## Archivos creados

```txt
backend/scripts/crear_usuario_duena.sql
backend/scripts/generar_hash_password.py
AutenticacionCentralizada.md
```

## Pruebas recomendadas

Backend:

```txt
python -m compileall backend/app
```

Login colaborador:

```txt
Usuario: jose.gutierrez
Contrasena: Prueba123
```

Login duena:

```txt
Ejecutar primero backend/scripts/crear_usuario_duena.sql
Luego probar el usuario duena con la contrasena correspondiente al hash usado.
```

Base de datos:

```sql
SELECT * FROM dbo.Usuarios;

SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Empleados'
  AND COLUMN_NAME IN ('Usuario', 'PasswordHash');
```

La segunda consulta no debe devolver filas.

## Pendiente

Queda pendiente aplicar `requerir_roles(...)` en rutas especificas, por ejemplo modulos solo para `DUENA` y modulos compartidos con `COLABORADOR`. Tambien queda pendiente agregar una pantalla para restablecer contrasenas y una vista visual del comprobante generado por el colaborador.

# Sistema de Control de Solicitudes de Equipamiento
**Trabajo Práctico — Diseño de Sistemas — UTN FRC | Grupo 11**

---

## Índice

1. [Instrucciones para ejecutar el proyecto](#instrucciones-para-ejecutar-el-proyecto)
2. [Usuarios de prueba](#usuarios-de-prueba)
3. [Endpoints del backend](#endpoints-del-backend)
4. [Rutas del frontend](#rutas-del-frontend)
5. [Disponibilidad de equipos y autorización de préstamos](#disponibilidad-de-equipos-y-autorización-de-préstamos)
6. [Autenticación JWT, roles y permisos](#autenticación-jwt-roles-y-permisos)
7. [Cómo ejecutar las pruebas](#cómo-ejecutar-las-pruebas)
8. [Limitaciones conocidas](#limitaciones-conocidas)

---

## Instrucciones para ejecutar el proyecto

### Requisitos previos

- Node.js v18 o superior
- npm v9 o superior

### Backend

```bash
# Desde la raíz del proyecto
cd backend
npm install
npm run dev
```

El servidor quedará corriendo en `http://localhost:3000`.
Al iniciar, el sistema siembra automáticamente usuarios, equipos, solicitudes e historial de prueba si los archivos JSON están vacíos.

### Frontend

Abrir una segunda terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación quedará disponible en `http://localhost:5173`.

> Tanto el backend como el frontend deben estar corriendo al mismo tiempo para que la aplicación funcione correctamente.

---

## Usuarios de prueba

Estos usuarios están precargados en `backend/data/db.json` al iniciar el sistema:

| Email | Contraseña | Rol |
|---|---|---|
| `admin@dds.com` | `admin123` | admin |
| `encargado@dds.com` | `encargado123` | encargado |
| `carla@dds.com` | `password123` | usuario |
| `tomas@dds.com` | `password123` | usuario |

---

## Endpoints del backend

La URL base de la API es `http://localhost:3000/api`.

### Autenticación

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| POST | `/api/auth/register` | Registrar nuevo usuario | No |
| POST | `/api/auth/login` | Iniciar sesión, devuelve JWT | No |

### Equipos

| Método | Ruta | Descripción | Autenticación |
|---|---|---|---|
| GET | `/api/equipos` | Listar todos los equipos | No |
| GET | `/api/equipos/:id` | Obtener detalle de un equipo | No |

### Solicitudes

| Método | Ruta | Descripción | Roles permitidos |
|---|---|---|---|
| GET | `/api/solicitudes` | Listar solicitudes con filtros y paginación | Todos |
| GET | `/api/solicitudes/:id` | Detalle de una solicitud | Todos |
| GET | `/api/solicitudes/:id/historial` | Historial de cambios de una solicitud | Todos |
| POST | `/api/solicitudes` | Crear nueva solicitud | Todos |
| PUT | `/api/solicitudes/:id` | Editar solicitud pendiente | Todos (solo el dueño o admin/encargado) |
| PATCH | `/api/solicitudes/:id/aprobar` | Aprobar una solicitud pendiente | admin, encargado |
| PATCH | `/api/solicitudes/:id/rechazar` | Rechazar una solicitud pendiente | admin, encargado |
| PATCH | `/api/solicitudes/:id/cancelar` | Cancelar una solicitud propia | Todos (solo el dueño o admin/encargado) |
| PATCH | `/api/solicitudes/:id/devolver` | Registrar devolución del equipo | admin, encargado |

#### Parámetros de filtrado y paginación para GET `/api/solicitudes`

| Parámetro | Descripción | Ejemplo |
|---|---|---|
| `estado` | Filtrar por estado | `pendiente`, `aprobada`, `rechazada`, `cancelada`, `devuelta` |
| `equipoId` | Filtrar por equipo | `eq-001` |
| `categoria` | Filtrar por categoría del equipo | `notebook`, `proyector`, `cámara` |
| `desde` | Fecha de retiro desde (inclusive) | `2026-06-01` |
| `hasta` | Fecha de retiro hasta (inclusive) | `2026-06-30` |
| `page` | Número de página (default: 1) | `2` |
| `limit` | Resultados por página (default: 10, máx: 100) | `5` |
| `sortBy` | Campo de ordenamiento | `fechaRetiro`, `fechaDevolucion`, `estado`, `id` |
| `order` | Dirección del ordenamiento | `asc`, `desc` |

---

## Rutas del frontend

| Ruta | Descripción | Protegida |
|---|---|---|
| `/` | Redirige a `/solicitudes` | — |
| `/login` | Pantalla de inicio de sesión | No |
| `/register` | Pantalla de registro de usuario | No |
| `/solicitudes` | Listado de solicitudes con filtros | Sí |
| `/solicitudes/nueva` | Formulario para crear una solicitud | Sí |
| `/solicitudes/:id` | Detalle de una solicitud con acciones | Sí |
| `/solicitudes/:id/editar` | Formulario para editar una solicitud pendiente | Sí |
| `/equipos` | Catálogo de equipos disponibles | Sí |
| `*` | Página 404 — ruta no encontrada | — |

---

## Disponibilidad de equipos y autorización de préstamos

### Estados de un equipo

Cada equipo puede estar en uno de estos estados:

- **disponible**: el equipo puede ser solicitado.
- **prestado**: el equipo tiene una solicitud aprobada activa. No puede recibir nuevas solicitudes aprobadas en el mismo período.
- **mantenimiento**: el equipo está fuera de servicio temporalmente.
- **baja**: el equipo fue dado de baja definitivamente.

### Reglas de disponibilidad

Cuando se intenta **aprobar** una solicitud, el sistema verifica automáticamente:

1. Que el equipo esté en estado `disponible` o no tenga otra solicitud aprobada superpuesta en las mismas fechas.
2. Que no exista superposición de fechas con otra solicitud ya aprobada para el mismo equipo. Dos solicitudes se superponen cuando sus períodos [fechaRetiro, fechaDevolucion] se solapan. El algoritmo verifica: si `A.fechaDevolucion <= B.fechaRetiro` o `B.fechaDevolucion <= A.fechaRetiro`, no hay superposición; en cualquier otro caso, sí la hay.
3. Que el equipo no requiera autorización especial, o bien, que quien aprueba tenga rol `admin` o `encargado`.

Al aprobar una solicitud, el sistema cambia el estado del equipo a `prestado` automáticamente. Al cancelar o devolver, el estado vuelve a `disponible`.

### Autorización especial

Algunos equipos tienen el campo `requiereAutorizacion: true` (por ejemplo, proyectores y cámaras). Para estos equipos, solo un usuario con rol `admin` o `encargado` puede aprobar el préstamo. Un usuario con rol `usuario` recibirá un error 403 si intenta aprobar este tipo de solicitud.

---

## Autenticación JWT, roles y permisos

### Cómo funciona JWT en este sistema

1. El usuario envía su email y contraseña al endpoint `POST /api/auth/login`.
2. El backend verifica las credenciales contra la base de datos (los passwords se almacenan hasheados con bcrypt).
3. Si las credenciales son válidas, el backend genera un **token JWT** firmado con la clave secreta `UTN_FRC_DDS_SECRET` y con expiración de 2 horas.
4. El frontend almacena este token y lo incluye en cada petición posterior dentro del header HTTP `Authorization: Bearer <token>`.
5. El middleware `autenticarJWT` intercepta cada request a rutas protegidas, extrae el token, lo verifica y, si es válido, inyecta los datos del usuario (`id` y `rol`) en `req.usuario` para que los controladores los usen.
6. Si el token está ausente, el sistema responde con **401 Unauthorized**. Si el token es inválido o expirado, responde con **403 Forbidden**.

### Roles y permisos

| Acción | usuario | encargado | admin |
|---|---|---|---|
| Ver listado de solicitudes | ✅ | ✅ | ✅ |
| Ver detalle de solicitud | ✅ | ✅ | ✅ |
| Crear solicitud | ✅ | ✅ | ✅ |
| Editar solicitud propia (pendiente) | ✅ | ✅ | ✅ |
| Editar cualquier solicitud (pendiente) | ❌ | ✅ | ✅ |
| Cancelar solicitud propia | ✅ | ✅ | ✅ |
| Cancelar cualquier solicitud | ❌ | ✅ | ✅ |
| Aprobar solicitud | ❌ | ✅ | ✅ |
| Rechazar solicitud | ❌ | ✅ | ✅ |
| Registrar devolución | ❌ | ✅ | ✅ |

El middleware `autorizarRol` protege los endpoints críticos en el backend. Los controles del frontend (mostrar u ocultar botones según el rol) son complementarios, pero **la validación real de permisos siempre ocurre en el servidor**.

---

## Cómo ejecutar las pruebas

```bash
cd backend
npm test
```

Los tests cubren los siguientes escenarios:

- Login correcto e incorrecto
- Creación válida de solicitud
- Rechazo de solicitud con fechas inconsistentes (fechaRetiro posterior o igual a fechaDevolucion)
- Creación inválida por superposición de fechas con una solicitud aprobada
- Transiciones de estado prohibidas (por ejemplo: aprobar una solicitud ya cancelada)
- Devolución inválida de una solicitud que no está aprobada
- Verificación de que el estado del equipo muta correctamente al aprobar y devolver

---

## Limitaciones conocidas

- **Persistencia en archivos JSON**: el sistema usa archivos `.json` como base de datos. No es apto para uso concurrente real; en escrituras simultáneas puede haber pérdida de datos.
- **Sin refresh token**: el JWT expira a las 2 horas y no hay mecanismo de renovación automática. El usuario deberá loguearse nuevamente cuando el token expire.
- **Sin paginación en equipos**: el endpoint `GET /api/equipos` devuelve todos los equipos sin paginar.
- **Sin endpoint de resumen/administración**: el panel de administración con métricas (solicitudes vencidas, equipos prestados, etc.) está definido en la arquitectura pero no está implementado en esta versión.
- **Ruta de detalle comentada en el frontend**: la ruta `/solicitudes/:id` está definida pero puede estar desactivada en `App.jsx` según la rama que se levante.
- **Variables de entorno**: la clave secreta JWT (`UTN_FRC_DDS_SECRET`) está hardcodeada en el código. En un entorno productivo debería moverse a un archivo `.env`.
- **Sin HTTPS**: el sistema corre en HTTP local. No usar en producción sin configurar HTTPS.

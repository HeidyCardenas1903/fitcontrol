# FitControl · Gimnasio Vital Fit

MVP de aplicación web para gestionar **afiliados, membresías (pagos y vencimientos) y reservas de clases grupales con control de cupo** del gimnasio ficticio *Gimnasio Vital Fit* (Bogotá).

Proyecto de la asignatura **Electiva – Desarrollo de aplicaciones web**, Corporación Universitaria Iberoamericana (2026).
Docente: Diana Marcela Toquica Rodríguez.

| Integrante | Responsabilidad | Carpeta |
|---|---|---|
| **Heidy Viviana Cardenas Soler** | Front-end: React, Hooks, Context API, Axios, rutas, estilos y pruebas de interfaz | [`frontend/`](frontend) |
| **Julián Emiro González Pérez** | Back-end: API REST con Node.js + Express, base de datos SQLite, Swagger, seguridad JWT, validaciones y pruebas | [`backend/`](backend) |

> Todos los datos son ficticios (Ley 1581 de 2012). No se usan datos personales reales.

## Arquitectura

```
Navegador (React + Axios)  ──HTTP/JSON──►  API REST (Node.js + Express)  ──SQL──►  SQLite
     frontend/                                 backend/  (/api/docs = Swagger)
```

- **Front-end** (`frontend/`): React 18 + Vite, React Router (rutas protegidas por rol), Context API + `useReducer` para la sesión, hooks `useState`, `useEffect`, `useContext`, `useReducer` y un hook propio `useApi`, peticiones con Axios (interceptores para el token JWT y los errores).
- **Back-end** (`backend/`): Express con rutas REST (`GET`, `POST`, `PUT`, `DELETE`), base de datos relacional SQLite (6 tablas), autenticación JWT con dos roles (`admin` y `afiliado`), validación de datos, manejo centralizado de errores (400, 401, 403, 404, 409, 422, 500) y documentación OpenAPI con **Swagger**.

## Funcionalidades del MVP

| Rol | Puede |
|---|---|
| Administrador | Ver el panel (vigentes, por vencer, vencidas), CRUD de afiliados, registrar pagos (calcula el vencimiento), crear clases y reservar para un afiliado |
| Afiliado | Ver el estado de su membresía y su historial, reservar y cancelar cupos en clases |

Reglas del negocio (validadas en el servidor): membresía *por vencer* a 7 días o menos; si se paga antes de vencer, el nuevo periodo empieza al terminar el actual; no se puede superar el cupo, reservar dos veces la misma clase ni reservar con la membresía vencida.

## Cómo ejecutarlo en local

Requisitos: **Node.js 20 o superior** y npm.

```bash
# 1) Back-end (terminal 1)
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev               # API en http://localhost:4000  ·  Swagger en http://localhost:4000/api/docs

# 2) Front-end (terminal 2)
cd frontend
npm install
cp .env.example .env
npm run dev               # App en http://localhost:5173
```

Usuarios de prueba:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@fitcontrol.test | Admin123* |
| Afiliado | laura@fitcontrol.test | Afiliado123* |

Para reiniciar la base de datos con los datos de prueba: `cd backend && npm run seed`.

## Pruebas

```bash
cd backend && npm test     # 11 pruebas: reglas del negocio (unitarias) y API (integración con supertest)
cd frontend && npm test    # 5 pruebas: componentes y reducer de sesión (Vitest + Testing Library)
```

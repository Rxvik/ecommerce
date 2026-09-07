# Fase 1 — Arquitectura Base del Backend E-Commerce

## Objetivo

Esta primera fase establece la base arquitectónica del proyecto.

El objetivo es contar con un backend:

- Modular.
- Escalable.
- Preparado para crecer.
- Separado por responsabilidades.
- Con rutas versionadas.
- Con manejo centralizado de configuración.
- Con logging.
- Con seguridad HTTP básica.
- Con manejo de errores.
- Preparado para integrar posteriormente Firestore, autenticación, productos, carrito y órdenes.

En esta fase **no se implementa todavía lógica de negocio real**.

---

# Stack utilizado

| Tecnología | Uso |
|---|---|
| JavaScript | Lenguaje principal |
| Node.js | Runtime del backend |
| npm | Gestor de dependencias |
| npm Workspaces | Administración del monorepo |
| Express | API HTTP / REST |
| dotenv | Variables de entorno |
| CORS | Control de acceso desde frontend |
| Helmet | Headers de seguridad |
| Pino | Logging estructurado |
| pino-http | Logging HTTP |
| pino-pretty | Logs legibles en desarrollo |
| Nodemon | Reinicio automático |
| ESLint | Calidad de código |
| Git | Control de versiones |

---

# Requisitos

Se recomienda utilizar:

```text
Node.js 24 LTS
npm
Git
Visual Studio Code
```

Validar instalaciones:

```bash
node --version
npm --version
git --version
```

Ejemplo esperado para Node:

```text
v24.x.x
```

---

# Arquitectura general

El proyecto utiliza un **monorepo**.

```text
ecommerce-platform/
│
├── apps/
│   └── api/
│
└── packages/
    ├── contracts/
    ├── config/
    └── shared/
```

## `apps`

Contiene aplicaciones ejecutables.

Actualmente:

```text
apps/api
```

Posteriormente podrán agregarse:

```text
apps/web
apps/admin
```

Por ejemplo:

```text
ecommerce-platform
│
├── apps
│   ├── api
│   ├── web
│   └── admin
│
└── packages
    ├── contracts
    ├── config
    └── shared
```

---

# ¿Qué es un monorepo?

Un monorepo permite administrar varios proyectos relacionados dentro de un mismo repositorio.

En este proyecto tendremos eventualmente:

```text
Frontend público
       │
       │
       ▼
   apps/web

Panel administrativo
       │
       ▼
   apps/admin

Backend
       │
       ▼
   apps/api
```

Compartiendo componentes comunes desde:

```text
packages/
```

---

# npm Workspaces

El monorepo utiliza **npm Workspaces**.

Los workspaces permiten manejar varias aplicaciones y paquetes desde el `package.json` principal.

Configuración:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

Esto permite ejecutar comandos desde la raíz.

Por ejemplo:

```bash
npm run dev
```

aunque la aplicación realmente se encuentre en:

```text
apps/api
```

---

# Orden de creación del proyecto

## 1. Crear proyecto

```bash
mkdir ecommerce-platform
cd ecommerce-platform
```

---

## 2. Inicializar Git

```bash
git init
```

---

## 3. Inicializar npm

```bash
npm init -y
```

---

## 4. Crear workspace del backend

```bash
npm init -w apps/api -y
```

---

## 5. Crear paquetes compartidos

```bash
npm init -w packages/contracts -y
```

```bash
npm init -w packages/config -y
```

```bash
npm init -w packages/shared -y
```

---

# Instalación de paquetes

Los paquetes deben instalarse dentro del workspace:

```text
@ecommerce/api
```

---

# Dependencias de producción

Ejecutar desde la raíz:

```bash
npm install express dotenv cors helmet pino pino-http --workspace=@ecommerce/api
```

---

# Dependencias de desarrollo

```bash
npm install -D nodemon eslint @eslint/js globals pino-pretty --workspace=@ecommerce/api
```

---

# Explicación de paquetes

## Express

```text
express
```

Framework utilizado para construir la API HTTP.

Permite trabajar con:

- Rutas.
- Middlewares.
- Request.
- Response.
- APIs REST.

Ejemplo:

```javascript
router.get('/products', controller)
```

En nuestra arquitectura:

```text
HTTP Request
     │
     ▼
Express
     │
     ▼
Router
     │
     ▼
Controller
```

---

# dotenv

```text
dotenv
```

Carga variables desde un archivo:

```text
.env
```

Ejemplo:

```env
PORT=4000
```

Después puede utilizarse desde Node:

```javascript
process.env.PORT
```

El objetivo es evitar configuraciones escritas directamente dentro del código.

No hacer:

```javascript
const port = 4000
```

Preferir configuración externa:

```env
PORT=4000
```

---

# CORS

```text
cors
```

CORS significa:

```text
Cross-Origin Resource Sharing
```

Controla qué aplicaciones frontend pueden consumir nuestra API desde un navegador.

Ejemplo futuro:

```text
Nuxt
localhost:3000
     │
     ▼
   CORS
     │
     ▼
Node.js
localhost:4000
```

Configuración inicial:

```env
CORS_ORIGIN=http://localhost:3000
```

---

# Helmet

```text
helmet
```

Agrega headers HTTP orientados a mejorar la seguridad de la aplicación.

Se registra como middleware:

```javascript
app.use(
  helmet()
)
```

Conceptualmente:

```text
Request
   │
   ▼
Helmet
   │
   ▼
Application
```

---

# Pino

```text
pino
```

Sistema de logging estructurado.

En lugar de depender únicamente de:

```javascript
console.log()
```

utilizamos:

```javascript
logger.info(
  {
    port: 4000
  },
  'Server started'
)
```

Esto será útil posteriormente para:

- Errores.
- Auditoría.
- Diagnóstico.
- Producción.
- Render.
- Seguimiento de peticiones.

---

# pino-http

```text
pino-http
```

Integra Pino con las solicitudes HTTP.

Puede registrar información como:

```text
HTTP Method
URL
Status Code
Response Time
Request ID
```

Ejemplo:

```text
GET /api/v1/health
200
15 ms
```

---

# pino-pretty

```text
pino-pretty
```

Transforma los logs estructurados de Pino en información más legible durante desarrollo.

Se utiliza solamente como dependencia de desarrollo.

Producción puede utilizar:

```json
{
  "level": 30,
  "msg": "Server started"
}
```

Mientras desarrollo puede mostrarlo en un formato más fácil de leer.

---

# Nodemon

```text
nodemon
```

Reinicia automáticamente la aplicación cuando detecta cambios.

Sin Nodemon:

```bash
node src/server.js
```

Después de modificar código tendríamos que reiniciar manualmente.

Con Nodemon:

```bash
nodemon src/server.js
```

el ciclo es:

```text
Modificar archivo
      │
      ▼
   Nodemon
      │
      ▼
Reiniciar Node
```

---

# ESLint

```text
eslint
```

Analiza estáticamente nuestro JavaScript.

Nos ayuda a detectar:

- Variables sin utilizar.
- Errores comunes.
- Código inconsistente.
- Problemas antes de ejecutar la aplicación.

Ejecutar:

```bash
npm run lint
```

---

# @eslint/js

```text
@eslint/js
```

Proporciona configuraciones base oficiales de JavaScript para ESLint.

---

# globals

```text
globals
```

Permite informar a ESLint qué variables existen automáticamente dentro de Node.js.

Ejemplos:

```text
process
Buffer
setTimeout
console
```

---

# Módulos nativos de Node.js

Durante esta fase también usamos:

```javascript
node:path
node:url
node:crypto
```

Estos módulos **no se instalan con npm**.

Ya vienen incluidos con Node.js.

Por ejemplo:

```javascript
import path from 'node:path'
```

No debemos ejecutar:

```bash
npm install path
```

También:

```javascript
import {
  randomUUID
} from 'node:crypto'
```

No necesita:

```bash
npm install crypto
```

---

# Estructura del backend

Al terminar la fase 1:

```text
apps/api/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.js
│   │   └── logger.js
│   │
│   ├── modules/
│   │   └── health/
│   │       ├── health.controller.js
│   │       └── health.routes.js
│   │
│   ├── routes/
│   │   └── index.js
│   │
│   ├── shared/
│   │   └── middleware/
│   │       ├── error.middleware.js
│   │       └── not-found.middleware.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── .env.example
├── eslint.config.js
└── package.json
```

---

# Responsabilidad de cada carpeta

## config

```text
src/config/
```

Contiene configuración global.

Actualmente:

```text
env.js
logger.js
```

Posteriormente puede contener:

```text
firebase.js
database.js
security.js
```

---

# modules

```text
src/modules/
```

Contiene funcionalidades de negocio aisladas.

Actualmente:

```text
health
```

Posteriormente:

```text
auth
users
roles
permissions
products
categories
cart
orders
```

---

# routes

```text
src/routes/
```

Centraliza las rutas principales de la API.

Ejemplo:

```text
/api/v1
   │
   ├── /health
   ├── /products
   ├── /auth
   └── /orders
```

---

# shared

```text
src/shared/
```

Contiene infraestructura que puede ser utilizada por diferentes módulos.

Ejemplos futuros:

```text
middleware
errors
utils
security
http
```

---

# app.js

```text
src/app.js
```

Configura la aplicación Express.

Responsabilidades:

```text
Express
Middleware
Helmet
CORS
JSON Parser
HTTP Logging
Routes
404
Error Handler
```

No debe iniciar el servidor.

---

# server.js

```text
src/server.js
```

Tiene como responsabilidad iniciar el servidor HTTP.

Conceptualmente:

```text
app.js
  │
  ▼
Express Application
  │
  ▼
server.js
  │
  ▼
HTTP Server
```

Esta separación permitirá probar posteriormente:

```javascript
import { app } from './app.js'
```

sin iniciar directamente un puerto HTTP.

---

# Arquitectura interna

El flujo actual es:

```text
HTTP REQUEST

     │
     ▼

 server.js

     │
     ▼

   app.js

     │
     ├── Request ID
     ├── Logger
     ├── Helmet
     ├── CORS
     └── JSON

     │
     ▼

routes/index.js

     │
     ▼

health.routes.js

     │
     ▼

health.controller.js

     │
     ▼

HTTP RESPONSE
```

---

# API versionada

La API utiliza el prefijo:

```text
/api/v1
```

Definido mediante:

```env
API_PREFIX=/api/v1
```

Esto permite evolucionar posteriormente:

```text
/api/v1
/api/v2
```

sin romper aplicaciones existentes.

---

# Primer endpoint

Endpoint:

```http
GET /api/v1/health
```

URL local:

```text
http://localhost:4000/api/v1/health
```

Ejemplo de respuesta:

```json
{
  "success": true,
  "data": {
    "service": "ecommerce-api",
    "status": "ok",
    "environment": "development",
    "uptime": 15.5,
    "timestamp": "2026-08-13T22:00:00.000Z"
  },
  "meta": {
    "requestId": "..."
  }
}
```

---

# Health Check

El módulo:

```text
health
```

permite comprobar si nuestro backend está ejecutándose correctamente.

Más adelante puede utilizarse para:

- Render.
- Docker.
- Kubernetes.
- Monitoreo.
- Balanceadores.
- CI/CD.

---

# Request ID

Cada solicitud HTTP recibe un identificador único.

Ejemplo:

```text
x-request-id:
550e8400-e29b-41d4-a716-446655440000
```

Esto permite correlacionar:

```text
Request
   │
   ▼
Logs
   │
   ▼
Error
```

y localizar exactamente qué petición generó un problema.

---

# Variables de entorno

Archivo local:

```text
apps/api/.env
```

Ejemplo:

```env
NODE_ENV=development

PORT=4000

API_PREFIX=/api/v1

CORS_ORIGIN=http://localhost:3000

LOG_LEVEL=debug
```

Este archivo **NO debe almacenarse en Git**.

---

# .env.example

El archivo:

```text
.env.example
```

sí se almacena en Git.

Sirve como plantilla.

Un nuevo desarrollador puede ejecutar:

```bash
cp apps/api/.env.example apps/api/.env
```

y posteriormente agregar sus valores locales.

---

# Comandos principales

## Instalar dependencias

Desde la raíz:

```bash
npm install
```

---

## Desarrollo

```bash
npm run dev
```

Ejecuta internamente:

```text
nodemon src/server.js
```

---

## Ejecución normal

```bash
npm start
```

Ejecuta:

```text
node src/server.js
```

---

## Validar código

```bash
npm run lint
```

---

# Probar API

## Navegador

```text
http://localhost:4000/api/v1/health
```

---

## curl

```bash
curl http://localhost:4000/api/v1/health
```

---

# Probar ruta inexistente

```bash
curl http://localhost:4000/api/v1/test
```

Respuesta esperada:

```json
{
  "success": false,
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Route GET /api/v1/test not found"
  },
  "meta": {
    "requestId": "..."
  }
}
```

---

# Manejo de errores

El backend utiliza middleware global para evitar que cada módulo implemente sus errores de manera diferente.

Arquitectura:

```text
Controller
   │
   │ error
   ▼
Error Middleware
   │
   ▼
Standard Response
```

Esto evolucionará posteriormente para manejar:

```text
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
BusinessRuleError
```

---

# Estructura estándar de respuesta

## Respuesta exitosa

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

---

## Respuesta con error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  },
  "meta": {
    "requestId": "..."
  }
}
```

La idea es mantener consistencia en toda la API.

---

# Git

Una vez completada la fase:

```bash
git status
```

Agregar:

```bash
git add .
```

Crear commit:

```bash
git commit -m "chore: initialize ecommerce backend monorepo"
```

---

# Rama develop

Crear:

```bash
git switch -c develop
```

Arquitectura inicial:

```text
main
 │
 └── develop
```

Posteriormente:

```text
main
 │
 └── develop
       │
       ├── feature/products
       ├── feature/auth
       ├── feature/rbac
       ├── feature/cart
       └── feature/orders
```

---

# Qué NO se implementa en Fase 1

Todavía no existe:

```text
Database
Firebase
Firestore

Authentication
JWT

Users
Roles
Permissions

Products
Categories

Cart
Orders

Payments
```

Esto es intencional.

La Fase 1 solamente crea una base estable sobre la cual construir el sistema.

---

# Resultado de la Fase 1

Al finalizar debemos tener:

```text
Node.js
   │
   ▼
Express
   │
   ├── Environment
   ├── Logging
   ├── Helmet
   ├── CORS
   ├── Request ID
   ├── JSON Parser
   ├── Router
   ├── 404 Handler
   └── Error Handler
         │
         ▼
      /api/v1
         │
         ▼
       health
```

El siguiente paso será incorporar nuestro primer módulo real de negocio.

---

# Siguiente fase

## Fase 2 — Products

Se agregará:

```text
modules/
│
├── health/
│
└── products/
    ├── product.routes.js
    ├── product.controller.js
    ├── product.service.js
    ├── product.repository.js
    └── product.schema.js
```

El flujo evolucionará a:

```text
HTTP
 │
 ▼
Route
 │
 ▼
Validation
 │
 ▼
Controller
 │
 ▼
Service
 │
 ▼
Repository
 │
 ▼
Database
```

En esta fase se introducirán conceptos como:

```text
Zod
Repository Pattern
Service Layer
CRUD
Business Logic
Firestore
Firebase Admin SDK
```

---

# Checklist de validación

Antes de continuar con la siguiente fase:

- [ ] Node.js instalado.
- [ ] npm funcionando.
- [ ] Git instalado.
- [ ] Monorepo creado.
- [ ] `apps/api` creado.
- [ ] Workspaces configurados.
- [ ] Dependencias instaladas.
- [ ] `.env` configurado.
- [ ] `.env` ignorado por Git.
- [ ] ESLint funcionando.
- [ ] Backend inicia con `npm run dev`.
- [ ] `/api/v1/health` responde HTTP 200.
- [ ] Ruta inexistente responde HTTP 404.
- [ ] Se genera `requestId`.
- [ ] Logs aparecen correctamente.
- [ ] Primer commit realizado.
- [ ] Rama `develop` creada.

## Comando final de validación

```bash
npm install
npm run lint
npm run dev
```

En otra Terminal:

```bash
curl http://localhost:4000/api/v1/health
```

Si el endpoint responde correctamente, la **Fase 1 está terminada y el proyecto está listo para evolucionar hacia la Fase 2**.
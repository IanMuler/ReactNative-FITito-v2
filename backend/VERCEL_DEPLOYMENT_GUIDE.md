# Guía Completa: Deployment de Backend Express + TypeScript en Vercel con Neon PostgreSQL

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Requisitos Previos](#requisitos-previos)
3. [Contexto del Problema](#contexto-del-problema)
4. [Secuencia de Migración Paso a Paso](#secuencia-de-migración-paso-a-paso)
5. [Problemas Encontrados y Soluciones](#problemas-encontrados-y-soluciones)
6. [Configuración Final](#configuración-final)
7. [Verificación y Testing](#verificación-y-testing)
8. [Notas Importantes y Mejores Prácticas](#notas-importantes-y-mejores-prácticas)

---

## Introducción

Este documento detalla el proceso completo de migración de un backend Express con TypeScript desde un entorno tradicional con PostgreSQL local a un deployment serverless en Vercel usando Neon PostgreSQL.

### Objetivo
Deployar un backend Express + TypeScript en Vercel que:
- Use Neon PostgreSQL como base de datos serverless
- Soporte path aliases de TypeScript (`@/...`)
- Funcione como función serverless sin estado persistente
- Mantenga compatibilidad con el código existente

### Stack Tecnológico
- **Backend**: Express.js 4.21.2 con TypeScript 5.3.3
- **Base de datos**: Neon PostgreSQL (serverless)
- **Platform**: Vercel (serverless functions)
- **Driver**: `@neondatabase/serverless` (compatible con `pg`)
- **Build tools**: `tsc` + `tsc-alias`

---

## Requisitos Previos

### Cuentas y Servicios
1. **Vercel Account**: [https://vercel.com](https://vercel.com)
2. **Neon Account**: [https://neon.tech](https://neon.tech)
3. **Vercel CLI instalado**:
   ```bash
   npm install -g vercel
   ```

### Base de Datos Neon
- Proyecto creado en Neon
- Base de datos con schema migrado
- Connection string con el formato:
  ```
  postgresql://USER:PASSWORD@HOST.c-2.REGION.aws.neon.tech/DATABASE?sslmode=require&channel_binding=require
  ```

  **IMPORTANTE**: El `.c-2` en el hostname indica el compute endpoint específico y es crítico para la conexión.

### Proyecto Base
- Backend Express con TypeScript
- Estructura de carpetas organizada con Clean Architecture
- TypeScript configurado con path aliases (`@/*`)

---

## Contexto del Problema

### Diferencias: Servidor Tradicional vs Serverless

| Aspecto | Servidor Tradicional | Serverless (Vercel) |
|---------|---------------------|---------------------|
| **Conexiones DB** | Pool persistente, múltiples conexiones | 1 conexión por función, efímera |
| **Estado** | Servidor mantiene estado entre requests | Stateless, cada request es independiente |
| **Process Handlers** | SIGTERM/SIGINT para graceful shutdown | No soportados, no hay proceso persistente |
| **Build** | Puede ejecutarse en runtime | Debe estar pre-compilado |
| **Path Aliases** | Resueltos en runtime con tsconfig-paths | Deben resolverse en build time |

### Principales Desafíos

1. **Driver de Base de Datos**: El driver `pg` estándar no está optimizado para serverless
2. **Connection Pooling**: Pools persistentes no funcionan en funciones efímeras
3. **TypeScript Path Aliases**: Los `@/...` imports no se resuelven automáticamente
4. **Entry Point**: Vercel necesita un wrapper específico para Express
5. **Environment Variables**: Deben configurarse en Vercel dashboard/CLI

---

## Secuencia de Migración Paso a Paso

### Paso 1: Migrar de `pg` a `@neondatabase/serverless`

#### 1.1. Desinstalar `pg` e instalar Neon driver

```bash
npm uninstall pg @types/pg
npm install @neondatabase/serverless
```

#### 1.2. Actualizar `package.json`

```json
{
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    // ... otras dependencias
  }
}
```

**Razón**: `@neondatabase/serverless` está optimizado para entornos serverless y usa WebSockets sobre HTTP para conexiones eficientes.

---

### Paso 2: Reescribir Configuración de Base de Datos

#### 2.1. Modificar `src/config/database.ts`

**ANTES** (con `pg`):
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
});
```

**DESPUÉS** (con `@neondatabase/serverless`):
```typescript
import { Pool } from '@neondatabase/serverless';

const isProduction = process.env['NODE_ENV'] === 'production';
const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

export const pool = new Pool({
  connectionString,
  max: isProduction ? 1 : 10,              // ¡CRÍTICO! Max 1 en producción
  idleTimeoutMillis: isProduction ? 0 : 30000,
  connectionTimeoutMillis: 5000,
});

export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> => {
  const result = await pool.query(text, params);
  return result as { rows: T[]; rowCount: number };
};

export const getClient = () => pool.connect();

export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
```

**Cambios clave**:
- ✅ Usar `DATABASE_URL` en lugar de parámetros individuales
- ✅ `max: 1` en producción (serverless functions)
- ✅ `idleTimeoutMillis: 0` en producción (no mantener idle connections)
- ✅ Mantener API compatible con `pg` (`.query()`, `.connect()`)

---

### Paso 3: Actualizar Repositories

#### 3.1. Verificar acceso a `.rows`

El driver Neon devuelve resultados en el mismo formato que `pg`, pero asegúrate de acceder siempre a `.rows`:

```typescript
// ✅ CORRECTO
const result = await client.query('SELECT * FROM exercises');
const exercises = result.rows; // Array de resultados
const count = result.rowCount; // Número de filas

// ❌ INCORRECTO
const exercises = result; // Esto es un objeto, no un array
```

#### 3.2. Actualizar BaseRepository si es necesario

```typescript
import { query, transaction } from '@/config/database';

type DbClient = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
};

export abstract class BaseRepository<T> {
  protected async executeQuery<R = T>(
    queryText: string,
    params?: any[]
  ): Promise<{ rows: R[]; rowCount: number }> {
    return await query<R>(queryText, params);
  }

  protected async executeTransaction<R>(
    callback: (client: DbClient) => Promise<R>
  ): Promise<R> {
    return await transaction(callback);
  }
}
```

---

### Paso 4: Resolver TypeScript Path Aliases

#### 4.1. Instalar `tsc-alias`

```bash
npm install --save-dev tsc-alias
```

**Razón**: TypeScript compila `@/controllers/...` a `@/controllers/...` en JavaScript, pero Node.js no sabe cómo resolver estos paths. `tsc-alias` los convierte a paths relativos (`../controllers/...`).

#### 4.2. Crear `tsconfig-alias.json` (opcional)

```json
{
  "resolveFullPaths": true,
  "silent": false,
  "verbose": true
}
```

#### 4.3. Actualizar scripts en `package.json`

```json
{
  "scripts": {
    "build": "tsc && tsc-alias -p tsconfig.json",
    "vercel-build": "tsc && tsc-alias -p tsconfig.json"
  }
}
```

**Flujo de build**:
1. `tsc` compila TypeScript → JavaScript (con `@/...` sin resolver)
2. `tsc-alias` reemplaza `@/...` → `../...` (paths relativos)

---

### Paso 5: Configurar Entry Point para Vercel

#### 5.1. Crear `api/index.js`

Vercel busca funciones serverless en el directorio `/api`. Crear:

```javascript
// api/index.js
// Import the compiled Express app from dist
const app = require('../dist/src/app').default;

// Export for Vercel serverless
module.exports = app;
```

**¿Por qué JavaScript y no TypeScript?**
- Este archivo se ejecuta DESPUÉS del build
- Debe importar desde `/dist` (código compilado)
- No necesita compilación adicional

#### 5.2. Remover Process Handlers de `src/app.ts`

**ELIMINAR** estos handlers (no funcionan en serverless):

```typescript
// ❌ REMOVER - No funciona en serverless
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});
```

**Razón**: En serverless no hay un proceso persistente que escuche estas señales. Vercel maneja el ciclo de vida de las funciones automáticamente.

---

### Paso 6: Configurar `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "buildCommand": "echo 'Using pre-built dist folder'",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

**Explicación**:
- `buildCommand`: Mensaje informativo (el build ya se hizo en `vercel-build`)
- `outputDirectory`: Vercel sabe dónde está el código compilado
- `rewrites`: Todas las requests (`/(.*)`) se enrutan a `/api/index.js`

---

### Paso 7: Configurar `.vercelignore`

```
# Dependencies
node_modules

# Development files
.env
.env.example

# Testing
*.test.ts
*.spec.ts
__tests__
coverage

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode
.idea

# Database export files
database/export

# Documentation
README.md
```

**IMPORTANTE**:
- ❌ **NO** ignorar `/dist` - Vercel lo necesita
- ✅ Ignorar archivos de desarrollo y tests

---

### Paso 8: Configurar Variables de Entorno en Vercel

#### 8.1. Obtener Connection String de Neon

En tu dashboard de Neon, copia la connection string. **Debe tener este formato**:

```
postgresql://USER:PASSWORD@HOST.c-2.REGION.aws.neon.tech/DATABASE?sslmode=require&channel_binding=require
```

**CRÍTICO**:
- ✅ Debe incluir `.c-2` en el hostname (compute endpoint)
- ✅ Debe tener `?sslmode=require&channel_binding=require`
- ❌ NO usar la versión sin pooler si usas `Pool` de Neon

#### 8.2. Configurar en Vercel

**Opción A - Via CLI**:
```bash
echo "postgresql://USER:PASSWORD@HOST.c-2.REGION.aws.neon.tech/DATABASE?sslmode=require&channel_binding=require" | vercel env add DATABASE_URL production
```

**Opción B - Via Dashboard**:
1. Ir a Vercel Project → Settings → Environment Variables
2. Agregar `DATABASE_URL` para `Production`
3. Pegar la connection string completa

#### 8.3. Agregar otras variables si es necesario

```bash
echo "production" | vercel env add NODE_ENV production
```

---

### Paso 9: Deploy a Vercel

#### 9.1. Login en Vercel

```bash
vercel login
```

#### 9.2. Link al proyecto (primera vez)

```bash
vercel link --project fitito-backend --yes
```

#### 9.3. Build local

```bash
npm run build
```

Verifica que:
- ✅ `/dist` se crea correctamente
- ✅ No hay errores de TypeScript
- ✅ Los path aliases se resolvieron (verificar imports en `/dist`)

```bash
# Verificar que no hay imports con @/
grep -r "@/" dist/src/ || echo "✅ Path aliases resueltos correctamente"
```

#### 9.4. Deploy a producción

```bash
vercel --prod --yes
```

Esperar a que complete:
```
✓ Building
✓ Queued
✓ Building
✓ Completing
```

Recibirás una URL como:
```
https://fitito-backend-xxxxx.vercel.app
```

---

## Problemas Encontrados y Soluciones

### Problema 1: `FUNCTION_INVOCATION_FAILED`

**Error**:
```
A server error has occurred
FUNCTION_INVOCATION_FAILED
```

**Causa raíz**: Múltiples posibles causas:
1. Driver `pg` estándar (no optimizado para serverless)
2. Connection string incorrecta
3. Path aliases sin resolver
4. Process handlers en el código

**Solución**:
1. ✅ Migrar a `@neondatabase/serverless`
2. ✅ Usar connection string con `.c-2` y parámetros de seguridad
3. ✅ Configurar `tsc-alias` en el build
4. ✅ Remover `process.on('SIGTERM/SIGINT')`

---

### Problema 2: `Cannot find module '@/controllers/HealthController'`

**Error completo**:
```
Error: Cannot find module '@/controllers/HealthController'
Require stack:
- /var/task/src/routes/healthRoutes.js
```

**Causa**: Los path aliases de TypeScript (`@/*`) no se resolvieron en el JavaScript compilado.

**Diagnóstico**:
```bash
cat dist/src/routes/healthRoutes.js | grep "@/"
# Si hay resultados, los aliases NO se resolvieron
```

**Solución**:
```bash
# 1. Instalar tsc-alias
npm install --save-dev tsc-alias

# 2. Actualizar package.json
{
  "scripts": {
    "build": "tsc && tsc-alias -p tsconfig.json"
  }
}

# 3. Rebuild
npm run build

# 4. Verificar
grep -r "@/" dist/src/ || echo "✅ Resueltos"
```

---

### Problema 3: `password authentication failed for user 'xxx'`

**Error**:
```
error: password authentication failed for user 'neondb_owner'
```

**Causa**: Connection string incorrecta o incompleta.

**Diagnóstico**:
```bash
# Verificar variables de entorno en Vercel
vercel env ls

# Pull para revisar localmente
vercel env pull .env.vercel
cat .env.vercel | grep DATABASE_URL
```

**Soluciones probadas**:

❌ **NO funcionó**:
```
postgresql://USER:PASSWORD@HOST.us-east-1.aws.neon.tech/DATABASE
```

❌ **NO funcionó** (sin `.c-2`):
```
postgresql://USER:PASSWORD@HOST.us-east-1.aws.neon.tech/DATABASE?sslmode=require
```

✅ **SÍ funcionó**:
```
postgresql://USER:PASSWORD@HOST.c-2.us-east-1.aws.neon.tech/DATABASE?sslmode=require&channel_binding=require
```

**Elementos críticos**:
1. `.c-2` en el hostname (compute endpoint específico)
2. `?sslmode=require` (SSL obligatorio)
3. `&channel_binding=require` (seguridad adicional)

---

### Problema 4: Build errors con `api/index.ts`

**Error**:
```
error TS5055: Cannot write file '/dist/src/app.d.ts' because it would overwrite input file.
```

**Causa**: TypeScript intenta compilar `api/index.ts` que importa desde `../src/app`, causando conflictos.

**Solución**: Usar JavaScript en lugar de TypeScript para el entry point:

```javascript
// api/index.js (JavaScript, no TypeScript)
const app = require('../dist/src/app').default;
module.exports = app;
```

**Razón**: El entry point solo necesita reexportar el app compilado, no necesita compilación propia.

---

### Problema 5: Empty responses `{}`

**Síntoma**: Todos los endpoints devuelven `{}` vacío con HTTP 200.

**Causa**: Routing incorrecto - Vercel no está ejecutando las rutas de Express.

**Solución**: Configurar `rewrites` en `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

Esto asegura que todas las requests se enruten al entry point de Express.

---

## Configuración Final

### Estructura de Archivos

```
backend/
├── api/
│   └── index.js              # Vercel serverless entry point
├── src/
│   ├── app.ts                # Express app (sin process handlers)
│   ├── server.ts             # Local dev server
│   ├── config/
│   │   └── database.ts       # Neon Pool configuration
│   ├── controllers/
│   ├── routes/
│   ├── repositories/
│   └── ...
├── dist/                     # Compiled JavaScript (incluir en deploy)
├── package.json
├── tsconfig.json
├── tsconfig-alias.json
├── vercel.json
└── .vercelignore
```

---

### `package.json` - Scripts y Dependencies

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node -r tsconfig-paths/register src/server.ts",
    "build": "tsc && tsc-alias -p tsconfig.json",
    "vercel-build": "tsc && tsc-alias -p tsconfig.json",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "helmet": "^7.2.0",
    "morgan": "^1.10.1",
    "dotenv": "^16.6.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@vercel/node": "^5.3.24",
    "tsc-alias": "^1.8.16",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.3.3",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2"
  }
}
```

---

### `tsconfig.json` - TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@/controllers/*": ["src/controllers/*"],
      "@/services/*": ["src/services/*"],
      "@/repositories/*": ["src/repositories/*"],
      "@/config/*": ["src/config/*"],
      "@/types/*": ["src/types/*"]
    },
    "outDir": "./dist",
    "rootDir": "./",
    "removeComments": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/**/*",
    "api/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

---

### `vercel.json` - Vercel Configuration

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "buildCommand": "echo 'Using pre-built dist folder'",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

---

### `api/index.js` - Serverless Entry Point

```javascript
// Import the compiled Express app from dist
const app = require('../dist/src/app').default;

// Export for Vercel serverless
module.exports = app;
```

---

### `src/config/database.ts` - Database Configuration

```typescript
import { Pool } from '@neondatabase/serverless';

const isProduction = process.env['NODE_ENV'] === 'production';
const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

export const pool = new Pool({
  connectionString,
  max: isProduction ? 1 : 10,
  idleTimeoutMillis: isProduction ? 0 : 30000,
  connectionTimeoutMillis: 5000,
});

export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> => {
  const result = await pool.query(text, params);
  return result as { rows: T[]; rowCount: number };
};

export const getClient = () => pool.connect();

export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
```

---

### `src/app.ts` - Express Application

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(apiRoutes);

// Error handler
app.use(errorHandler);

export default app;

// IMPORTANTE: NO incluir process.on('SIGTERM') ni process.on('SIGINT')
// Estos no funcionan en entornos serverless
```

---

## Verificación y Testing

### Test 1: Health Check

```bash
curl https://TU-DEPLOYMENT-URL.vercel.app/health
```

**Respuesta esperada**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-03T01:54:58.204Z",
    "version": "1.0.0",
    "uptime": 44,
    "environment": "production"
  }
}
```

---

### Test 2: Endpoint con Database Query

```bash
curl 'https://TU-DEPLOYMENT-URL.vercel.app/api/v1/exercises?profile_id=1'
```

**Respuesta esperada**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Exercise Name",
      "image": "...",
      "created_at": "2025-09-29T01:59:52.008Z"
    }
    // ... más ejercicios
  ]
}
```

---

### Test 3: Verificar Logs en Vercel

```bash
vercel logs https://TU-DEPLOYMENT-URL.vercel.app
```

O en el dashboard: `https://vercel.com/tu-usuario/tu-proyecto/deployments`

---

### Test 4: Verificar Variables de Entorno

```bash
vercel env ls
```

**Debe mostrar**:
```
DATABASE_URL    Encrypted    Production    7m ago
NODE_ENV        Encrypted    Production    46m ago
```

---

### Test 5: Test Local antes de Deploy

```bash
# 1. Build
npm run build

# 2. Verificar que no hay errores
echo $?  # Debe ser 0

# 3. Verificar path aliases resueltos
grep -r "@/" dist/src/ || echo "✅ Path aliases OK"

# 4. Test local con DATABASE_URL
export DATABASE_URL="tu-connection-string"
export NODE_ENV="production"
node dist/server.js
```

---

## Notas Importantes y Mejores Prácticas

### 1. Connection Pooling en Serverless

**Configuración crítica**:
```typescript
max: isProduction ? 1 : 10
```

**¿Por qué max 1 en producción?**
- Cada función serverless es efímera e independiente
- Múltiples conexiones en una función no mejoran performance
- Neon maneja pooling a nivel de servidor con PgBouncer
- Evita "too many connections" errors

---

### 2. DATABASE_URL: Formato Crítico

**✅ CORRECTO**:
```
postgresql://USER:PASSWORD@HOST.c-2.REGION.aws.neon.tech/DB?sslmode=require&channel_binding=require
```

**Elementos obligatorios**:
- ✅ `.c-2` en hostname (compute endpoint)
- ✅ `?sslmode=require` (SSL)
- ✅ `&channel_binding=require` (seguridad)

**❌ INCORRECTO** (faltan parámetros):
```
postgresql://USER:PASSWORD@HOST.us-east-1.aws.neon.tech/DB
```

---

### 3. Build Process

**Orden correcto**:
```bash
tsc && tsc-alias -p tsconfig.json
```

**¿Por qué en este orden?**
1. `tsc` compila TypeScript → JavaScript
2. `tsc-alias` transforma `@/` → `../` en archivos `.js`

**Si inviertes el orden, no funciona**.

---

### 4. Debugging en Producción

**Agregar error handler con detalles**:
```typescript
// src/middleware/errorHandler.ts
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack
    })
  });
};
```

**Ver logs en tiempo real**:
```bash
vercel logs https://TU-URL.vercel.app --follow
```

---

### 5. Cache Busting

Si cambias código pero Vercel sigue sirviendo versión vieja:

```bash
# Forzar nuevo deployment
vercel --prod --force
```

O agregar al error handler en `api/index.js`:
```javascript
const app = require('../dist/src/app').default;

// Wrapper para debug
module.exports = async (req, res) => {
  try {
    return app(req, res);
  } catch (error) {
    console.error('Error loading app:', error);
    return res.status(500).json({
      error: 'Failed to load application',
      message: error.message,
      stack: error.stack
    });
  }
};
```

---

### 6. Local Development vs Production

**Mantener dos configuraciones**:

```typescript
// src/config/database.ts
const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString,
  max: isProduction ? 1 : 10,              // 1 en prod, 10 en dev
  idleTimeoutMillis: isProduction ? 0 : 30000,  // 0 en prod
  connectionTimeoutMillis: 5000,
});
```

**Development**: `npm run dev`
- Usa `ts-node` con `tsconfig-paths`
- Pool con múltiples conexiones
- Hot reload con nodemon

**Production**: `vercel --prod`
- Usa código compilado en `/dist`
- Pool con 1 conexión
- Serverless functions

---

### 7. Seguridad

**Environment Variables**:
- ❌ NO commitear `.env` al repo
- ✅ Usar Vercel Environment Variables
- ✅ Agregar `.env` a `.gitignore`

**Database Credentials**:
- ✅ Usar `DATABASE_URL` completa (incluye password)
- ✅ Rotar passwords periódicamente en Neon
- ✅ Usar SSL/TLS siempre (`sslmode=require`)

**CORS**:
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
```

---

### 8. Monitoring y Observability

**Vercel Analytics** (opcional):
```bash
npm install @vercel/analytics
```

**Health Check Endpoint**:
```typescript
router.get('/health', async (req, res) => {
  try {
    // Test DB connection
    await pool.query('SELECT 1');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
    });
  }
});
```

---

### 9. Limits de Vercel

**Hobby Plan**:
- ✅ 100GB bandwidth/mes
- ✅ 100 deployments/día
- ✅ 10s execution limit (funciones serverless)
- ❌ No custom domains ilimitados

**Pro Plan**:
- ✅ 1TB bandwidth/mes
- ✅ 6000 deployments/día
- ✅ 60s execution limit
- ✅ Custom domains ilimitados

**Para queries largas** (>10s en Hobby):
- Optimizar queries
- Agregar índices en DB
- Considerar upgrade a Pro
- Implementar pagination

---

### 10. Rollback en Caso de Problemas

**Vercel mantiene historial de deployments**:

```bash
# Listar deployments
vercel list

# Promover deployment anterior a producción
vercel promote DEPLOYMENT_URL --prod
```

O desde dashboard: Deployments → Click en deployment anterior → Promote to Production

---

## Checklist Final

Antes de considerar el deployment completo, verifica:

- [ ] `@neondatabase/serverless` instalado
- [ ] `tsc-alias` instalado como devDependency
- [ ] `package.json` tiene `"vercel-build": "tsc && tsc-alias"`
- [ ] `DATABASE_URL` configurada en Vercel con formato completo
- [ ] `vercel.json` tiene `rewrites` configurados
- [ ] `api/index.js` existe y exporta el app
- [ ] `src/app.ts` NO tiene `process.on('SIGTERM/SIGINT')`
- [ ] `.vercelignore` NO ignora `/dist`
- [ ] Build local exitoso: `npm run build`
- [ ] Path aliases resueltos: `grep -r "@/" dist/src/ || echo OK`
- [ ] Health check funciona: `curl https://URL/health`
- [ ] Endpoint con DB funciona: `curl https://URL/api/v1/...`
- [ ] Logs verificados en Vercel dashboard

---

## Recursos Adicionales

- **Neon Docs**: [https://neon.tech/docs](https://neon.tech/docs)
- **Vercel Express Guide**: [https://vercel.com/guides/using-express-with-vercel](https://vercel.com/guides/using-express-with-vercel)
- **@neondatabase/serverless**: [https://github.com/neondatabase/serverless](https://github.com/neondatabase/serverless)
- **tsc-alias**: [https://www.npmjs.com/package/tsc-alias](https://www.npmjs.com/package/tsc-alias)

---

## Conclusión

Esta guía documenta el proceso completo de migración de un backend Express tradicional a Vercel serverless. Los puntos críticos son:

1. **Driver correcto**: `@neondatabase/serverless`
2. **Connection string completa**: Con `.c-2`, `sslmode` y `channel_binding`
3. **Pool configuration**: `max: 1` en producción
4. **Path aliases**: Resolver con `tsc-alias`
5. **Entry point**: `api/index.js` que importa desde `/dist`
6. **Sin process handlers**: Remover `SIGTERM/SIGINT`

Siguiendo estos pasos, tu backend Express funcionará perfectamente en Vercel con Neon PostgreSQL.

---

**Fecha de creación**: 3 de Octubre 2025
**Versión**: 1.0
**Autor**: Documentado desde migración real de FITito Backend

# Despliegue en Vercel - Guía Completa

## 📋 Prerequisitos

1. **Cuenta en Vercel**: Crear cuenta en [vercel.com](https://vercel.com)
2. **Base de datos PostgreSQL serverless**: Elegir una opción:
   - ✅ **Neon** (recomendado): [neon.tech](https://neon.tech) - PostgreSQL serverless
   - ✅ **Supabase**: [supabase.com](https://supabase.com) - PostgreSQL con pooling
   - ✅ **Vercel Postgres**: Integración nativa con Vercel

## 🚀 Deployment via CLI

### 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

### 2. Login a Vercel
```bash
vercel login
```

### 3. Deploy desde el directorio backend
```bash
cd backend
vercel deploy
```

### 4. Deploy a producción
```bash
vercel --prod
```

## 🔗 Deployment via Git (Recomendado)

### 1. Push a GitHub
```bash
git add .
git commit -m "feat: prepare backend for Vercel deployment"
git push origin main
```

### 2. Conectar repositorio en Vercel:
1. Ir a [vercel.com/new](https://vercel.com/new)
2. Seleccionar tu repositorio
3. Configurar:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist`

## ⚙️ Variables de Entorno en Vercel

Configurar en el dashboard de Vercel (Settings → Environment Variables):

### Base de datos
```bash
DB_HOST=<tu-host-postgresql>
DB_PORT=5432
DB_NAME=<nombre-base-datos>
DB_USER=<usuario>
DB_PASSWORD=<contraseña>
```

### Otras variables
```bash
NODE_ENV=production
```

## 🗄️ Configurar Base de Datos

### Opción 1: Neon (Recomendado)
1. Crear proyecto en [neon.tech](https://neon.tech)
2. Copiar connection string
3. Usar en variables de entorno:
   ```
   DB_HOST=ep-xxx.neon.tech
   DB_PORT=5432
   DB_NAME=neondb
   DB_USER=xxx
   DB_PASSWORD=xxx
   ```

### Opción 2: Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a Settings → Database
3. Copiar "Connection string" (modo Direct connection)
4. Configurar variables de entorno

### Opción 3: Vercel Postgres
```bash
# Ejecutar en el proyecto de Vercel
vercel postgres create
```

## 🔧 Ejecutar Migraciones

### Localmente antes de deploy:
```bash
# Conectarse a la base de datos de producción
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME>

# Ejecutar migraciones
\i database/migrations/001-initial-schema.sql
\i database/migrations/002-add-exercises.sql
# ... etc
```

### O usar script automatizado:
```bash
# TODO: Crear script de migración automática
npm run migrate:prod
```

## ✅ Verificar Deployment

### 1. Health Check
```bash
curl https://tu-app.vercel.app/health
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "FITito API is healthy",
  "timestamp": "2025-10-02T..."
}
```

### 2. Test de API
```bash
curl https://tu-app.vercel.app/api/v1/exercises
```

## 📝 Notas Importantes

### Limitaciones de Vercel Free Tier:
- ⏱️ **Timeout**: 10 segundos máximo por request
- 🔥 **Cold starts**: Primera request puede tardar 1-2 segundos
- 💾 **Memoria**: 1024 MB
- 🔗 **Conexiones DB**: Usar pool pequeño (max: 1-2 conexiones)

### Limitaciones Técnicas:
- ❌ **No WebSockets**: No soportado en serverless
- ❌ **No archivos persistentes**: No guardar archivos en filesystem
- ❌ **No procesos en background**: Solo request/response

### Optimizaciones:
- ✅ Pool de conexiones configurado para serverless (max: 1 en producción)
- ✅ SSL habilitado automáticamente en producción
- ✅ Timeout de conexión ajustado a 5 segundos

## 🐛 Troubleshooting

### Error: "Too many connections"
**Solución**: La base de datos está recibiendo demasiadas conexiones.
- Reducir `max` en pool config a 1
- Usar base de datos con connection pooling (Neon, Supabase)

### Error: "Function execution timed out"
**Solución**: La función tardó más de 10 segundos.
- Optimizar queries de base de datos
- Agregar índices en tablas
- Considerar upgrade a Vercel Pro (300s timeout)

### Error: "Module not found"
**Solución**: Dependencias no instaladas.
- Verificar que todas las deps estén en `dependencies` (no `devDependencies`)
- Ejecutar `npm install` localmente y verificar

## 🔄 Actualizar Deployment

### Via CLI:
```bash
vercel --prod
```

### Via Git:
```bash
git push origin main
# Vercel detectará el push y desplegará automáticamente
```

## 📊 Monitoreo

### Logs en Vercel:
1. Ir al proyecto en Vercel Dashboard
2. Click en "Deployments"
3. Seleccionar deployment
4. Ver logs en "Functions" tab

### Métricas:
- Ver requests, errores, latencia en Dashboard
- Configurar alertas en Settings → Notifications

## 🔐 Seguridad

### Variables de entorno:
- ✅ Usar Vercel Environment Variables (nunca hardcodear)
- ✅ Habilitar SSL en base de datos
- ✅ Usar HTTPS únicamente

### Headers de seguridad:
- ✅ Helmet.js configurado
- ✅ CORS configurado
- ✅ Rate limiting implementado

## 📚 Recursos

- [Vercel Docs - Express](https://vercel.com/docs/frameworks/backend/express)
- [Vercel Docs - Serverless Functions](https://vercel.com/docs/functions)
- [Neon Docs](https://neon.tech/docs)
- [Supabase Docs](https://supabase.com/docs)

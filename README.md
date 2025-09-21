# FITito v2.0

Aplicación de gimnasio React Native con Expo SDK 54, arquitectura escalable y
mejores prácticas.

## 🚀 Tecnologías

- **React Native** 0.81.4
- **Expo SDK** 54
- **TypeScript** 5.9.2
- **ESLint** + **Prettier** para calidad de código
- **Husky** + **lint-staged** para pre-commit hooks

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Expo Router screens (solo routing)
├── features/               # Módulos organizados por dominio
│   ├── auth/              # Autenticación
│   ├── routines/          # Rutinas de entrenamiento
│   ├── exercises/         # Ejercicios
│   ├── training-sessions/ # Sesiones de entrenamiento
│   └── profile/           # Perfil de usuario
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (Button, Input, etc.)
│   ├── forms/            # Componentes de formularios
│   └── layout/           # Componentes de layout
├── hooks/                 # Hooks compartidos/globales
├── services/              # Servicios globales (API, storage, etc.)
├── store/                 # Estado global
├── utils/                 # Utilidades y helpers
├── types/                 # Tipos TypeScript globales
└── constants/             # Constantes globales
```

### Estructura de Features

Cada feature tiene su propia estructura modular:

```
features/[feature-name]/
├── components/    # Componentes específicos del feature
├── hooks/         # Hooks específicos del feature
├── services/      # Servicios específicos del feature
├── store/         # Estado específico del feature
├── types/         # Tipos específicos del feature
└── index.ts       # Barrel export
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo
npm start            # Alias para dev

# Plataformas específicas
npm run android      # Ejecutar en Android
npm run ios          # Ejecutar en iOS
npm run web          # Ejecutar en web

# Build y calidad
npm run build        # Build de producción
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Corregir problemas de ESLint automáticamente
npm run format       # Formatear código con Prettier
npm run format:check # Verificar formato sin cambios
npm run type-check   # Verificar tipos TypeScript
```

## 📦 Imports Absolutos

El proyecto está configurado con imports absolutos para una mejor organización:

```typescript
// ✅ Imports absolutos (recomendado)
import { Button } from '@/components';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/services';

// ❌ Imports relativos (evitar)
import { Button } from '../../../components/ui/Button';
```

### Paths disponibles:

- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/features/*` → `src/features/*`
- `@/hooks/*` → `src/hooks/*`
- `@/services/*` → `src/services/*`
- `@/store/*` → `src/store/*`
- `@/utils/*` → `src/utils/*`
- `@/types/*` → `src/types/*`
- `@/constants/*` → `src/constants/*`

## 🔧 Setup del Proyecto

1. **Clonar e instalar dependencias:**

   ```bash
   git clone [repo-url]
   cd FITito-v2
   npm install
   ```

2. **Ejecutar en modo desarrollo:**

   ```bash
   npm run dev
   ```

3. **Verificar configuración:**
   ```bash
   npm run lint
   npm run type-check
   npm run format:check
   ```

## ✅ Calidad de Código

- **ESLint**: Configurado con reglas para React Native + TypeScript
- **Prettier**: Formato consistente automático
- **Husky**: Pre-commit hooks automáticos
- **lint-staged**: Solo verifica archivos modificados
- **TypeScript**: Tipado estricto habilitado

### Pre-commit hooks

Los siguientes checks se ejecutan automáticamente antes de cada commit:

- ESLint con corrección automática
- Prettier formatting
- Verificación de tipos TypeScript

## 🎯 Próximos Pasos

Este es el **Entregable #1** del plan de desarrollo. Los siguientes entregables
incluirán:

1. ✅ **Entregable #1**: Inicialización y estructura base
2. 🔄 **Entregable #2**: Setup del backend con Node.js + Fastify
3. 🔄 **Entregable #3**: Configuración de PostgreSQL + Prisma
4. 🔄 **Entregable #4**: Sistema de autenticación JWT
5. 🔄 **Entregable #5**: Docker development environment

## 📝 Convenciones

### Nomenclatura de archivos:

- Componentes: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE.ts`

### Estructura de commits:

```
feat: agregar nueva funcionalidad
fix: corregir bug
docs: actualizar documentación
style: cambios de formato
refactor: refactoring de código
test: agregar o modificar tests
chore: tareas de mantenimiento
```

---

Desarrollado con ❤️ siguiendo mejores prácticas de React Native y Clean
Architecture.

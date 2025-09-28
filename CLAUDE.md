# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Mobile (React Native/Expo)

- `npm run start` - Start Expo development server
- `npm run dev` - Start Expo development server with tunnel
- `npm run android` - Start on Android device/emulator
- `npm run ios` - Start on iOS device/simulator
- `npm run web` - Start web development server
- `npm run build` - Export production build for all platforms
- `npm run lint` - Run ESLint code linting
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Backend (Express.js API)

- `cd backend && npm run dev` - Start backend development server
- `cd backend && node src/exercises-simple.js` - Run simplified backend server
- Backend runs on `http://192.168.1.50:3000` for mobile connectivity

## Architecture Overview

### Tech Stack

- **Mobile Framework**: React Native with Expo Router (file-based routing)
- **Backend**: Express.js with PostgreSQL database
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: React Native built-in components with custom styling
- **Navigation**: Expo Router with tab-based navigation
- **Image Handling**: Expo Image Picker
- **Notifications**: React Native Toast Message
- **Styling**: React Native StyleSheet with LinearGradient components

### Project Structure

#### Mobile App (`mobile/`)

```
mobile/
├── src/
│   ├── app/                    # Expo Router app directory
│   │   ├── _layout.tsx         # Root layout with providers
│   │   └── (tabs)/             # Tab navigation group
│   │       ├── _layout.tsx     # Tab layout with ProfileSwitch
│   │       └── ejercicios/     # Exercises feature pages
│   ├── components/             # General reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   ├── navigation/         # Navigation components
│   │   ├── LinearGradientItem.tsx
│   │   ├── RadialGradientBackground.tsx
│   │   ├── ProfileSwitch.tsx
│   │   ├── Menu.tsx
│   │   └── index.ts            # Barrel exports
│   ├── features/               # Feature-specific modules
│   │   ├── exercises/          # Exercises feature
│   │   │   ├── components/     # Feature-specific components
│   │   │   ├── hooks/          # Feature-specific hooks
│   │   │   ├── services/       # Feature-specific API calls
│   │   │   ├── store/          # Feature-specific state
│   │   │   ├── types/          # Feature-specific types
│   │   │   └── index.ts        # Feature exports
│   │   ├── routines/           # Routines feature
│   │   ├── training-sessions/  # Training sessions feature
│   │   ├── profile/            # Profile feature
│   │   └── auth/               # Authentication feature
│   ├── services/               # Global API service layer
│   │   └── exerciseApi.ts      # TanStack Query API calls
│   └── types/                  # Global TypeScript type definitions
└── package.json
```

#### Backend (`backend/`)

```
backend/
├── src/
│   └── exercises-simple.js     # Express.js API server
├── database/
│   └── run-migrations.sql      # Database schema
└── package.json
```

## Component Architecture

### Feature-Based vs General Component Separation

This project follows a clear separation between **general reusable components** and **feature-specific components**:

#### General Components (`src/components/`)

**Purpose**: Reusable components that can be used across multiple features

**Directory Structure**:
```
src/components/
├── ui/                 # Base UI components (buttons, inputs, modals)
├── forms/              # Form-specific components (form controls, validation)
├── layout/             # Layout components (headers, containers, wrappers)
├── navigation/         # Navigation components (tab bars, menu items)
├── LinearGradientItem.tsx      # Reusable styled components
├── RadialGradientBackground.tsx
├── Menu.tsx
├── ProfileSwitch.tsx
└── index.ts           # Barrel exports for clean imports
```

**Examples of General Components**:
- UI primitives (Button, Input, Modal, Card)
- Layout containers (Screen, Section, Container)
- Form controls (TextInput, Picker, Switch)
- Navigation elements (TabBar, MenuItem, BackButton)
- Visual effects (Gradients, Animations, Loaders)

#### Feature-Specific Components (`src/features/[feature]/components/`)

**Purpose**: Components that contain business logic specific to one feature

**Directory Structure**:
```
src/features/[feature-name]/
├── components/         # Feature-specific components
│   ├── ComponentName/  # Complex component folder structure
│   │   ├── index.tsx   
│   │   ├── component.tsx
│   │   ├── styles.ts
│   │   └── types.ts
│   └── SimpleComponent.tsx
├── hooks/             # Feature-specific custom hooks  
├── services/          # Feature-specific API calls
├── store/             # Feature-specific state management
├── types/             # Feature-specific TypeScript types
└── index.ts           # Feature barrel exports
```

**Examples of Feature-Specific Components**:
- ExerciseCard (exercises feature)
- WorkoutTimer (training-sessions feature)  
- RoutineBuilder (routines feature)
- ProfileSettings (profile feature)
- LoginForm (auth feature)

### Component Classification Decision Matrix

**Use General Components When**:
- ✅ Component can be reused across 2+ features
- ✅ Component has no business logic dependencies
- ✅ Component only handles presentation/UI concerns
- ✅ Component accepts generic props and data

**Use Feature-Specific Components When**:
- ✅ Component contains feature-specific business logic
- ✅ Component uses feature-specific types or services
- ✅ Component is tightly coupled to feature workflows
- ✅ Component unlikely to be reused outside feature

### Complex Components Structure

**For components with multiple responsibilities, MUST use folder structure**:

```
ComponentName/
├── index.tsx          # Simple export of component
├── component.tsx      # Main component logic
├── styles.ts          # StyleSheet definitions
├── types.ts           # Component-specific types
└── children/          # Sub-components if needed
```

### Simple Components

- Single-file components for straightforward UI elements
- Keep in individual `.tsx` files when logic is minimal

### Import/Export Patterns

**Feature Exports**:
```typescript
// src/features/exercises/index.ts
export * from './components';
export * from './hooks';
export * from './services';
export * from './store';
export * from './types';
```

**Component Imports**:
```typescript
// From general components
import { Button, Modal } from '@/components';
import { LinearGradientItem } from '@/components/LinearGradientItem';

// From feature-specific components
import { ExerciseCard, ExerciseForm } from '@/features/exercises';
```

**Benefits of This Architecture**:

1. **Clear Ownership**: Each feature owns its specific components
2. **Encapsulation**: Feature logic stays within feature boundaries
3. **Reusability**: General components can be shared across features
4. **Scalability**: Easy to add new features without affecting others
5. **Team Organization**: Feature teams can work independently
6. **Testing**: Feature components can be tested in isolation
7. **Maintenance**: Easy to find and modify feature-specific code

### Refactoring Guidelines

**When to Move Components**:

- **From General to Feature-Specific**: When a general component becomes tightly coupled to specific business logic
- **From Feature-Specific to General**: When a feature component could be reused by other features (extract business logic first)

**Migration Pattern**:

```typescript
// Step 1: Extract business logic to feature hooks/services
// Before (feature-specific with mixed concerns)
const ExerciseCard = ({ exercise, onEdit, onDelete }) => {
  const [loading, setLoading] = useState(false);
  
  const handleEdit = async () => {
    setLoading(true);
    await updateExercise(exercise.id, data);
    setLoading(false);
  };
  
  return <Card>{/* render logic */}</Card>;
};

// Step 2: Separate into general component + feature logic
// General component (src/components/ui/)
const Card = ({ title, image, actions, loading }) => {
  return <View>{/* pure UI logic */}</View>;
};

// Feature component (src/features/exercises/components/)
const ExerciseCard = ({ exercise }) => {
  const { updateExercise, isLoading } = useExerciseActions();
  
  const handleEdit = () => updateExercise(exercise.id, data);
  
  return (
    <Card
      title={exercise.name}
      image={exercise.image}
      actions={[{ label: "Edit", onPress: handleEdit }]}
      loading={isLoading}
    />
  );
};
```

**Component Lifecycle**:

1. **Start Simple**: Create single-file components in appropriate directory
2. **Extract When Complex**: Move to folder structure when component grows
3. **Promote When Reusable**: Move general components to shared location
4. **Demote When Specific**: Move feature-specific logic to feature directory

## Advanced Component Architecture Patterns

### Sub-Component Division and Separation of Concerns

**CRITICAL PRINCIPLE**: Always separate business logic from presentational logic. Extract complex JSX into smaller, focused **fragments as constants** within the same file, and extract business logic to utility functions and custom hooks.

### Sub-Component Organization: JSX Fragments as Constants

**When a component becomes complex, break it down using JSX fragments as constants within the same file**:

```typescript
const ExercisesScreen = () => {
  /* Business Logic */
  const { exercises, isLoading, error } = useExerciseList();
  const { deleteExercise } = useExerciseActions();
  const filters = useExerciseFilters(exercises);
  
  /* Data Processing */
  const sortedExercises = useMemo(() => 
    sortExercisesByDate(exercises), [exercises]
  );

  /* Event Handlers */
  const handleDelete = useCallback((exercise: Exercise) => {
    deleteExercise(exercise.id);
  }, [deleteExercise]);

  /* Sub-components as JSX fragments - NO props, use scope variables */
  const headerSection = (
    <View style={styles.header}>
      <Text style={styles.title}>Ejercicios</Text>
      <Text style={styles.subtitle}>{sortedExercises.length} ejercicios</Text>
      <Text style={styles.stats}>Total: {filters.stats.total}</Text>
    </View>
  );

  const searchSection = (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar ejercicios..."
        value={filters.searchTerm}
        onChangeText={filters.handleSearchChange}
      />
    </View>
  );

  const loadingState = (
    <View style={styles.centered}>
      <Text style={styles.loadingText}>Cargando ejercicios...</Text>
    </View>
  );

  const emptyState = (
    <View style={styles.centered}>
      <Text style={styles.emptyText}>No hay ejercicios</Text>
      <TouchableOpacity onPress={() => router.push('/anadir-ejercicio')}>
        <Text style={styles.addButton}>Añadir ejercicio</Text>
      </TouchableOpacity>
    </View>
  );

  /* Conditional rendering with JSX fragments */
  if (isLoading) return loadingState;
  if (sortedExercises.length === 0) return emptyState;

  return (
    <View style={styles.container}>
      <RadialGradientBackground />
      {headerSection}
      {searchSection}
      <ScrollView>
        {sortedExercises.map(exercise => (
          <LinearGradientItem key={exercise.id}>
            <View style={styles.exerciseContent}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <TouchableOpacity onPress={() => handleDelete(exercise)}>
                <Text>Delete</Text>
              </TouchableOpacity>
            </View>
          </LinearGradientItem>
        ))}
      </ScrollView>
    </View>
  );
};
```

### Route Organization: Logic in Pages, Not Components

**CRITICAL**: Routes should contain the screen logic directly, NOT just import a component:

```typescript
// ❌ INCORRECTO - Solo importar un componente
const ExercisesPage = () => {
  return <ExercisesScreen />;
};

// ✅ CORRECTO - Lógica completa en la ruta
const ExercisesPage = () => {
  /* Business Logic directly in the route */
  const { exercises, isLoading, error } = useExerciseList();
  const { deleteExercise } = useExerciseActions();
  
  /* JSX fragments for complex sections */
  const headerSection = (
    <View style={styles.header}>
      <Text style={styles.title}>Ejercicios</Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {headerSection}
      {/* Rest of the component logic */}
    </View>
  );
};
```

**Key Benefits of JSX Fragments Approach**:
- ✅ **Direct Scope Access**: Fragments use variables directly from the component scope
- ✅ **No Props Drilling**: No need to pass data as props
- ✅ **Simple Extraction**: Easy to move complex JSX out of the return statement
- ✅ **True Readability**: Named sections make the component structure clear
- ✅ **No Overhead**: Just variable assignment, no function calls or component creation

**Key Benefits of Logic in Routes**:
- ✅ **Direct Screen Logic**: All screen behavior is visible in the route file
- ✅ **No Abstraction Layer**: No need to navigate to separate component files
- ✅ **Expo Router Optimization**: Routes are the natural boundary for screen logic
- ✅ **Easier Debugging**: All logic is in one place for each screen

### When to Create Separate Component Files

**Use JSX fragments for simple UI sections, but create separate files when sub-components have extensive and complex logic**:

```typescript
// ✅ CORRECTO - Fragmento JSX para sección simple
const headerSection = (
  <View style={styles.header}>
    <Text style={styles.title}>Ejercicios</Text>
    <Text>{exercises.length} total</Text>
  </View>
);

// ✅ CORRECTO - Archivo separado para lógica compleja
import ExerciseCard from './ExerciseCard'; // Tiene su propia lógica, estado, animaciones, etc.

const ExercisesScreen = () => {
  return (
    <View>
      {headerSection}
      {exercises.map(exercise => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </View>
  );
};
```

**Create separate component files when**:
- ✅ Component has its own state management
- ✅ Component has complex user interactions (gestures, animations)
- ✅ Component has extensive business logic
- ✅ Component is reused across multiple screens
- ✅ Component would be 50+ lines of code with its logic

**Use JSX fragments when**:
- ✅ Simple UI sections without complex logic
- ✅ Mostly static content that uses parent state
- ✅ UI organization and readability improvements
- ✅ Breaking up large return statements

### When to Separate into Container/Presentation Files

**ONLY separate into different files when you have a clear container/presentation split with significant complexity**:

**Container Component Pattern** (container.tsx):
```typescript
/* Container - Handles ALL business logic, NO rendering */
const ExerciseListContainer: React.FC = () => {
  /* Business Logic */
  const { exercises, isLoading, error } = useExerciseList();
  const { deleteExercise, isDeleting } = useExerciseActions();
  
  /* Data Transformation */
  const sortedExercises = useMemo(() => 
    sortExercisesByDate(exercises), [exercises]
  );
  
  const exerciseStats = useMemo(() => 
    calculateExerciseStats(exercises), [exercises]
  );
  
  /* Event Handlers */
  const handleExerciseEdit = useCallback((exercise: Exercise) => {
    navigateToExerciseEdit(exercise);
  }, []);
  
  const handleExerciseDelete = useCallback((exercise: Exercise) => {
    deleteExercise(exercise.id);
  }, [deleteExercise]);

  /* Pass everything to presentation component */
  return (
    <ExerciseListPresentation
      exercises={sortedExercises}
      stats={exerciseStats}
      isLoading={isLoading}
      error={error}
      onExerciseEdit={handleExerciseEdit}
      onExerciseDelete={handleExerciseDelete}
      isDeleting={isDeleting}
    />
  );
};
```

**Presentation Component Pattern** (presentation.tsx):
```typescript
/* Presentational Component - Pure UI logic */
interface ExerciseListPresentationProps {
  exercises: Exercise[];
  stats: ExerciseStats;
  isLoading: boolean;
  error: Error | null;
  onExerciseEdit: (exercise: Exercise) => void;
  onExerciseDelete: (exercise: Exercise) => void;
  isDeleting: boolean;
}

const ExerciseListPresentation: React.FC<ExerciseListPresentationProps> = ({
  exercises,
  stats,
  isLoading,
  error,
  onExerciseEdit,
  onExerciseDelete,
  isDeleting,
}) => {
  /* Sub-components as constants within the presentation file */
  const ExerciseCard = ({ exercise }: { exercise: Exercise }) => (
    <LinearGradientItem>
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <TouchableOpacity onPress={() => onExerciseEdit(exercise)}>
          <Text>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onExerciseDelete(exercise)}>
          <Text>Delete</Text>
        </TouchableOpacity>
      </View>
    </LinearGradientItem>
  );

  const HeaderSection = (
    <View style={styles.header}>
      <Text style={styles.title}>Ejercicios</Text>
      <Text style={styles.statsText}>{stats.total} total</Text>
    </View>
  );

  const LoadingState = (
    <View style={styles.centered}>
      <Text style={styles.loadingText}>Cargando ejercicios...</Text>
    </View>
  );

  const ErrorState = (
    <View style={styles.centered}>
      <Text style={styles.errorText}>Error: {error?.message}</Text>
    </View>
  );

  const EmptyState = (
    <View style={styles.centered}>
      <Text style={styles.emptyText}>No hay ejercicios</Text>
    </View>
  );

  /* Pure rendering logic - no business logic */
  if (isLoading) return LoadingState;
  if (error) return ErrorState;
  if (exercises.length === 0) return EmptyState;

  return (
    <View style={styles.container}>
      {HeaderSection}
      <ScrollView>
        {exercises.map(exercise => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </ScrollView>
    </View>
  );
};
```

### Decision Matrix: When to Use Each Pattern

**Use Sub-components Within Same File When**:
- ✅ Component has repetitive JSX that can be extracted for readability
- ✅ JSX sections are complex and benefit from being named
- ✅ Sub-components are small and specific to this component only
- ✅ Sub-components need access to parent state/handlers

**Use Container/Presentation File Split When**:
- ✅ Component has significant business logic AND complex rendering
- ✅ You want to completely separate state management from UI
- ✅ Multiple developers work on business logic vs UI separately
- ✅ Component is large enough that separation improves maintainability

**DON'T Create Separate Files When**:
- ❌ Sub-components are simple JSX snippets (use constants instead)
- ❌ Sub-components are only used once in a single place
- ❌ Creating files doesn't meaningfully improve organization
- ❌ It adds complexity without clear benefit

### Utility Functions for Business Logic

**Extract complex business logic to utility functions** (utils.ts):

```typescript
/* Pure functions - easy to test and reuse */
export const sortExercisesByDate = (exercises: Exercise[]): Exercise[] => {
  return exercises.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const calculateExerciseStats = (exercises: Exercise[]): ExerciseStats => {
  return {
    total: exercises.length,
    recentlyAdded: exercises.filter(exercise => 
      isWithinLastWeek(exercise.created_at)
    ).length,
    categories: groupExercisesByCategory(exercises),
  };
};

export const filterExercisesBySearch = (
  exercises: Exercise[], 
  searchTerm: string
): Exercise[] => {
  if (!searchTerm.trim()) return exercises;
  
  return exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const formatExerciseForDisplay = (exercise: Exercise): DisplayExercise => {
  return {
    ...exercise,
    displayName: exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1),
    timeAgo: formatTimeAgo(exercise.created_at),
    imageUrl: exercise.image || getDefaultExerciseImage(),
  };
};
```

### Custom Hooks for Complex Business Logic

**Extract stateful business logic to custom hooks**:

```typescript
/* Custom Hook - Encapsulates complex state and side effects */
export const useExerciseFilters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const applyFilters = useCallback((exercises: Exercise[]) => {
    let filtered = exercises;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filterExercisesBySearch(filtered, searchTerm);
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filterExercisesByCategory(filtered, selectedCategory);
    }
    
    // Apply sorting
    filtered = sortExercisesByOrder(filtered, sortOrder);
    
    return filtered;
  }, [searchTerm, selectedCategory, sortOrder]);
  
  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    setSortOrder,
    applyFilters,
  };
};
```

### Data Transformation Patterns

**Separate data transformation from rendering**:

```typescript
/* Data Layer - Transforms API data to UI data */
export const transformExerciseApiData = (apiExercises: ApiExercise[]): Exercise[] => {
  return apiExercises.map(apiExercise => ({
    id: apiExercise.id,
    name: normalizeExerciseName(apiExercise.name),
    image: validateImageUrl(apiExercise.image),
    category: mapApiCategoryToUICategory(apiExercise.category),
    createdAt: parseApiDate(apiExercise.created_at),
    displayData: {
      formattedName: formatExerciseTitle(apiExercise.name),
      thumbnail: generateThumbnailUrl(apiExercise.image),
      timeAgo: calculateTimeAgo(apiExercise.created_at),
    },
  }));
};

/* Validation and normalization utilities */
const normalizeExerciseName = (name: string): string => {
  return name.trim().replace(/\s+/g, ' ');
};

const validateImageUrl = (url: string): string => {
  return url && isValidUrl(url) ? url : getDefaultExerciseImage();
};
```

### Component Communication Patterns

**Use props for communication, utilities for processing**:

```typescript
/* Parent Component - Orchestrates communication */
const ExerciseManagement: React.FC = () => {
  /* Business state */
  const { exercises, isLoading } = useExerciseList();
  const { selectedExercises, toggleSelection } = useExerciseSelection();
  const filters = useExerciseFilters();
  
  /* Data processing */
  const processedExercises = useMemo(() => {
    const transformed = transformExerciseApiData(exercises);
    return filters.applyFilters(transformed);
  }, [exercises, filters]);
  
  /* Child components with clear responsibilities */
  return (
    <View style={styles.container}>
      <ExerciseFilters
        searchTerm={filters.searchTerm}
        onSearchChange={filters.setSearchTerm}
        selectedCategory={filters.selectedCategory}
        onCategoryChange={filters.setSelectedCategory}
      />
      
      <ExerciseList
        exercises={processedExercises}
        selectedExercises={selectedExercises}
        onExerciseSelect={toggleSelection}
        isLoading={isLoading}
      />
      
      <ExerciseActions
        selectedExercises={selectedExercises}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
      />
    </View>
  );
};
```

### Key Principles Summary

1. **Container vs Presentation**: Separate components that manage state from those that only render
2. **Single Responsibility**: Each component, hook, and utility should have one clear purpose
3. **Pure Functions**: Business logic should be extractable to pure, testable functions
4. **Data Transformation**: Transform data at the boundary, not in rendering logic
5. **Children Organization**: Use `children/` folders to break complex components into focused pieces
6. **Hook Extraction**: Move complex stateful logic to custom hooks
7. **Utility Extraction**: Move pure business logic to utility functions

**Benefits**:
- **Testability**: Pure functions and separated concerns are easier to test
- **Reusability**: Business logic can be reused across components
- **Maintainability**: Changes to business logic don't affect UI and vice versa
- **Readability**: Components focus on their core responsibility
- **Performance**: Easier to optimize when concerns are separated

### Styling Patterns

**StyleSheet Organization**:

```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#141A30',
  },
  
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  
  // Group related styles together
  button: {
    backgroundColor: '#2979FF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default styles;
```

**Styling Rules**:

- Extract styles to separate `styles.ts` file when component has more than 3 style objects
- Use descriptive names that clearly indicate purpose
- Group related styles together (e.g., button + buttonText)
- Use consistent color palette and spacing values
- Leverage React Native's built-in style properties

## Code Organization Standards

### Component Internal Structure

Each component should follow this organization:

1. **Constants** (independent of component logic)
2. **State variables** (before requests)
3. **Request hooks** (TanStack Query - useQuery/useMutation)
4. **Derived data** (processing request results)
5. **Functions and handlers**
6. **useEffect hooks**
7. **Sub-components** (for readability)
8. **Return statement** with error/loading handling

**IMPORTANT**: Always add section comments to divide component responsibilities:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

/* Constants */
const ITEMS_PER_PAGE = 10;

const ExercisesScreen = () => {
  /* State */
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  /* Request hooks */
  const { data: exercises = [], isLoading, error } = useQuery({
    queryKey: ['exercises'],
    queryFn: exerciseApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: exerciseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      Toast.show({
        type: 'success',
        text1: 'Ejercicio eliminado',
      });
    },
  });

  /* Derived data */
  const filteredExercises = exercises.filter(exercise => 
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* Handlers */
  const handleDeleteExercise = (id: number) => {
    deleteMutation.mutate(id);
  };

  /* Effects */
  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error al cargar ejercicios',
      });
    }
  }, [error]);

  /* Sub-components */
  const ExerciseCard = ({ exercise }) => (
    <View style={styles.exerciseCard}>
      <Text style={styles.exerciseName}>{exercise.name}</Text>
    </View>
  );

  // Extract complex JSX for readability
  const HeaderSection = (
    <View style={styles.header}>
      <Text style={styles.title}>Ejercicios</Text>
    </View>
  );

  const ContentSection = isLoading ? (
    <Text style={styles.loadingText}>Cargando...</Text>
  ) : error ? (
    <Text style={styles.errorText}>Error al cargar datos</Text>
  ) : (
    <ScrollView>
      {filteredExercises.map(exercise => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {HeaderSection}
      {ContentSection}
    </View>
  );
};
```

## State Management Patterns

### Local State

- Use `useState` for component-specific state
- Use `useRef` for values that don't trigger re-renders:
  ```typescript
  const formDataRef = useRef(initialFormData);
  const previousValueRef = useRef<string>();
  ```

### Server State (TanStack Query)

**Query Patterns**:

```typescript
// Basic query
const { data, isLoading, error } = useQuery({
  queryKey: ['exercises'],
  queryFn: exerciseApi.getAll,
});

// Query with parameters
const { data: exercise } = useQuery({
  queryKey: ['exercise', id],
  queryFn: () => exerciseApi.getById(id),
  enabled: !!id,
});
```

**Mutation Patterns**:

```typescript
const createMutation = useMutation({
  mutationFn: exerciseApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['exercises'] });
    Toast.show({
      type: 'success',
      text1: 'Ejercicio creado correctamente',
    });
    router.back();
  },
  onError: (error) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: error.message,
    });
  },
});
```

### Complex Shared State

- Use React Context for feature-specific shared state
- Combine with TanStack Query for server state synchronization

## API Integration Patterns

### Service Layer Structure

```typescript
// services/exerciseApi.ts
const API_BASE_URL = 'http://192.168.1.50:3000/api/v1';

export const exerciseApi = {
  getAll: async (): Promise<Exercise[]> => {
    const response = await fetch(`${API_BASE_URL}/exercises`);
    if (!response.ok) {
      throw new Error('Failed to fetch exercises');
    }
    const result = await response.json();
    return result.data;
  },

  create: async (exercise: CreateExerciseDto): Promise<Exercise> => {
    const response = await fetch(`${API_BASE_URL}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exercise),
    });
    if (!response.ok) {
      throw new Error('Failed to create exercise');
    }
    const result = await response.json();
    return result.data;
  },
};
```

### Error Handling

- Use Toast notifications for user feedback
- Handle loading states appropriately
- Provide meaningful error messages

## Mobile-Specific Patterns

### Navigation

- Use Expo Router for file-based routing
- Tab navigation for main sections
- Stack navigation for feature flows

### Responsive Design

```typescript
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

// Conditional rendering
{isTablet ? <TabletLayout /> : <MobileLayout />}
```

### Pull-to-Refresh

```typescript
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await queryClient.invalidateQueries({ queryKey: ['exercises'] });
  setRefreshing(false);
}, [queryClient]);

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#FFFFFF"
    />
  }
>
```

## Performance Optimization

### React Native Patterns

- Use `useMemo` for expensive calculations
- Use `useCallback` for stable function references
- Implement proper list optimization with `FlatList` for large datasets
- Optimize images with appropriate sizing and caching

### Memory Management

- Clean up subscriptions in useEffect cleanup
- Use `useRef` for values that don't need re-renders
- Avoid creating objects in render methods

## Type Safety

### Component Props

```typescript
interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (id: number) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onEdit,
  onDelete,
}) => {
  // Component implementation
};
```

### API Types

```typescript
interface Exercise {
  id: number;
  name: string;
  image: string;
  created_at: string;
}

interface CreateExerciseDto {
  name: string;
  image: string;
}

interface UpdateExerciseDto extends CreateExerciseDto {}
```

## Important Notes

### Development Environment

- Mobile app connects to backend via local network IP (192.168.1.50:3000)
- Use tunnel mode for testing on physical devices
- Database requires PostgreSQL with migrations

### Code Quality Standards

- Follow existing patterns for component organization
- Prefer editing existing files over creating new ones
- Use TanStack Query for all server state management
- Handle loading and error states in every component that fetches data
- Implement Toast notifications for user feedback
- Use TypeScript for type safety
- Follow React Native best practices for performance

### Networking

- Backend must be accessible via local network IP for mobile testing
- Use proper error handling for network requests
- Implement retry logic where appropriate

## Component Reference Examples

**Well-structured components to use as reference**:

- `src/app/(tabs)/ejercicios/index.tsx` - Complete CRUD operations with TanStack Query
- `src/app/(tabs)/ejercicios/anadir-ejercicio.tsx` - Form handling and image picker
- `src/components/ProfileSwitch.tsx` - Simple component with state management
- `src/services/exerciseApi.ts` - API service layer implementation

## Feature Organization and Modularization Best Practices

### Feature-Based Separation of Concerns

**CRITICAL**: Always separate inline code from large components into feature-specific modules following this structure:

```
src/features/[feature-name]/
├── components/         # Feature-specific components
├── hooks/             # Feature-specific custom hooks  
├── services/          # Feature-specific API calls
├── store/             # Feature-specific state management
├── types/             # Feature-specific TypeScript types
├── styles/            # Feature-specific StyleSheet definitions
├── utils/             # Feature-specific utility functions
└── index.ts           # Feature barrel exports
```

### Types Organization

**Extract inline types when components exceed 200 lines or have 5+ type definitions**:

```typescript
// ❌ AVOID - Inline types in large components
const MyComponent = () => {
  interface LocalType1 { ... }
  interface LocalType2 { ... }
  type LocalType3 = string | number;
  // ... 800+ lines of component code
};

// ✅ CORRECT - Extract to feature types
// src/features/my-feature/types/componentTypes.ts
export interface ComponentType1 { ... }
export interface ComponentType2 { ... }
export type ComponentType3 = string | number;

// src/features/my-feature/types/index.ts
export * from './componentTypes';

// Component imports types cleanly
import { ComponentType1, ComponentType2 } from '@/features/my-feature/types';
```

### Styles Organization

**Extract StyleSheet when components have 3+ style objects or 100+ lines of styles**:

```typescript
// ❌ AVOID - Inline styles in large components
const MyComponent = () => {
  const styles = StyleSheet.create({
    container: { ... },
    header: { ... },
    // ... 50+ more style objects
  });
  
  return <View style={styles.container}>...</View>;
};

// ✅ CORRECT - Extract to feature styles
// src/features/my-feature/styles/componentStyles.ts
import { StyleSheet } from 'react-native';

export const componentStyles = StyleSheet.create({
  container: { ... },
  header: { ... },
  // ... all style definitions
});

// src/features/my-feature/styles/index.ts
export { componentStyles } from './componentStyles';

// Component imports styles cleanly
import { componentStyles } from '@/features/my-feature/styles';
```

### Utils Organization

**Extract utility functions when they have business logic or are 10+ lines**:

```typescript
// ❌ AVOID - Inline utility functions
const MyComponent = () => {
  const validateForm = (data) => {
    // 20+ lines of validation logic
  };
  
  const transformData = (input) => {
    // 15+ lines of transformation logic
  };
  
  const formatDisplay = (value) => {
    // 10+ lines of formatting logic
  };
  
  // Component logic continues...
};

// ✅ CORRECT - Extract to feature utils
// src/features/my-feature/utils/validation.ts
export const validateForm = (data) => {
  // Pure validation logic
};

// src/features/my-feature/utils/dataTransform.ts
export const transformData = (input) => {
  // Pure transformation logic
};

// src/features/my-feature/utils/formatting.ts
export const formatDisplay = (value) => {
  // Pure formatting logic
};

// src/features/my-feature/utils/index.ts
export * from './validation';
export * from './dataTransform';
export * from './formatting';

// Component imports utilities cleanly
import { validateForm, transformData, formatDisplay } from '@/features/my-feature/utils';
```

### Component Modularization Decision Matrix

**Extract to Feature Modules When**:
- ✅ Component has 200+ lines
- ✅ Component has 5+ type definitions
- ✅ Component has 3+ utility functions
- ✅ Component has 100+ lines of styles
- ✅ Multiple components would benefit from shared types/utils/styles

**Keep Inline When**:
- ✅ Component has <200 lines total
- ✅ Types/styles/utils are simple and specific to this component only
- ✅ No other components would benefit from the extracted code

### Barrel Export Pattern

**Always create index.ts files for clean imports**:

```typescript
// src/features/my-feature/index.ts
export * from './components';
export * from './hooks';
export * from './services';
export * from './store';
export * from './types';
export * from './styles';
export * from './utils';

// Clean imports in consuming components
import { MyComponent, useMyFeature, myFeatureApi, MyFeatureType } from '@/features/my-feature';
```

### Progressive Refactoring Approach

**Start with inline code, then refactor when thresholds are met**:

1. **Initial Development**: Write everything inline in the component
2. **Types Extraction**: When 5+ types or 200+ total lines, extract to `types/`
3. **Styles Extraction**: When 3+ style objects or 100+ style lines, extract to `styles/`
4. **Utils Extraction**: When utility functions have business logic, extract to `utils/`
5. **Components Extraction**: When sub-components have complex logic, extract to `components/`

### Enforcement Rules

**MUST follow these rules for codebase consistency**:

- ❌ **NEVER** leave large inline type definitions in components >200 lines
- ❌ **NEVER** leave large inline StyleSheets in components with 3+ style objects
- ❌ **NEVER** leave complex utility functions inline when they have business logic
- ✅ **ALWAYS** create barrel exports for clean imports
- ✅ **ALWAYS** follow the feature directory structure exactly as specified
- ✅ **ALWAYS** extract when the thresholds are met, don't wait

### Benefits of This Organization

1. **Maintainability**: Easy to find and modify specific concerns
2. **Reusability**: Types, styles, and utils can be shared across components
3. **Testability**: Extracted utilities can be tested independently
4. **Readability**: Components focus on logic, not boilerplate
5. **Team Collaboration**: Clear ownership and organization of code
6. **Performance**: Better tree-shaking and bundle optimization
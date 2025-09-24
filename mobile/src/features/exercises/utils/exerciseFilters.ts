import { Exercise } from '../types';

/* Exercise filtering utilities */
export const filterExercisesBySearch = (exercises: Exercise[], searchTerm: string): Exercise[] => {
  if (!searchTerm.trim()) {
    return exercises;
  }
  
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(normalizedSearch)
  );
};

export const isWithinLastWeek = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return date >= weekAgo;
};

export const isWithinLastMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return date >= monthAgo;
};

export const filterExercisesByDateRange = (
  exercises: Exercise[], 
  range: 'week' | 'month' | 'all'
): Exercise[] => {
  switch (range) {
    case 'week':
      return exercises.filter(exercise => isWithinLastWeek(exercise.created_at));
    case 'month':
      return exercises.filter(exercise => isWithinLastMonth(exercise.created_at));
    case 'all':
    default:
      return exercises;
  }
};

/* Exercise sorting utilities */
export type SortOrder = 'asc' | 'desc';
export type SortBy = 'name' | 'date' | 'id';

export const sortExercisesByDate = (exercises: Exercise[], order: SortOrder = 'desc'): Exercise[] => {
  return [...exercises].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const sortExercisesByName = (exercises: Exercise[], order: SortOrder = 'asc'): Exercise[] => {
  return [...exercises].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    
    if (order === 'asc') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });
};

export const sortExercisesById = (exercises: Exercise[], order: SortOrder = 'desc'): Exercise[] => {
  return [...exercises].sort((a, b) => {
    return order === 'desc' ? b.id - a.id : a.id - b.id;
  });
};

export const sortExercises = (
  exercises: Exercise[], 
  sortBy: SortBy, 
  order: SortOrder = 'desc'
): Exercise[] => {
  switch (sortBy) {
    case 'name':
      return sortExercisesByName(exercises, order);
    case 'date':
      return sortExercisesByDate(exercises, order);
    case 'id':
      return sortExercisesById(exercises, order);
    default:
      return sortExercisesByDate(exercises, order);
  }
};

/* Exercise statistics utilities */
export interface ExerciseStats {
  total: number;
  recentlyAdded: number;
  thisWeek: number;
  thisMonth: number;
}

export const calculateExerciseStats = (exercises: Exercise[]): ExerciseStats => {
  return {
    total: exercises.length,
    recentlyAdded: exercises.filter(ex => isWithinLastWeek(ex.created_at)).length,
    thisWeek: exercises.filter(ex => isWithinLastWeek(ex.created_at)).length,
    thisMonth: exercises.filter(ex => isWithinLastMonth(ex.created_at)).length,
  };
};

/* Combined filter and sort utility */
export interface ExerciseFilterOptions {
  searchTerm?: string;
  dateRange?: 'week' | 'month' | 'all';
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

export const applyExerciseFilters = (
  exercises: Exercise[], 
  options: ExerciseFilterOptions = {}
): Exercise[] => {
  let filtered = exercises;
  
  // Apply search filter
  if (options.searchTerm) {
    filtered = filterExercisesBySearch(filtered, options.searchTerm);
  }
  
  // Apply date range filter
  if (options.dateRange && options.dateRange !== 'all') {
    filtered = filterExercisesByDateRange(filtered, options.dateRange);
  }
  
  // Apply sorting
  if (options.sortBy) {
    filtered = sortExercises(filtered, options.sortBy, options.sortOrder);
  } else {
    // Default sort by date, newest first
    filtered = sortExercisesByDate(filtered, 'desc');
  }
  
  return filtered;
};
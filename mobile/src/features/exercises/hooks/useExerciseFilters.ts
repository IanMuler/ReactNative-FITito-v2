import { useState, useCallback, useMemo } from 'react';
import { Exercise } from '../types';
import { 
  applyExerciseFilters, 
  ExerciseFilterOptions,
  SortBy,
  SortOrder,
  calculateExerciseStats 
} from '../utils';

export const useExerciseFilters = (exercises: Exercise[] = []) => {
  /* Filter state */
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  /* Apply filters and get filtered exercises */
  const filteredExercises = useMemo(() => {
    const filterOptions: ExerciseFilterOptions = {
      searchTerm: searchTerm.trim() || undefined,
      dateRange,
      sortBy,
      sortOrder,
    };
    
    return applyExerciseFilters(exercises, filterOptions);
  }, [exercises, searchTerm, dateRange, sortBy, sortOrder]);
  
  /* Calculate stats for filtered exercises */
  const stats = useMemo(() => 
    calculateExerciseStats(filteredExercises), 
    [filteredExercises]
  );
  
  /* Filter handlers */
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);
  
  const handleDateRangeChange = useCallback((range: 'week' | 'month' | 'all') => {
    setDateRange(range);
  }, []);
  
  const handleSortChange = useCallback((field: SortBy, order?: SortOrder) => {
    setSortBy(field);
    if (order) {
      setSortOrder(order);
    }
  }, []);
  
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);
  
  /* Reset filters */
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setDateRange('all');
    setSortBy('date');
    setSortOrder('desc');
  }, []);
  
  /* Quick filter actions */
  const showRecent = useCallback(() => {
    setDateRange('week');
    setSortBy('date');
    setSortOrder('desc');
  }, []);
  
  const showAlphabetical = useCallback(() => {
    setSortBy('name');
    setSortOrder('asc');
  }, []);
  
  /* Filter state helpers */
  const hasActiveFilters = searchTerm.trim() !== '' || dateRange !== 'all';
  const isEmpty = filteredExercises.length === 0;
  const isFiltered = hasActiveFilters && exercises.length > 0;
  
  return {
    // Filter state
    searchTerm,
    dateRange,
    sortBy,
    sortOrder,
    
    // Filtered data
    filteredExercises,
    stats,
    
    // State helpers
    hasActiveFilters,
    isEmpty,
    isFiltered,
    
    // Handlers
    handleSearchChange,
    handleDateRangeChange,
    handleSortChange,
    toggleSortOrder,
    resetFilters,
    
    // Quick actions
    showRecent,
    showAlphabetical,
  };
};
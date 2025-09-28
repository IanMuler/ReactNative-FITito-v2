import { useState, useMemo, useCallback } from 'react';

interface Exercise {
  id: number;
  name: string;
  image: string;
}

export const useExerciseSearch = (exercises: Exercise[]) => {
  const [searchTerm, setSearchTerm] = useState('');

  /* Filter exercises based on search term */
  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) {
      return exercises;
    }

    return exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exercises, searchTerm]);

  /* Clear search function */
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  /* Handle search change */
  const handleSearchChange = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  return {
    searchTerm,
    filteredExercises,
    handleSearchChange,
    clearSearch,
    hasSearchTerm: searchTerm.trim().length > 0,
  };
};
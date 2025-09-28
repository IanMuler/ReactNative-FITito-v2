/* Day name to ID mapping utilities */

export const getDayNameToId = (dayName: string): number => {
  const dayMap: Record<string, number> = {
    'Domingo': 1, 'Lunes': 2, 'Martes': 3, 'Miércoles': 4,
    'Jueves': 5, 'Viernes': 6, 'Sábado': 7
  };
  return dayMap[dayName] || 1;
};

export const getIdToDayName = (id: number): string => {
  const idMap: Record<number, string> = {
    1: 'Domingo', 2: 'Lunes', 3: 'Martes', 4: 'Miércoles',
    5: 'Jueves', 6: 'Viernes', 7: 'Sábado'
  };
  return idMap[id] || 'Domingo';
};
/**
 * useExerciseFilter — manages the domain filter state for the Train tab.
 */
import { useState, useMemo } from 'react';
import { useThemeColors, getDomains } from '../../../theme';
import { EXERCISES } from '../../../data/exercises';

export function useExerciseFilter() {
  const Colors = useThemeColors();
  const DOMAINS = getDomains(Colors);
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = ['all', ...DOMAINS.map(d => d.id)];

  const filteredExercises = useMemo(
    () => activeFilter === 'all' ? EXERCISES : EXERCISES.filter(e => e.domain === activeFilter),
    [activeFilter],
  );

  return { filters, filteredExercises, activeFilter, setActiveFilter, DOMAINS };
}

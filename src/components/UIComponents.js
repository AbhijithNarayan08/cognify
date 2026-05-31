/**
 * UIComponents — backward-compatible barrel export.
 *
 * Each component now lives in its own file under src/shared/components/.
 * This file re-exports everything so existing imports don't break during migration.
 *
 * TODO: Update all import sites to use the direct path and delete this file.
 *   Before: import { DomainTile } from '../../components/UIComponents'
 *   After:  import { DomainTile } from '../../shared/components/DomainTile'
 */
export { DomainTile }    from '../shared/components/DomainTile';
export { InsightCard }   from '../shared/components/InsightCard';
export { WorkoutCard }   from '../shared/components/WorkoutCard';
export { CheckinCard }   from '../shared/components/CheckinCard';
export { ExerciseCard }  from '../shared/components/ExerciseCard';
export { SectionHeader } from '../shared/components/SectionHeader';
export { PillButton }    from '../shared/components/PillButton';
export { default as ProjectionGraph } from '../shared/components/ProjectionGraph';

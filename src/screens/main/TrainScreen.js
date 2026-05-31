/**
 * Backward-compatible re-exports.
 * Navigation still imports from here; actual code lives in features/train/screens/.
 * TODO: Update navigation/index.js to import directly from features/train/screens/
 *       and delete this file.
 */
export { TrainScreen }         from '../../features/train/screens/TrainScreen';
export { ActiveSessionScreen } from '../../features/train/screens/ActiveSessionScreen';
export { default as SessionResultScreen } from '../../features/train/screens/SessionResultScreen';

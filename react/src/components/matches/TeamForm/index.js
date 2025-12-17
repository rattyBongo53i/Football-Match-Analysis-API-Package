/**
 * TeamForm Component Index
 *
 * This file provides a clean barrel export for all TeamForm components.
 * Import from this file to access all TeamForm components in one line.
 *
 * Usage example:
 * import { Last10Form, TeamFormStats } from './components/matches/TeamForm';
 */




// Export the main form component for collecting last 10 matches
export { default as Last10Form } from "./Last10Form";

// Export the statistics display component
export { default as TeamFormStats } from "./TeamFormStats";

// Export the individual row component (mainly used internally by Last10Form)
export { default as Last10FormRow } from "./Last10FormRow";

/**
 * Note: useTeamFormCalculator hook is NOT exported from this index file
 * because it's a hook and should be imported directly from its location
 * to follow React Hook rules:
 * import { useTeamFormCalculator } from '../../hooks/useTeamFormCalculator';
 */

/**
 * Available exports:
 * - Last10Form: Complete form for entering last 10 matches
 * - TeamFormStats: Statistics display panel
 * - Last10FormRow: Individual match row (memoized)
 *
 * These components work together to provide football-form collection functionality.
 */

import { useMemo } from 'react';
import { calculateTeamForm } from "./teamFormCalculatorCore";


export const useTeamFormCalculator = (rawForm) => {
  return useMemo(() => calculateTeamForm(rawForm), [rawForm]);
};



// Helper function to create initial form structure
export const createInitialTeamForm = () => {
  return {
    raw_form: [],
    matches_played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_scored: 0,
    goals_conceded: 0,
    avg_goals_scored: 0,
    avg_goals_conceded: 0,
    clean_sheets: 0,
    failed_to_score: 0,
    form_string: '',
    form_rating: 0,
    form_momentum: 0
  };
};

// Helper function to normalize form data for backend
export const normalizeTeamFormForBackend = (rawForm) => {
  if (!Array.isArray(rawForm)) return createInitialTeamForm();
  
//   const calculator = useTeamFormCalculator(rawForm);
  
  return {
    raw_form: rawForm.filter(
      (match) => match && match.opponent && match.result && match.outcome
    ),
    ...calculateTeamForm(rawForm),
  };
};
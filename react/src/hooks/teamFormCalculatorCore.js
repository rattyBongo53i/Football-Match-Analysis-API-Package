export const calculateTeamForm = (rawForm = []) => {
  if (!Array.isArray(rawForm)) {
    return emptyForm();
  }

  const validMatches = rawForm.filter(
    (m) => m && m.opponent && m.result && m.outcome
  );

  let wins = 0,
    draws = 0,
    losses = 0,
    goalsScored = 0,
    goalsConceded = 0,
    cleanSheets = 0,
    failedToScore = 0;

  const formChars = [];

  validMatches.forEach((match) => {
    switch (match.outcome.toUpperCase()) {
      case "W":
        wins++;
        formChars.push("W");
        break;
      case "D":
        draws++;
        formChars.push("D");
        break;
      case "L":
        losses++;
        formChars.push("L");
        break;
      default:
        formChars.push("-");
    }

    const scoreMatch = match.result.match(/(\d+)\s*-\s*(\d+)/);
    if (scoreMatch) {
      const homeGoals = +scoreMatch[1];
      const awayGoals = +scoreMatch[2];

      goalsScored += homeGoals;
      goalsConceded += awayGoals;

      if (awayGoals === 0) cleanSheets++;
      if (homeGoals === 0) failedToScore++;
    }
  });

  const matchesPlayed = validMatches.length;

  const avgScored = matchesPlayed ? goalsScored / matchesPlayed : 0;
  const avgConceded = matchesPlayed ? goalsConceded / matchesPlayed : 0;

  const formRating = matchesPlayed
    ? ((wins * 3 + draws) / (matchesPlayed * 3)) * 10
    : 0;

  /**
   * 🔥 MOMENTUM CALCULATION (last 3 vs previous 3)
   */
  let momentum = 0;

  if (matchesPlayed >= 6) {
    const last3 = validMatches.slice(0, 3);
    const previous3 = validMatches.slice(3, 6);

    const points = (matches) =>
      matches.reduce((sum, match) => {
        switch (match.outcome.toUpperCase()) {
          case "W":
            return sum + 3;
          case "D":
            return sum + 1;
          default:
            return sum;
        }
      }, 0);

    momentum = points(last3) - points(previous3);
  }

  return {
    matches_played: matchesPlayed,
    wins,
    draws,
    losses,
    goals_scored: goalsScored,
    goals_conceded: goalsConceded,
    avg_goals_scored: +avgScored.toFixed(2),
    avg_goals_conceded: +avgConceded.toFixed(2),
    clean_sheets: cleanSheets,
    failed_to_score: failedToScore,
    form_string: formChars.join(""),
    form_rating: +formRating.toFixed(1),
    form_momentum: momentum,
  };
};

const emptyForm = () => ({
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
  form_string: "",
  form_rating: 0,
  form_momentum: 0,
});

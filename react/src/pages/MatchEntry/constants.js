export const INITIAL_FORM_DATA = {
  home_team: "",
  away_team: "",
  league: "",
  match_date: new Date().toISOString().split("T")[0],
  match_time: "15:00",
  venue: "",
  referee: "",
  weather: "Clear",
  status: "scheduled",
  home_score: null,
  away_score: null,
  notes: "",
};

export const WEATHER_OPTIONS = ["Clear", "Cloudy", "Rainy", "Snow", "Windy"];

export const leagueOptions = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Champions League",
  "Europa League",
  "FA Cup",
  "EFL Cup",
  "International Friendly",
];

export const venueOptions = ["Home", "Away", "Neutral"];

export const EMPTY_H2H_MATCH = {
  date: "",
  home_team: "",
  away_team: "",
  score: "",
  result: "",
};

export const steps = [
  "Match Details",
  "Team Forms",
  "Head-to-Head",
  "Markets",
  "Review",
];

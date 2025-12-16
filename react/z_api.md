🎯 MATCH ENDPOINTS
1. GET /api/matches - List all matches with pagination
json
GET /api/matches?page=1&per_page=20&search=query

Response:
{
  "data": [
    {
      "id": 1,
      "home_team": "Manchester United",
      "away_team": "Manchester City",
      "league": "Premier League",
      "match_date": "2024-01-15",
      "match_time": "15:00",
      "venue": "Old Trafford",
      "status": "scheduled",
      "home_score": null,
      "away_score": null,
      "home_form": {
        "last_5": ["W", "D", "L", "W", "W"],
        "position": 3,
        "points": 45,
        "goals_for": 52,
        "goals_against": 28,
        "form_strength": "good"
      },
      "away_form": {...},
      "head_to_head": {
        "home_wins": 5,
        "away_wins": 3,
        "draws": 2,
        "last_5_meetings": ["2-1", "0-0", "3-2", "1-2", "2-2"]
      },
      "markets": [...],
      "created_at": "2024-01-10T10:30:00Z",
      "updated_at": "2024-01-10T10:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 100
  }
}
2. GET /api/matches/{id} - Get single match
json
GET /api/matches/1

Response:
{
  "data": {
    "id": 1,
    "home_team": "Manchester United",
    "away_team": "Manchester City",
    "league": "Premier League",
    // ... all match fields
    "markets": [
      {
        "id": 1,
        "name": "match_result",
        "market_type": "match_result",
        "odds": {
          "home": 2.5,
          "draw": 3.2,
          "away": 2.8
        },
        "outcomes": [
          {
            "outcome": "1",
            "odds": 2.5
          },
          {
            "outcome": "X",
            "odds": 3.2
          },
          {
            "outcome": "2",
            "odds": 2.8
          }
        ]
      },
      {
        "id": 2,
        "name": "over_under_2_5",
        "market_type": "over_under",
        "odds": 1.85,
        "outcomes": [
          {
            "outcome": "Over 2.5",
            "odds": 1.85
          },
          {
            "outcome": "Under 2.5",
            "odds": 1.95
          }
        ]
      }
    ]
  }
}
3. POST /api/matches - Create new match
json
POST /api/matches

Request Body:
{
  "home_team": "Manchester United",
  "away_team": "Manchester City",
  "league": "Premier League",
  "match_date": "2024-01-15",
  "match_time": "15:00",
  "venue": "Old Trafford",
  "referee": "Michael Oliver",
  "weather": "Clear",
  "status": "scheduled",
  "home_score": null,
  "away_score": null,
  "home_form": {
    "last_5": ["W", "D", "L", "W", "W"],
    "position": 3,
    "points": 45,
    "goals_for": 52,
    "goals_against": 28,
    "form_strength": "good"
  },
  "away_form": {...},
  "head_to_head": {
    "home_wins": 5,
    "away_wins": 3,
    "draws": 2
  },
  "markets": [
    {
      "name": "match_result",
      "market_type": "match_result",
      "odds": {
        "home": 2.5,
        "draw": 3.2,
        "away": 2.8
      },
      "outcomes": [
        {
          "outcome": "1",
          "odds": 2.5
        },
        {
          "outcome": "X",
          "odds": 3.2
        },
        {
          "outcome": "2",
          "odds": 2.8
        }
      ]
    },
    {
      "name": "over_under_2_5",
      "market_type": "over_under",
      "odds": 1.85,
      "outcomes": [
        {
          "outcome": "Over 2.5",
          "odds": 1.85
        },
        {
          "outcome": "Under 2.5",
          "odds": 1.95
        }
      ]
    }
  ],
  "notes": "Derby match"
}

Response:
{
  "data": {
    "id": 1,
    // ... created match data
  },
  "message": "Match created successfully"
}
4. PUT /api/matches/{id} - Update match
json
PUT /api/matches/1

Request Body: Same as POST
Response: Updated match data
5. DELETE /api/matches/{id} - Delete match
json
DELETE /api/matches/1

Response:
{
  "message": "Match deleted successfully"
}
6. GET /api/matches/betslip - Get matches for betslip (optional)
json
GET /api/matches/betslip?match_ids=1,2,3,4,5

Response:
{
  "data": [
    // Array of match objects
  ]
}
🎯 JOB/ANALYSIS ENDPOINTS
7. POST /api/jobs/analyze-betslip - Trigger ML analysis
json
POST /api/jobs/analyze-betslip

Request Body:
{
  "match_ids": [1, 2, 3, 4, 5],
  "job_type": "ml_analysis"
}

Response:
{
  "job_id": "job_12345",
  "status": "pending",
  "message": "Analysis job queued successfully"
}
8. GET /api/jobs/{job_id}/status - Check job status
json
GET /api/jobs/job_12345/status

Response:
{
  "job_id": "job_12345",
  "status": "running", // or "pending", "completed", "failed"
  "progress": 65,
  "estimated_completion": "2024-01-10T11:30:00Z",
  "started_at": "2024-01-10T10:30:00Z",
  "updated_at": "2024-01-10T11:15:00Z"
}
9. GET /api/jobs/{job_id}/results - Get analysis results
json
GET /api/jobs/job_12345/results

Response (when completed):
{
  "job_id": "job_12345",
  "status": "completed",
  "results": {
    "accumulators": [
      {
        "id": "acc_1",
        "matches": [1, 2, 3],
        "total_odds": 12.5,
        "probability": 8.2,
        "recommended_stake": 25.0,
        "expected_value": 1.15,
        "markets": ["match_result", "over_under_2_5"],
        "confidence_score": 0.85
      },
      {
        "id": "acc_2",
        "matches": [1, 4, 5],
        "total_odds": 8.3,
        "probability": 12.1,
        "recommended_stake": 35.0,
        "expected_value": 1.08,
        "markets": ["match_result", "both_teams_score"],
        "confidence_score": 0.78
      }
    ],
    "summary": {
      "total_accumulators_generated": 15,
      "best_value_acc_id": "acc_1",
      "average_confidence": 0.76,
      "total_matches_analyzed": 5
    },
    "analysis_metadata": {
      "model_version": "v2.1.0",
      "analysis_time": "45 seconds",
      "generated_at": "2024-01-10T11:30:00Z"
    }
  }
}
🎯 MARKET ENDPOINTS (if separate)
10. GET /api/markets - List market types (optional)
json
GET /api/markets

Response:
{
  "data": [
    {
      "id": 1,
      "name": "match_result",
      "display_name": "1X2",
      "description": "Match result (Home win, Draw, Away win)",
      "outcome_structure": ["1", "X", "2"],
      "is_active": true
    },
    {
      "id": 2,
      "name": "over_under_2_5",
      "display_name": "Over/Under 2.5",
      "description": "Total goals over/under 2.5",
      "outcome_structure": ["Over", "Under"],
      "is_active": true
    },
    {
      "id": 3,
      "name": "both_teams_score",
      "display_name": "Both Teams to Score",
      "description": "Both teams score in the match",
      "outcome_structure": ["Yes", "No"],
      "is_active": true
    }
  ]
}
🎯 STATISTICS ENDPOINTS (optional)
11. GET /api/stats/matches - Match statistics
json
GET /api/stats/matches

Response:
{
  "total_matches": 150,
  "by_status": {
    "scheduled": 45,
    "ongoing": 5,
    "completed": 95,
    "cancelled": 5
  },
  "by_league": {
    "Premier League": 30,
    "La Liga": 25,
    "Serie A": 20
  },
  "recent_activity": [
    {
      "date": "2024-01-10",
      "matches_added": 5,
      "analysis_run": 2
    }
  ]
}



// routes/api.php

Route::prefix('api')->group(function () {
    // Match endpoints
    Route::apiResource('matches', MatchController::class);
    Route::get('matches/betslip', [MatchController::class, 'betslip']);
    
    // Job/analysis endpoints
    Route::prefix('jobs')->group(function () {
        Route::post('analyze-betslip', [JobController::class, 'analyzeBetslip']);
        Route::get('{job}/status', [JobController::class, 'status']);
        Route::get('{job}/results', [JobController::class, 'results']);
    });
    
    // Market endpoints (optional)
    Route::apiResource('markets', MarketController::class)->only(['index']);
    
    // Statistics endpoints (optional)
    Route::get('stats/matches', [StatsController::class, 'matches']);
});
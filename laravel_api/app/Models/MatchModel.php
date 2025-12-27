<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Model;

    class MatchModel extends Model
    {
        use HasFactory;

        protected $table = 'matches';

        protected $fillable = [
            'home_team',
            'away_team',
            'league',
            'match_date',
            'status',
            'sport',
            'home_score',
            'away_score',

            // Updated columns
            'home_form',
            'away_form',
            'head_to_head',

            'home_team_id',
            'away_team_id',
            'competition',
            'venue',
            'weather_conditions', // renamed from weather
            'referee',
            'importance',
            'tv_coverage',
            'predicted_attendance',
            'for_ml_training',
            'prediction_ready',

            // ML analysis columns (if you have them)
            'analysis_home_win_probability',
            'analysis_draw_probability',
            'analysis_away_win_probability',
            'analysis_confidence',
            'analysis_prediction',

            // Status & timestamps
            'analysis_status',
            'analysis_started_at',
            'analysis_completed_at',
            'analysis_failed_at',
            'analysis_error',
        ];

        protected $casts = [
            'match_date' => 'datetime',
            'odds' => 'array',
            'home_form' => 'array',
            'away_form' => 'array',
            'head_to_head' => 'array',
            'for_ml_training' => 'boolean',
            'prediction_ready' => 'boolean',
            'predicted_attendance' => 'integer',
        ];

        // =======================
        //      Relationships
        // =======================

        public function markets()
        {
            return $this->belongsToMany(
                Market::class,
                'match_markets',     // ← your actual pivot table name
                'match_id',          // ← foreign key for MatchModel
                'market_id'          // ← foreign key for Market
            )
                ->withPivot('odds', 'market_data', 'is_active') // ← any extra columns
                ->withTimestamps();
        }

        public function headToHead()
        {
            return $this->hasOne(Head_To_Head::class, 'match_id');
        }

        public function teamForms()
        {
            return $this->hasMany(Team_Form::class, 'match_id');
        }

        public function matchMarkets()
        {
            return $this->hasMany(MatchMarket::class, 'match_id');
        }

    // public function slipMatches()
    // {
    //     return $this->hasMany(SlipMatch::class, 'match_id');
    // }

    public function predictions()
    {
        return $this->hasMany(Prediction::class, 'match_id');
    }

    public function historicalResults()
    {
        return $this->hasMany(HistoricalResults::class, 'match_id');
    }

    // =======================
    //      Team Relationships
    // =======================

    public function homeTeam()
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }

    public function awayTeam()
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }

    public function masterSlip()
    {
        return $this->hasOne(MasterSlip::class, 'match_id');
    }

    
    // =======================
    //      Slip Relationships
    // =======================

    public function masterSlips()
    {
        return $this->belongsToMany(MasterSlip::class, 'master_slip_matches', 'match_id', 'master_slip_id')
            ->using(MasterSlipMatch::class)
            ->withPivot('id', 'market', 'selection', 'odds', 'match_data', 'created_at', 'updated_at')
            ->withTimestamps();
    }

    public function slipMatches()
    {
        return $this->hasMany(MasterSlipMatch::class, 'match_id');
    }


    public function masterSlipMatches()
    {
        return $this->hasMany(MasterSlipMatch::class, 'master_slip_id', 'id');
    }


}
--
-- Table structure for table `predictions`
--

CREATE TABLE `predictions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `match_id` bigint(20) UNSIGNED NOT NULL,
  `model_type` enum('monte_carlo','ml_model','expert','hybrid') DEFAULT 'hybrid',
  `model_version` varchar(50) DEFAULT NULL,
  `predicted_home_score` int(11) DEFAULT NULL,
  `predicted_away_score` int(11) DEFAULT NULL,
  `predicted_result` enum('H','D','A') DEFAULT NULL,
  `home_win_probability` decimal(5,4) DEFAULT NULL,
  `draw_probability` decimal(5,4) DEFAULT NULL,
  `away_win_probability` decimal(5,4) DEFAULT NULL,
  `over_2_5_probability` decimal(5,4) DEFAULT NULL,
  `both_teams_score_probability` decimal(5,4) DEFAULT NULL,
  `confidence_score` decimal(5,4) DEFAULT NULL,
  `analysis_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`analysis_details`)),
  `is_primary` tinyint(1) DEFAULT 0,
  `generated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------

-- --------------------------------------------------------

--
-- Table structure for table `slips`
--

CREATE TABLE `slips` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('single','accumulator','system','alternative') DEFAULT 'accumulator',
  `source_type` enum('manual','generated','imported') DEFAULT 'manual',
  `source_id` bigint(20) UNSIGNED DEFAULT NULL,
  `stake` decimal(10,2) DEFAULT 0.00,
  `total_odds` decimal(10,2) DEFAULT NULL,
  `estimated_payout` decimal(10,2) DEFAULT NULL,
  `status` enum('draft','active','won','lost','void') DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `slip_matches`
--

CREATE TABLE `slip_matches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slip_id` bigint(20) UNSIGNED NOT NULL,
  `match_id` bigint(20) UNSIGNED NOT NULL,
  `selection_type` varchar(100) NOT NULL,
  `selection` varchar(100) NOT NULL,
  `odds` decimal(8,2) NOT NULL,
  `status` enum('pending','won','lost','void') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teams`
--

CREATE TABLE `teams` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `league` varchar(100) DEFAULT NULL,
  `overall_rating` decimal(5,2) DEFAULT 50.00,
  `form_rating` decimal(5,2) DEFAULT 50.00,
  `current_form` varchar(10) DEFAULT NULL COMMENT 'Last 5-10 matches results',
  `momentum` decimal(5,2) DEFAULT 0.00,
  `matches_played` int(11) DEFAULT 0,
  `wins` int(11) DEFAULT 0,
  `draws` int(11) DEFAULT 0,
  `losses` int(11) DEFAULT 0,
  `goals_scored` int(11) DEFAULT 0,
  `goals_conceded` int(11) DEFAULT 0,
  `goal_difference` int(11) DEFAULT 0,
  `points` int(11) DEFAULT 0,
  `league_position` int(11) DEFAULT NULL,
  `fair_odds_home_win` decimal(6,2) DEFAULT NULL,
  `fair_odds_draw` decimal(6,2) DEFAULT NULL,
  `fair_odds_away_win` decimal(6,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teams`
--

INSERT INTO `teams` (`id`, `name`, `code`, `country`, `league`, `overall_rating`, `form_rating`, `current_form`, `momentum`, `matches_played`, `wins`, `draws`, `losses`, `goals_scored`, `goals_conceded`, `goal_difference`, `points`, `league_position`, `fair_odds_home_win`, `fair_odds_draw`, `fair_odds_away_win`, `created_at`, `updated_at`, `deleted_at`) VALUES
(23, 'Villarreal', 'VIL', 'Spain', NULL, 5.00, 50.00, NULL, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, '2025-12-21 03:34:17', '2025-12-21 03:34:17', NULL),
(24, 'Barcelona', 'BAR', 'Spain', NULL, 5.00, 50.00, NULL, 0.00, 0, 0, 0, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL, '2025-12-21 03:34:17', '2025-12-21 03:34:17', NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `team_betting_stats`
-- (See below for the actual view)
--
CREATE TABLE `team_betting_stats` (
`id` bigint(20) unsigned
,`name` varchar(255)
,`code` varchar(10)
,`overall_rating` decimal(5,2)
,`form_rating` decimal(5,2)
,`current_form` varchar(10)
,`matches_played` int(11)
,`win_percentage` decimal(15,1)
,`draw_percentage` decimal(15,1)
,`loss_percentage` decimal(15,1)
,`avg_goals_scored` decimal(14,2)
,`avg_goals_conceded` decimal(14,2)
,`fair_odds_home_win` decimal(6,2)
,`fair_odds_draw` decimal(6,2)
,`fair_odds_away_win` decimal(6,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `team_forms`
--

CREATE TABLE `team_forms` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `team_id` varchar(255) NOT NULL,
  `team_old_id` bigint(20) UNSIGNED DEFAULT NULL,
  `match_id` bigint(20) NOT NULL,
  `venue` enum('home','away') NOT NULL DEFAULT 'home',
  `form_rating` decimal(5,2) DEFAULT 50.00,
  `raw_form` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_form`)),
  `form_momentum` decimal(5,2) DEFAULT 0.00,
  `matches_played` int(11) DEFAULT 0,
  `wins` int(11) DEFAULT 0,
  `draws` int(11) DEFAULT 0,
  `losses` int(11) DEFAULT 0,
  `goals_scored` int(11) DEFAULT 0,
  `goals_conceded` int(11) DEFAULT 0,
  `avg_goals_scored` decimal(4,2) DEFAULT 0.00,
  `avg_goals_conceded` decimal(4,2) DEFAULT 0.00,
  `clean_sheets` int(11) DEFAULT 0,
  `failed_to_score` int(11) DEFAULT 0,
  `form_string` varchar(20) DEFAULT NULL,
  `win_probability` decimal(5,4) DEFAULT NULL,
  `analysis_period` enum('last5','last10','last20','season') DEFAULT 'last10',
  `calculated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- Stand-in structure for view `team_form_analysis`
-- (See below for the actual view)
--
CREATE TABLE `team_form_analysis` (
`team_id` varchar(255)
,`venue` enum('home','away')
,`avg_form_rating` decimal(9,6)
,`avg_momentum` decimal(9,6)
,`avg_win_prob` decimal(9,8)
,`total_wins` decimal(32,0)
,`total_draws` decimal(32,0)
,`total_losses` decimal(32,0)
,`avg_scored` decimal(8,6)
,`avg_conceded` decimal(8,6)
);

-
-- Indexes for table `alternative_slips`
--
ALTER TABLE `alternative_slips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alternative_slips_master_slip_id_foreign` (`master_slip_id`),
  ADD KEY `alternative_slips_ranking_index` (`ranking`),
  ADD KEY `alternative_slips_expected_value_index` (`expected_value`);

--
-- Indexes for table `alternative_slip_selections`
--
ALTER TABLE `alternative_slip_selections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alternative_slip_selections_alternative_slip_id_foreign` (`alternative_slip_id`),
  ADD KEY `alternative_slip_selections_match_id_foreign` (`match_id`),
  ADD KEY `alternative_slip_selections_original_selection_id_foreign` (`original_selection_id`);

--
-- Indexes for table `analysis_jobs`
--
ALTER TABLE `analysis_jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `analysis_jobs_status_index` (`status`),
  ADD KEY `analysis_jobs_job_type_index` (`job_type`),
  ADD KEY `analysis_jobs_reference_id_reference_type_index` (`reference_id`,`reference_type`);


--
-- Indexes for table `generated_slips`
--
ALTER TABLE `generated_slips`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `generated_slips_slip_id_unique` (`slip_id`),
  ADD KEY `generated_slips_master_slip_id_confidence_score_index` (`master_slip_id`,`confidence_score`);

--
-- Indexes for table `generated_slip_legs`
--
ALTER TABLE `generated_slip_legs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `generated_slip_legs_generated_slip_id_index` (`generated_slip_id`);

--
-- Indexes for table `generator_jobs`
--
ALTER TABLE `generator_jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `generator_jobs_master_slip_id_index` (`master_slip_id`),
  ADD KEY `generator_jobs_analysis_job_id_foreign` (`analysis_job_id`),
  ADD KEY `generator_jobs_status_index` (`status`);

--
-- Indexes for table `head_to_head`
--
ALTER TABLE `head_to_head`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `head_to_head_team1_name_team2_name_unique` (`home_name`,`away_name`),
  ADD KEY `head_to_head_team1_id_index` (`home_id`),
  ADD KEY `head_to_head_team2_id_index` (`away_id`);

--
-- Indexes for table `historical_results`
--
ALTER TABLE `historical_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `historical_results_date_index` (`date`),
  ADD KEY `historical_results_home_team_away_team_index` (`home_team`,`away_team`),
  ADD KEY `historical_results_head_to_head_id_foreign` (`head_to_head_id`);

--

--
-- Indexes for table `markets`
--
ALTER TABLE `markets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `markets_slug_unique` (`slug`),
  ADD KEY `markets_market_type_index` (`market_type`),
  ADD KEY `markets_sort_order_index` (`sort_order`);

--
-- Indexes for table `market_outcomes`
--
ALTER TABLE `market_outcomes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `market_outcomes_market_id_outcome_unique` (`market_id`,`outcome`),
  ADD KEY `market_outcomes_market_id_index` (`market_id`);

--
-- Indexes for table `master_slips`
--
ALTER TABLE `master_slips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `master_slips_user_id_index` (`user_id`),
  ADD KEY `master_slips_status_index` (`status`),
  ADD KEY `master_slips_engine_status_index` (`engine_status`);

--
-- Indexes for table `master_slip_matches`
--
ALTER TABLE `master_slip_matches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `master_slip_matches_master_slip_id_match_id_unique` (`master_slip_id`,`match_id`),
  ADD KEY `master_slip_matches_match_id_foreign` (`match_id`);

--
-- Indexes for table `master_slip_selections`
--
ALTER TABLE `master_slip_selections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `master_slip_selections_master_slip_id_foreign` (`master_slip_id`),
  ADD KEY `master_slip_selections_match_id_foreign` (`match_id`),
  ADD KEY `master_slip_selections_match_market_id_foreign` (`match_market_id`);

--
-- Indexes for table `matches`
--
ALTER TABLE `matches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `matches_match_date_index` (`match_date`),
  ADD KEY `matches_status_index` (`status`),
  ADD KEY `matches_league_index` (`league`),
  ADD KEY `matches_home_form_id_foreign` (`home_form_id`),
  ADD KEY `matches_away_form_id_foreign` (`away_form_id`),
  ADD KEY `matches_head_to_head_id_foreign` (`head_to_head_id`);

--
-- Indexes for table `match_markets`
--
ALTER TABLE `match_markets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `match_markets_match_id_market_id_unique` (`match_id`,`market_id`),
  ADD KEY `match_markets_match_id_index` (`match_id`),
  ADD KEY `match_markets_market_id_index` (`market_id`);

--
-- Indexes for table `match_market_outcomes`
--
ALTER TABLE `match_market_outcomes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `match_market_outcomes_match_market_id_outcome_unique` (`match_market_id`,`outcome`),
  ADD KEY `match_market_outcomes_match_market_id_index` (`match_market_id`),
  ADD KEY `match_market_outcomes_market_outcome_id_foreign` (`market_outcome_id`);

--
-- Indexes for t



-- AUTO_INCREMENT for table `slips`
--
ALTER TABLE `slips`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `slip_matches`
--
ALTER TABLE `slip_matches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `team_forms`
--
ALTER TABLE `team_forms`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alternatived_slips`
--
ALTER TABLE `alternatived_slips`
  ADD CONSTRAINT `alternatived_slips_master_slip_id_foreign` FOREIGN KEY (`master_slip_id`) REFERENCES `master_slips` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `alternative_slips`
--
ALTER TABLE `alternative_slips`
  ADD CONSTRAINT `alternative_slips_master_slip_id_foreign` FOREIGN KEY (`master_slip_id`) REFERENCES `master_slips` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `alternative_slip_selections`
--
ALTER TABLE `alternative_slip_selections`
  ADD CONSTRAINT `alternative_slip_selections_alternative_slip_id_foreign` FOREIGN KEY (`alternative_slip_id`) REFERENCES `alternative_slips` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alternative_slip_selections_match_id_foreign` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `alternative_slip_selections_original_selection_id_foreign` FOREIGN KEY (`original_selection_id`) REFERENCES `master_slip_selections` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `generated_slips`
--
ALTER TABLE `generated_slips`
  ADD CONSTRAINT `generated_slips_master_slip_id_foreign` FOREIGN KEY (`master_slip_id`) REFERENCES `master_slips` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `generated_slip_legs`
--
ALTER TABLE `generated_slip_legs`
  ADD CONSTRAINT `generated_slip_legs_generated_slip_id_foreign` FOREIGN KEY (`generated_slip_id`) REFERENCES `generated_slips` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `generator_jobs`
--
ALTER TABLE `generator_jobs`
  ADD CONSTRAINT `generator_jobs_analysis_job_id_foreign` FOREIGN KEY (`analysis_job_id`) REFERENCES `analysis_jobs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `generator_jobs_master_slip_id_foreign` FOREIGN KEY (`master_slip_id`) REFERENCES `master_slips` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `head_to_head`
--
ALTER TABLE `head_to_head`
  ADD CONSTRAINT `head_to_head_team1_id_foreign` FOREIGN KEY (`home_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `head_to_head_team2_id_foreign` FOREIGN KEY (`away_id`) REFERENCES `teams` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `historical_results`
--
ALTER TABLE `historical_results`
  ADD CONSTRAINT `historical_results_head_to_head_id_foreign` FOREIGN KEY (`head_to_head_id`) REFERENCES `head_to_head` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `market_outcomes`
--
ALTER TABLE `market_outcomes`
  ADD CONSTRAINT `market_outcomes_market_id_foreign` FOREIGN KEY (`market_id`) REFERENCES `markets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `master_slips`
--
ALTER TABLE `master_slips`
  ADD CONSTRAINT `master_slips_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `master_slip_matches`
--
ALTER TABLE `master_slip_matches`
  ADD CONSTRAINT `master_slip_matches_master_slip_id_foreign` FOREIGN KEY (`master_slip_id`) REFERENCES `master_slips` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `master_slip_matches_match_id_foreign` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `master_slip_selections`
--
ALTER TABLE `master_slip_selections`
  ADD CONSTRAINT `master_slip_selections_master_slip_id_foreign` FOREIGN KEY (`master_slip_id`) REFERENCES `master_slips` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `master_slip_selections_match_id_foreign` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `master_slip_selections_match_market_id_foreign` FOREIGN KEY (`match_market_id`) REFERENCES `match_markets` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `matches`
--
ALTER TABLE `matches`
  ADD CONSTRAINT `matches_away_form_id_foreign` FOREIGN KEY (`away_form_id`) REFERENCES `team_forms` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `matches_head_to_head_id_foreign` FOREIGN KEY (`head_to_head_id`) REFERENCES `head_to_head` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `matches_home_form_id_foreign` FOREIGN KEY (`home_form_id`) REFERENCES `team_forms` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `match_markets`
--
ALTER TABLE `match_markets`
  ADD CONSTRAINT `match_markets_market_id_foreign` FOREIGN KEY (`market_id`) REFERENCES `markets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `match_markets_match_id_foreign` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `match_market_outcomes`
--
ALTER TABLE `match_market_outcomes`
  ADD CONSTRAINT `match_market_outcomes_market_outcome_id_foreign` FOREIGN KEY (`market_outcome_id`) REFERENCES `market_outcomes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `match_market_outcomes_match_market_id_foreign` FOREIGN KEY (`match_market_id`) REFERENCES `match_markets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `predictions`
--
ALTER TABLE `predictions`
  ADD CONSTRAINT `predictions_match_id_foreign` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `slips`
--
ALTER TABLE `slips`
  ADD CONSTRAINT `slips_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `slip_matches`
--
ALTER TABLE `slip_matches`
  ADD CONSTRAINT `slip_matches_match_id_foreign` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `slip_matches_slip_id_foreign` FOREIGN KEY (`slip_id`) REFERENCES `slips` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `team_forms`
--
ALTER TABLE `team_forms`
  ADD CONSTRAINT `team_forms_team_id_foreign` FOREIGN KEY (`team_old_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;



-- AUTO_INCREMENT for table `alternatived_slips`
--
ALTER TABLE `alternatived_slips`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `alternative_slips`
--
ALTER TABLE `alternative_slips`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `alternative_slip_selections`
--
ALTER TABLE `alternative_slip_selections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `analysis_jobs`
--
ALTER TABLE `analysis_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `generated_slips`
--
ALTER TABLE `generated_slips`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `generated_slip_legs`
--
ALTER TABLE `generated_slip_legs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `generator_jobs`
--
ALTER TABLE `generator_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `head_to_head`
--
ALTER TABLE `head_to_head`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `historical_results`
--
ALTER TABLE `historical_results`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `markets`
--
ALTER TABLE `markets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `market_outcomes`
--
ALTER TABLE `market_outcomes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `master_slips`
--
ALTER TABLE `master_slips`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `master_slip_matches`
--
ALTER TABLE `master_slip_matches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_slip_selections`
--
ALTER TABLE `master_slip_selections`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `matches`
--
ALTER TABLE `matches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `match_markets`
--
ALTER TABLE `match_markets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `match_market_outcomes`
--
ALTER TABLE `match_market_outcomes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `migrations`
--
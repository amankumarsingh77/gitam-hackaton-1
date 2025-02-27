package repository

// SQL queries for leaderboard operations

const (
	// Create leaderboard table
	// createLeaderboardTableQuery = `
	// 	CREATE TABLE IF NOT EXISTS leaderboard_entries (
	// 		entry_id UUID PRIMARY KEY,
	// 		user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
	// 		xp INT NOT NULL DEFAULT 0,
	// 		level INT NOT NULL DEFAULT 1,
	// 		streak INT NOT NULL DEFAULT 0,
	// 		rank INT NOT NULL DEFAULT 0,
	// 		subject VARCHAR(50),
	// 		grade INT,
	// 		created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	// 		updated_at TIMESTAMP NOT NULL DEFAULT NOW()
	// 	);

	// 	CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_entries(rank);
	// 	CREATE INDEX IF NOT EXISTS idx_leaderboard_xp ON leaderboard_entries(xp);
	// 	CREATE INDEX IF NOT EXISTS idx_leaderboard_subject ON leaderboard_entries(subject);
	// 	CREATE INDEX IF NOT EXISTS idx_leaderboard_grade ON leaderboard_entries(grade);
	// `

	// Base leaderboard query for selecting entries
	baseLeaderboardQuery = `
		SELECT 
			le.entry_id, le.user_id, u.username, u.avatar_url, 
			le.xp, le.level, le.streak, le.rank, 
			le.created_at, le.updated_at
		FROM leaderboard_entries le
		JOIN users u ON le.user_id = u.user_id
	`

	// Get leaderboard entries with filtering
	getLeaderboardBaseQuery = baseLeaderboardQuery + `
		WHERE 1=1
	`

	// Count leaderboard entries with filtering
	countLeaderboardBaseQuery = `
		SELECT COUNT(*) FROM leaderboard_entries le
		WHERE 1=1
	`

	// Get user rank
	getUserRankQuery = baseLeaderboardQuery + `
		WHERE le.user_id = $1
	`

	// Update user stats
	updateUserStatsQuery = `
		INSERT INTO leaderboard_entries (
			entry_id, user_id, xp, level, streak, rank, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, NOW(), NOW()
		) ON CONFLICT (user_id) DO UPDATE SET
			xp = $3,
			level = $4,
			streak = $5,
			updated_at = NOW()
		RETURNING entry_id, created_at, updated_at
	`

	// Recalculate rankings
	recalculateRankingsQuery = `
		WITH ranked_users AS (
			SELECT
				entry_id,
				user_id,
				xp,
				level,
				streak,
				ROW_NUMBER() OVER (ORDER BY xp DESC, streak DESC, level DESC) as new_rank
			FROM leaderboard_entries
		)
		UPDATE leaderboard_entries le
		SET rank = ru.new_rank
		FROM ranked_users ru
		WHERE le.entry_id = ru.entry_id
	`

	// Time frame conditions
	dailyTimeFrameCondition   = "le.updated_at > NOW() - INTERVAL '1 day'"
	weeklyTimeFrameCondition  = "le.updated_at > NOW() - INTERVAL '7 days'"
	monthlyTimeFrameCondition = "le.updated_at > NOW() - INTERVAL '30 days'"

	// Get top performers by XP
	getTopPerformersByXPQuery = baseLeaderboardQuery + `
		ORDER BY le.xp DESC
		LIMIT $1
	`

	// Get top performers by streak
	getTopPerformersByStreakQuery = baseLeaderboardQuery + `
		ORDER BY le.streak DESC
		LIMIT $1
	`

	// Get top performers by level
	getTopPerformersByLevelQuery = baseLeaderboardQuery + `
		ORDER BY le.level DESC
		LIMIT $1
	`

	// Get top performers by rank
	getTopPerformersByRankQuery = baseLeaderboardQuery + `
		ORDER BY le.rank ASC
		LIMIT $1
	`
)

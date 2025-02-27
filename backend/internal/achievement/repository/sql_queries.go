package repository

// Achievement queries
const (
	// Achievement management
	createAchievementQuery = `
		INSERT INTO achievements (achievement_id, title, description, type, required_value, icon_url, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING *
	`

	getAchievementByIDQuery = `
		SELECT * FROM achievements WHERE achievement_id = $1
	`

	getAllAchievementsQuery = `
		SELECT * FROM achievements ORDER BY created_at DESC
	`

	updateAchievementQuery = `
		UPDATE achievements
		SET title = $1, description = $2, type = $3, required_value = $4, icon_url = $5
		WHERE achievement_id = $6
		RETURNING *
	`

	deleteAchievementQuery = `
		DELETE FROM achievements WHERE achievement_id = $1
	`

	// User achievement management
	getUserAchievementsQuery = `
		SELECT a.*
		FROM achievements a
		JOIN user_achievements ua ON a.achievement_id = ua.achievement_id
		WHERE ua.user_id = $1
		ORDER BY ua.earned_at DESC
	`

	awardAchievementToUserQuery = `
		INSERT INTO user_achievements (user_achievement_id, user_id, achievement_id, earned_at, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	checkUserHasAchievementQuery = `
		SELECT EXISTS(
			SELECT 1 FROM user_achievements
			WHERE user_id = $1 AND achievement_id = $2
		)
	`
)

// User Progress queries
const (
	getUserStreakQuery = `
		SELECT streak FROM users WHERE user_id = $1
	`

	getUserSubjectProgressQuery = `
		SELECT * FROM user_progress WHERE user_id = $1
	`

	getUserXPQuery = `
		SELECT xp FROM users WHERE user_id = $1
	`
)

// Lesson Progress queries
const (
	getUserCompletedLessonsCountQuery = `
		SELECT COUNT(*) FROM lesson_progress
		WHERE user_id = $1 AND status = 'completed'
	`
)

// Quiz Attempts queries
const (
	getUserHighestQuizScoreQuery = `
		SELECT COALESCE(MAX(score), 0) FROM user_quiz_attempts
		WHERE user_id = $1
	`

	getUserQuizAttemptsCountQuery = `
		SELECT COUNT(*) FROM user_quiz_attempts
		WHERE user_id = $1
	`
)

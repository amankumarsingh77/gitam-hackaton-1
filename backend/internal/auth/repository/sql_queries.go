package repository

const (
	createUserQuery = `
		INSERT INTO users (first_name, last_name, email, password, grade, avatar, xp, streak, last_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING *
	`

	updateUserQuery = `
		UPDATE users
		SET first_name = $1, last_name = $2, email = $3, grade = $4, updated_at = now()
		WHERE user_id = $5
		RETURNING *
	`

	updateAvatarQuery = `
		UPDATE users
		SET avatar = $1, updated_at = now()
		WHERE user_id = $2
		RETURNING *
	`

	getUserByIDQuery = `
		SELECT * FROM users WHERE user_id = $1
	`

	getUserByEmailQuery = `
		SELECT * FROM users WHERE email = $1
	`

	createUserProgressQuery = `
		INSERT INTO user_progress (user_id, subject, grade, chapters_read, quizzes_taken, avg_score)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	getUserProgressQuery = `
		SELECT * FROM user_progress 
		WHERE user_id = $1 AND subject = $2 AND grade = $3
	`

	updateUserProgressQuery = `
		UPDATE user_progress
		SET chapters_read = $1, quizzes_taken = $2, avg_score = $3, updated_at = now()
		WHERE progress_id = $4
	`

	createDailyStreakQuery = `
		INSERT INTO daily_streaks (user_id, current_streak, max_streak, last_activity)
		VALUES ($1, $2, $3, $4)
	`

	getDailyStreakQuery = `
		SELECT * FROM daily_streaks WHERE user_id = $1
	`

	updateDailyStreakQuery = `
		UPDATE daily_streaks
		SET current_streak = $1, max_streak = $2, last_activity = $3, updated_at = now()
		WHERE streak_id = $4
	`

	deleteUserQuery = `DELETE FROM users WHERE user_id = $1`

	// getUserQuery = `SELECT user_id, first_name, last_name, email, role, about, avatar, phone_number,
	//    				 address, city, gender, postcode, birthday, created_at, updated_at, login_date
	// 				 FROM users
	// 				 WHERE user_id = $1`

	getTotalCount = `SELECT COUNT(user_id) FROM users 
						WHERE first_name ILIKE '%' || $1 || '%' or last_name ILIKE '%' || $1 || '%'`

	findUsers = `SELECT user_id, first_name, last_name, email, role, about, avatar, phone_number, address,
	              city, gender, postcode, birthday, created_at, updated_at, login_date 
				  FROM users 
				  WHERE first_name ILIKE '%' || $1 || '%' or last_name ILIKE '%' || $1 || '%'
				  ORDER BY first_name, last_name
				  OFFSET $2 LIMIT $3
				  `

	getTotal = `SELECT COUNT(user_id) FROM users`

	getUsers = `SELECT user_id, first_name, last_name, email, role, about, avatar, phone_number, 
       			 address, city, gender, postcode, birthday, created_at, updated_at, login_date
				 FROM users 
				 ORDER BY COALESCE(NULLIF($1, ''), first_name) OFFSET $2 LIMIT $3`

	findUserByEmail = `SELECT user_id, first_name, last_name, email, role, about, avatar, phone_number, 
       			 		address, city, gender, postcode, birthday, created_at, updated_at, login_date, password
				 		FROM users 
				 		WHERE email = $1`
)

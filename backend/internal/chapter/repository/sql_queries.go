package repository

const (
	createChapterQuery = `
		INSERT INTO chapters (title, description, grade, subject, "order", is_custom, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING *
	`

	getChapterByIDQuery = `
		SELECT * FROM chapters WHERE chapter_id = $1
	`

	getChaptersBySubjectQuery = `
		SELECT * FROM chapters 
		WHERE subject = $1 AND grade = $2
		ORDER BY "order" ASC
	`

	updateChapterQuery = `
		UPDATE chapters 
		SET title = $1, description = $2
		WHERE chapter_id = $3
		RETURNING *
	`

	deleteChapterQuery = `
		DELETE FROM chapters WHERE chapter_id = $1
	`

	createLessonQuery = `
		INSERT INTO lessons (chapter_id, title, description, content, grade, subject, "order", is_custom, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING lesson_id
	`

	getLessonsByChapterQuery = `
		SELECT * FROM lessons 
		WHERE chapter_id = $1
		ORDER BY "order" ASC
	`

	getCustomLessonsByChapterQuery = `
		SELECT * FROM lessons 
		WHERE chapter_id = $1 AND is_custom = true
		ORDER BY "order" ASC
	`

	createLessonMediaQuery = `
		INSERT INTO lesson_media (lesson_id, media_type, url, description)
		VALUES ($1, $2, $3, $4)
		RETURNING *
	`

	getLessonMediaByChapterQuery = `
		SELECT m.* FROM lesson_media m
		JOIN lessons l ON l.lesson_id = m.lesson_id
		WHERE l.chapter_id = $1
	`

	createQuizQuery = `
		INSERT INTO quizzes (lesson_id, title, description, time_limit)
		VALUES ($1, $2, $3, $4)
		RETURNING *
	`

	getQuizByChapterQuery = `
		SELECT q.* FROM quizzes q
		JOIN lessons l ON l.lesson_id = q.lesson_id
		WHERE l.chapter_id = $1
		LIMIT 1
	`

	getQuizByIDQuery = `
		SELECT * FROM quizzes WHERE quiz_id = $1
	`

	createQuestionQuery = `
		INSERT INTO questions (quiz_id, text, question_type, options, answer, explanation, points, difficulty)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING *
	`

	getQuestionsByQuizIDQuery = `
		SELECT * FROM questions 
		WHERE quiz_id = $1
		ORDER BY created_at ASC
	`

	getQuestionByIDQuery = `
		SELECT * FROM questions WHERE question_id = $1
	`

	createQuizAttemptQuery = `
		INSERT INTO user_quiz_attempts (user_id, quiz_id, score, time_spent, completed_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *
	`

	createQuestionResponseQuery = `
		INSERT INTO user_question_responses (attempt_id, question_id, user_answer, is_correct)
		VALUES ($1, $2, $3, $4)
		RETURNING *
	`

	getLessonByIDQuery = `
		SELECT * FROM lessons WHERE lesson_id = $1
	`

	getUserCustomChaptersQuery = `
		SELECT * FROM chapters 
		WHERE created_by = $1 AND is_custom = true
		ORDER BY created_at DESC
	`
)

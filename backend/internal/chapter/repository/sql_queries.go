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
		SET title = $1, description = $2, updated_at = now()
		WHERE chapter_id = $3
		RETURNING *
	`

	deleteChapterQuery = `
		DELETE FROM chapters WHERE chapter_id = $1
	`

	createLessonMediaQuery = `
		INSERT INTO lesson_media (lesson_id, media_type, url, description)
		VALUES ($1, $2, $3, $4)
	`

	getLessonMediaByChapterQuery = `
		SELECT m.* FROM lesson_media m
		JOIN lessons l ON m.lesson_id = l.lesson_id
		WHERE l.chapter_id = $1
	`

	createQuizQuery = `
		INSERT INTO quizzes (lesson_id, title, description, time_limit)
		VALUES ($1, $2, $3, $4)
	`

	getQuizByChapterQuery = `
		SELECT q.* FROM quizzes q
		JOIN lessons l ON q.lesson_id = l.lesson_id
		WHERE l.chapter_id = $1
	`

	createQuestionQuery = `
		INSERT INTO questions (quiz_id, text, question_type, options, answer, explanation, points, difficulty)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	getUserCustomChaptersQuery = `
		SELECT * FROM chapters 
		WHERE created_by = $1 AND is_custom = true
		ORDER BY created_at DESC
	`
)

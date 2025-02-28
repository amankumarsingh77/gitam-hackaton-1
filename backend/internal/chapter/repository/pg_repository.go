package repository

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"

	"github.com/AleksK1NG/api-mc/internal/chapter"
	"github.com/AleksK1NG/api-mc/internal/models"
)

type chapterRepo struct {
	db *sqlx.DB
}

func NewChapterRepository(db *sqlx.DB) chapter.Repository {
	return &chapterRepo{db: db}
}

func (r *chapterRepo) CreateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {

	var exists bool
	if err := r.db.GetContext(ctx, &exists, "SELECT EXISTS(SELECT 1 FROM users WHERE user_id = $1)", chapter.CreatedBy); err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("user with ID %s does not exist", chapter.CreatedBy)
	}

	c := &models.Chapter{}
	if err := r.db.QueryRowxContext(
		ctx,
		createChapterQuery,
		chapter.Title,
		chapter.Description,
		chapter.Grade,
		chapter.Subject,
		chapter.Order,
		chapter.IsCustom,
		chapter.CreatedBy,
	).StructScan(c); err != nil {
		return nil, err
	}
	return c, nil
}

func (r *chapterRepo) GetChapterByID(ctx context.Context, chapterID uuid.UUID) (*models.Chapter, error) {
	chapter := &models.Chapter{}
	if err := r.db.GetContext(ctx, chapter, getChapterByIDQuery, chapterID); err != nil {
		return nil, err
	}
	return chapter, nil
}

func (r *chapterRepo) GetChaptersBySubject(ctx context.Context, subject string, grade int) ([]*models.Chapter, error) {
	var chapters []*models.Chapter
	if err := r.db.SelectContext(ctx, &chapters, getChaptersBySubjectQuery, subject, grade); err != nil {
		return nil, err
	}
	return chapters, nil
}

func (r *chapterRepo) UpdateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	c := &models.Chapter{}
	if err := r.db.QueryRowxContext(
		ctx,
		updateChapterQuery,
		chapter.Title,
		chapter.Description,
		chapter.ChapterID,
	).StructScan(c); err != nil {
		return nil, err
	}
	return c, nil
}

func (r *chapterRepo) DeleteChapter(ctx context.Context, chapterID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, deleteChapterQuery, chapterID)
	return err
}

func (r *chapterRepo) CreateLesson(ctx context.Context, lesson *models.Lesson) error {
	return r.db.QueryRowxContext(
		ctx,
		createLessonQuery,
		lesson.ChapterID,
		lesson.Title,
		lesson.Description,
		lesson.Content,
		lesson.Grade,
		lesson.Subject,
		lesson.Order,
		lesson.IsCustom,
		lesson.CreatedBy,
	).Scan(&lesson.LessonID)
}

func (r *chapterRepo) CreateCustomLesson(ctx context.Context, lesson *models.Lesson) error {

	lesson.IsCustom = true

	var chapterExists bool
	if err := r.db.GetContext(ctx, &chapterExists, "SELECT EXISTS(SELECT 1 FROM chapters WHERE chapter_id = $1)", lesson.ChapterID); err != nil {
		return fmt.Errorf("failed to check if chapter exists: %w", err)
	}

	if !chapterExists {
		return fmt.Errorf("chapter with ID %s does not exist", lesson.ChapterID)
	}

	chapter := &models.Chapter{}
	if err := r.db.GetContext(ctx, chapter, getChapterByIDQuery, lesson.ChapterID); err != nil {
		return fmt.Errorf("failed to get chapter details: %w", err)
	}

	lesson.Grade = chapter.Grade
	lesson.Subject = chapter.Subject

	var maxOrder int
	err := r.db.GetContext(ctx, &maxOrder, "SELECT COALESCE(MAX(\"order\"), 0) FROM lessons WHERE chapter_id = $1", lesson.ChapterID)
	if err != nil {
		return fmt.Errorf("failed to get max lesson order: %w", err)
	}

	lesson.Order = maxOrder + 1

	log.Printf("Creating custom lesson for chapter %s with order %d", lesson.ChapterID, lesson.Order)

	return r.db.QueryRowxContext(
		ctx,
		createLessonQuery,
		lesson.ChapterID,
		lesson.Title,
		lesson.Description,
		lesson.Content,
		lesson.Grade,
		lesson.Subject,
		lesson.Order,
		lesson.IsCustom,
		lesson.CreatedBy,
	).Scan(&lesson.LessonID)
}

func (r *chapterRepo) GetLessonsByChapter(ctx context.Context, chapterID uuid.UUID) ([]*models.Lesson, error) {
	lessons := make([]*models.Lesson, 0)
	if err := r.db.SelectContext(ctx, &lessons, getLessonsByChapterQuery, chapterID); err != nil {
		return nil, err
	}

	// Fetch media for each lesson
	if len(lessons) > 0 {
		// Get all media for the chapter
		media, err := r.GetLessonMediaByChapter(ctx, chapterID)
		if err != nil {
			return nil, fmt.Errorf("failed to get media for chapter: %w", err)
		}

		// Create a map of lesson ID to media for efficient lookup
		mediaByLessonID := make(map[uuid.UUID][]*models.LessonMedia)
		for _, m := range media {
			mediaByLessonID[m.LessonID] = append(mediaByLessonID[m.LessonID], m)
		}

		// Assign media to each lesson
		for _, lesson := range lessons {
			if lessonMedia, exists := mediaByLessonID[lesson.LessonID]; exists {
				lesson.Media = lessonMedia
			} else {
				lesson.Media = []*models.LessonMedia{} // Empty array instead of nil for better JSON serialization
			}
		}
	}

	return lessons, nil
}

func (r *chapterRepo) GetCustomLessonsByChapter(ctx context.Context, chapterID uuid.UUID) ([]*models.Lesson, error) {
	lessons := make([]*models.Lesson, 0)

	var chapterExists bool
	if err := r.db.GetContext(ctx, &chapterExists, "SELECT EXISTS(SELECT 1 FROM chapters WHERE chapter_id = $1)", chapterID); err != nil {
		return nil, fmt.Errorf("failed to check if chapter exists: %w", err)
	}

	if !chapterExists {
		return nil, fmt.Errorf("chapter with ID %s does not exist", chapterID)
	}

	log.Printf("Executing query: %s with chapterID: %s", getCustomLessonsByChapterQuery, chapterID)

	var customLessonsExist bool
	if err := r.db.GetContext(ctx, &customLessonsExist, "SELECT EXISTS(SELECT 1 FROM lessons WHERE chapter_id = $1 AND is_custom = true)", chapterID); err != nil {
		return nil, fmt.Errorf("failed to check if custom lessons exist: %w", err)
	}

	log.Printf("Custom lessons exist for chapter %s: %v", chapterID, customLessonsExist)

	if !customLessonsExist {
		return lessons, nil
	}

	if err := r.db.SelectContext(ctx, &lessons, getCustomLessonsByChapterQuery, chapterID); err != nil {
		return nil, fmt.Errorf("failed to get custom lessons: %w", err)
	}

	log.Printf("Found %d custom lessons for chapter %s", len(lessons), chapterID)

	// Fetch media for each lesson
	if len(lessons) > 0 {
		// Get all media for the chapter
		media, err := r.GetLessonMediaByChapter(ctx, chapterID)
		if err != nil {
			return nil, fmt.Errorf("failed to get media for chapter: %w", err)
		}

		// Create a map of lesson ID to media for efficient lookup
		mediaByLessonID := make(map[uuid.UUID][]*models.LessonMedia)
		for _, m := range media {
			mediaByLessonID[m.LessonID] = append(mediaByLessonID[m.LessonID], m)
		}

		// Assign media to each lesson
		for _, lesson := range lessons {
			if lessonMedia, exists := mediaByLessonID[lesson.LessonID]; exists {
				lesson.Media = lessonMedia
			} else {
				lesson.Media = []*models.LessonMedia{} // Empty array instead of nil for better JSON serialization
			}
		}

		log.Printf("Added media to %d lessons", len(lessons))
	}

	return lessons, nil
}

func (r *chapterRepo) CreateLessonMedia(ctx context.Context, media *models.LessonMedia) error {
	return r.db.QueryRowxContext(
		ctx,
		createLessonMediaQuery,
		media.LessonID,
		media.MediaType,
		media.URL,
		media.Description,
	).Scan(&media.MediaID)
}

func (r *chapterRepo) GetLessonMediaByChapter(ctx context.Context, chapterID uuid.UUID) ([]*models.LessonMedia, error) {
	var media []*models.LessonMedia
	if err := r.db.SelectContext(ctx, &media, getLessonMediaByChapterQuery, chapterID); err != nil {
		return nil, err
	}
	return media, nil
}

func (r *chapterRepo) CreateQuiz(ctx context.Context, quiz *models.Quiz) error {
	return r.db.QueryRowxContext(
		ctx,
		createQuizQuery,
		quiz.LessonID,
		quiz.Title,
		quiz.Description,
		quiz.TimeLimit,
	).StructScan(quiz)
}

func (r *chapterRepo) GetQuizByChapter(ctx context.Context, chapterID uuid.UUID) (*models.Quiz, error) {
	quiz := &models.Quiz{}
	if err := r.db.GetContext(ctx, quiz, getQuizByChapterQuery, chapterID); err != nil {
		return nil, err
	}
	return quiz, nil
}

func (r *chapterRepo) CreateQuestion(ctx context.Context, question *models.Question) error {
	return r.db.QueryRowxContext(
		ctx,
		createQuestionQuery,
		question.QuizID,
		question.Text,
		question.QuestionType,
		pq.Array(question.Options),
		question.Answer,
		question.Explanation,
		question.Points,
		question.Difficulty,
	).StructScan(question)
}

func (r *chapterRepo) GetUserCustomChapters(ctx context.Context, userID uuid.UUID) ([]*models.Chapter, error) {
	var chapters []*models.Chapter
	if err := r.db.SelectContext(ctx, &chapters, getUserCustomChaptersQuery, userID); err != nil {
		return nil, err
	}
	return chapters, nil
}

func (r *chapterRepo) GetQuizByID(ctx context.Context, quizID uuid.UUID) (*models.Quiz, error) {
	quiz := &models.Quiz{}
	if err := r.db.GetContext(ctx, quiz, getQuizByIDQuery, quizID); err != nil {
		return nil, fmt.Errorf("failed to get quiz by ID: %w", err)
	}
	return quiz, nil
}

func (r *chapterRepo) GetQuestionsByQuizID(ctx context.Context, quizID uuid.UUID) ([]*models.Question, error) {
	// Instead of using SelectContext, we'll use QueryxContext and manually scan rows
	// to properly handle the PostgreSQL array type for options
	query := `
		SELECT question_id, quiz_id, text, question_type, options, answer, explanation, 
		       points, difficulty, created_at, updated_at 
		FROM questions 
		WHERE quiz_id = $1
		ORDER BY created_at ASC
	`

	// Execute the query
	rows, err := r.db.QueryxContext(ctx, query, quizID)
	if err != nil {
		return nil, fmt.Errorf("failed to get questions for quiz: %w", err)
	}
	defer rows.Close()

	// Process each row manually
	var questions []*models.Question
	for rows.Next() {
		var question models.Question
		var optionsArray pq.StringArray // Use pq.StringArray to handle PostgreSQL array

		// Scan the row into variables
		err := rows.Scan(
			&question.QuestionID,
			&question.QuizID,
			&question.Text,
			&question.QuestionType,
			&optionsArray, // Scan into pq.StringArray
			&question.Answer,
			&question.Explanation,
			&question.Points,
			&question.Difficulty,
			&question.CreatedAt,
			&question.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan question row: %w", err)
		}

		// Convert pq.StringArray to []string
		question.Options = []string(optionsArray)
		questions = append(questions, &question)
	}

	// Check for errors from iterating over rows
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating question rows: %w", err)
	}

	return questions, nil
}

func (r *chapterRepo) GetQuestionByID(ctx context.Context, questionID uuid.UUID) (*models.Question, error) {
	// Use a custom query instead of the predefined one to have more control
	query := `
		SELECT question_id, quiz_id, text, question_type, options, answer, explanation, 
		       points, difficulty, created_at, updated_at 
		FROM questions 
		WHERE question_id = $1
	`

	// Execute the query
	row := r.db.QueryRowxContext(ctx, query, questionID)

	// Create variables to scan into
	var question models.Question
	var optionsArray pq.StringArray // Use pq.StringArray to handle PostgreSQL array

	// Scan the row into variables
	err := row.Scan(
		&question.QuestionID,
		&question.QuizID,
		&question.Text,
		&question.QuestionType,
		&optionsArray, // Scan into pq.StringArray
		&question.Answer,
		&question.Explanation,
		&question.Points,
		&question.Difficulty,
		&question.CreatedAt,
		&question.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get question by ID: %w", err)
	}

	// Convert pq.StringArray to []string
	question.Options = []string(optionsArray)

	return &question, nil
}

func (r *chapterRepo) CreateQuizAttempt(ctx context.Context, attempt *models.UserQuizAttempt) (*models.UserQuizAttempt, error) {
	attempt.AttemptID = uuid.New()
	attempt.CreatedAt = attempt.CompletedAt

	if err := r.db.QueryRowxContext(
		ctx,
		createQuizAttemptQuery,
		attempt.UserID,
		attempt.QuizID,
		attempt.Score,
		attempt.TimeSpent,
		attempt.CompletedAt,
	).StructScan(attempt); err != nil {
		return nil, fmt.Errorf("failed to create quiz attempt: %w", err)
	}

	return attempt, nil
}

func (r *chapterRepo) CreateQuestionResponse(ctx context.Context, response *models.UserQuestionResponse) error {
	response.ResponseID = uuid.New()
	response.CreatedAt = time.Now()

	if err := r.db.QueryRowxContext(
		ctx,
		createQuestionResponseQuery,
		response.AttemptID,
		response.QuestionID,
		response.UserAnswer,
		response.IsCorrect,
	).Scan(&response.ResponseID); err != nil {
		return fmt.Errorf("failed to create question response: %w", err)
	}

	return nil
}

func (r *chapterRepo) GetLessonByID(ctx context.Context, lessonID uuid.UUID) (*models.Lesson, error) {
	lesson := &models.Lesson{}
	if err := r.db.GetContext(ctx, lesson, getLessonByIDQuery, lessonID); err != nil {
		return nil, fmt.Errorf("failed to get lesson by ID: %w", err)
	}

	// Fetch media for the lesson
	var media []*models.LessonMedia
	if err := r.db.SelectContext(ctx, &media, "SELECT * FROM lesson_media WHERE lesson_id = $1", lessonID); err != nil {
		return nil, fmt.Errorf("failed to get media for lesson: %w", err)
	}

	// Assign media to the lesson
	lesson.Media = media

	return lesson, nil
}

func (r *chapterRepo) GetQuizzesByChapterID(ctx context.Context, chapterID uuid.UUID) ([]*models.QuizWithQuestions, error) {
	quizzes := make([]*models.Quiz, 0)
	if err := r.db.SelectContext(ctx, &quizzes, getQuizzesByChapterIDQuery, chapterID); err != nil {
		return nil, fmt.Errorf("failed to get quizzes for chapter: %w", err)
	}

	// Create result slice with the same capacity as quizzes
	result := make([]*models.QuizWithQuestions, len(quizzes))

	// Fetch questions for each quiz
	if len(quizzes) > 0 {
		// Create a map to store questions by quiz ID for efficient lookup
		quizQuestionsMap := make(map[uuid.UUID][]*models.Question)

		// Get all quiz IDs
		var quizIDs []interface{}
		for _, quiz := range quizzes {
			quizIDs = append(quizIDs, quiz.QuizID)
		}

		// Build the query with placeholders for multiple quiz IDs
		query := fmt.Sprintf(
			"SELECT question_id, quiz_id, text, question_type, options, answer, explanation, points, difficulty, created_at, updated_at FROM questions WHERE quiz_id IN (%s) ORDER BY created_at ASC",
			buildPlaceholders(len(quizIDs)),
		)

		// Execute the query manually to handle the array type
		rows, err := r.db.QueryxContext(ctx, query, quizIDs...)
		if err != nil {
			return nil, fmt.Errorf("failed to get questions for quizzes: %w", err)
		}
		defer rows.Close()

		// Process each row manually
		var allQuestions []*models.Question
		for rows.Next() {
			var question models.Question
			var optionsArray pq.StringArray // Use pq.StringArray to handle PostgreSQL array

			// Scan the row into variables
			err := rows.Scan(
				&question.QuestionID,
				&question.QuizID,
				&question.Text,
				&question.QuestionType,
				&optionsArray, // Scan into pq.StringArray
				&question.Answer,
				&question.Explanation,
				&question.Points,
				&question.Difficulty,
				&question.CreatedAt,
				&question.UpdatedAt,
			)
			if err != nil {
				return nil, fmt.Errorf("failed to scan question row: %w", err)
			}

			// Convert pq.StringArray to []string
			question.Options = []string(optionsArray)
			allQuestions = append(allQuestions, &question)
		}

		// Check for errors from iterating over rows
		if err := rows.Err(); err != nil {
			return nil, fmt.Errorf("error iterating question rows: %w", err)
		}

		// Group questions by quiz ID
		for _, question := range allQuestions {
			quizQuestionsMap[question.QuizID] = append(quizQuestionsMap[question.QuizID], question)
		}

		// Convert quizzes to QuizWithQuestions
		for i, quiz := range quizzes {
			questions := quizQuestionsMap[quiz.QuizID]
			if questions == nil {
				questions = []*models.Question{} // Empty slice instead of nil for better JSON serialization
			}

			// Create a QuizWithQuestions
			result[i] = &models.QuizWithQuestions{
				Quiz:      *quiz,
				Questions: questions,
			}
		}
	} else {
		// Return empty result if no quizzes found
		return []*models.QuizWithQuestions{}, nil
	}

	return result, nil
}

// Helper function to build SQL placeholders for IN clause
func buildPlaceholders(n int) string {
	if n <= 0 {
		return ""
	}

	placeholders := make([]string, n)
	for i := 0; i < n; i++ {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	return strings.Join(placeholders, ", ")
}

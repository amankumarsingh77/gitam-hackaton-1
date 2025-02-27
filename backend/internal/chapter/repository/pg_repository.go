package repository

import (
	"context"
	"fmt"
	"log"
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
	questions := make([]*models.Question, 0)
	if err := r.db.SelectContext(ctx, &questions, getQuestionsByQuizIDQuery, quizID); err != nil {
		return nil, fmt.Errorf("failed to get questions for quiz: %w", err)
	}
	return questions, nil
}

func (r *chapterRepo) GetQuestionByID(ctx context.Context, questionID uuid.UUID) (*models.Question, error) {
	question := &models.Question{}
	if err := r.db.GetContext(ctx, question, getQuestionByIDQuery, questionID); err != nil {
		return nil, fmt.Errorf("failed to get question by ID: %w", err)
	}
	return question, nil
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

package chapter

import (
	"context"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/internal/models"
)

// Chapter Repository interface
type Repository interface {
	CreateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error)
	GetChapterByID(ctx context.Context, chapterID uuid.UUID) (*models.Chapter, error)
	GetChaptersBySubject(ctx context.Context, subject string, grade int) ([]*models.Chapter, error)
	UpdateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error)
	DeleteChapter(ctx context.Context, chapterID uuid.UUID) error

	// Lesson operations
	CreateLesson(ctx context.Context, lesson *models.Lesson) error
	GetLessonsByChapter(ctx context.Context, chapterID uuid.UUID) ([]*models.Lesson, error)
	GetCustomLessonsByChapter(ctx context.Context, chapterID uuid.UUID) ([]*models.Lesson, error)
	CreateCustomLesson(ctx context.Context, lesson *models.Lesson) error
	GetLessonByID(ctx context.Context, lessonID uuid.UUID) (*models.Lesson, error)

	// Media operations
	CreateLessonMedia(ctx context.Context, media *models.LessonMedia) error
	GetLessonMediaByChapter(ctx context.Context, chapterID uuid.UUID) ([]*models.LessonMedia, error)

	// Quiz operations
	CreateQuiz(ctx context.Context, quiz *models.Quiz) error
	GetQuizByChapter(ctx context.Context, chapterID uuid.UUID) (*models.Quiz, error)
	GetQuizByID(ctx context.Context, quizID uuid.UUID) (*models.Quiz, error)
	CreateQuestion(ctx context.Context, question *models.Question) error
	GetQuestionsByQuizID(ctx context.Context, quizID uuid.UUID) ([]*models.Question, error)

	// Quiz attempt operations
	CreateQuizAttempt(ctx context.Context, attempt *models.UserQuizAttempt) (*models.UserQuizAttempt, error)
	CreateQuestionResponse(ctx context.Context, response *models.UserQuestionResponse) error
	GetQuestionByID(ctx context.Context, questionID uuid.UUID) (*models.Question, error)

	// Custom content
	GetUserCustomChapters(ctx context.Context, userID uuid.UUID) ([]*models.Chapter, error)
}

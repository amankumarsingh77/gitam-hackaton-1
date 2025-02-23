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

	// Media operations
	CreateLessonMedia(ctx context.Context, media *models.LessonMedia) error
	GetLessonMediaByChapter(ctx context.Context, chapterID uuid.UUID) ([]*models.LessonMedia, error)

	// Quiz operations
	CreateQuiz(ctx context.Context, quiz *models.Quiz) error
	GetQuizByChapter(ctx context.Context, chapterID uuid.UUID) (*models.Quiz, error)
	CreateQuestion(ctx context.Context, question *models.Question) error

	// Custom content
	GetUserCustomChapters(ctx context.Context, userID uuid.UUID) ([]*models.Chapter, error)
}

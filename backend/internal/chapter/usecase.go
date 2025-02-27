package chapter

import (
	"context"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/internal/models"
)

// Chapter UseCase interface
type UseCase interface {
	// Chapter Management
	CreateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error)
	GetChapterByID(ctx context.Context, chapterID uuid.UUID) (*models.Chapter, error)
	GetChaptersBySubject(ctx context.Context, subject string, grade int) ([]*models.Chapter, error)
	UpdateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error)
	DeleteChapter(ctx context.Context, chapterID uuid.UUID) error

	// AI Generation
	GenerateChapterWithAI(ctx context.Context, prompt string, subject string, grade int, userID uuid.UUID) (*models.Chapter, error)
	GenerateMemesForChapter(ctx context.Context, chapterID uuid.UUID, topic string) ([]*models.LessonMedia, error)
	GenerateQuizForChapter(ctx context.Context, chapterID uuid.UUID) (*models.Quiz, error)

	// Custom Content
	CreateCustomChapter(ctx context.Context, chapter *models.Chapter, userID uuid.UUID) (*models.Chapter, error)
	GetUserCustomChapters(ctx context.Context, userID uuid.UUID) ([]*models.Chapter, error)
	GetCustomLessonsByChapter(ctx context.Context, chapterID uuid.UUID) ([]*models.Lesson, error)
	CreateCustomLesson(ctx context.Context, lesson *models.Lesson, userID uuid.UUID) (*models.Lesson, error)
	GetLessonByID(ctx context.Context, lessonID uuid.UUID) (*models.Lesson, error)

	// Quiz Management
	GetQuizByID(ctx context.Context, quizID uuid.UUID) (*models.Quiz, []*models.Question, error)
	SubmitQuizAnswers(ctx context.Context, userID uuid.UUID, quizID uuid.UUID, answers []*models.UserQuestionResponse) (*models.UserQuizAttempt, error)
}

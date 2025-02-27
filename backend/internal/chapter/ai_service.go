package chapter

import (
	"context"

	"github.com/AleksK1NG/api-mc/internal/models"
)

// AI Service interface for content generation
type AIService interface {
	// OpenAI for meme generation
	GenerateMemes(ctx context.Context, topic string, count int) ([]*models.LessonMedia, error)
	GenerateImageFromPrompt(ctx context.Context, prompt string) (*models.LessonMedia, error)

	// Gemini for text content generation
	GenerateChapterContent(ctx context.Context, prompt string, subject string, grade int) (*models.Chapter, error)
	GenerateQuizContent(ctx context.Context, chapterContent string) (*models.Quiz, []*models.Question, error)
}

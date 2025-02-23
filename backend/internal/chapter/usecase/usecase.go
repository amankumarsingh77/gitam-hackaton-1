package usecase

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/config"
	"github.com/AleksK1NG/api-mc/internal/chapter"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

// Chapter UseCase
type chapterUC struct {
	cfg         *config.Config
	chapterRepo chapter.Repository
	aiService   chapter.AIService
	logger      logger.Logger
}

// Chapter UseCase constructor
func NewChapterUseCase(cfg *config.Config, chapterRepo chapter.Repository, aiService chapter.AIService, logger logger.Logger) chapter.UseCase {
	return &chapterUC{cfg: cfg, chapterRepo: chapterRepo, aiService: aiService, logger: logger}
}

// Create new chapter
func (u *chapterUC) CreateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	return u.chapterRepo.CreateChapter(ctx, chapter)
}

// Get chapter by id
func (u *chapterUC) GetChapterByID(ctx context.Context, chapterID uuid.UUID) (*models.Chapter, error) {
	return u.chapterRepo.GetChapterByID(ctx, chapterID)
}

// Get chapters by subject
func (u *chapterUC) GetChaptersBySubject(ctx context.Context, subject string, grade int) ([]*models.Chapter, error) {
	return u.chapterRepo.GetChaptersBySubject(ctx, subject, grade)
}

// Update chapter
func (u *chapterUC) UpdateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	return u.chapterRepo.UpdateChapter(ctx, chapter)
}

// Delete chapter
func (u *chapterUC) DeleteChapter(ctx context.Context, chapterID uuid.UUID) error {
	return u.chapterRepo.DeleteChapter(ctx, chapterID)
}

// Generate chapter with AI
func (u *chapterUC) GenerateChapterWithAI(ctx context.Context, prompt string, subject string, grade int) (*models.Chapter, error) {
	// Generate chapter content using Gemini
	chapter, err := u.aiService.GenerateChapterContent(ctx, prompt, subject, grade)
	if err != nil {
		return nil, fmt.Errorf("failed to generate chapter content: %v", err)
	}

	// Save the chapter
	savedChapter, err := u.chapterRepo.CreateChapter(ctx, chapter)
	if err != nil {
		return nil, fmt.Errorf("failed to save generated chapter: %v", err)
	}

	return savedChapter, nil
}

// Generate memes for chapter
func (u *chapterUC) GenerateMemesForChapter(ctx context.Context, chapterID uuid.UUID, topic string) ([]*models.LessonMedia, error) {
	// Generate memes using OpenAI
	memes, err := u.aiService.GenerateMemes(ctx, topic, 3) // Generate 3 memes
	if err != nil {
		return nil, fmt.Errorf("failed to generate memes: %v", err)
	}

	// Save each meme
	for _, meme := range memes {
		if err := u.chapterRepo.CreateLessonMedia(ctx, meme); err != nil {
			return nil, fmt.Errorf("failed to save meme: %v", err)
		}
	}

	return memes, nil
}

// Generate quiz for chapter
func (u *chapterUC) GenerateQuizForChapter(ctx context.Context, chapterID uuid.UUID) (*models.Quiz, error) {
	// Get chapter content
	chapter, err := u.chapterRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chapter: %v", err)
	}

	// Generate quiz using Gemini
	quiz, questions, err := u.aiService.GenerateQuizContent(ctx, chapter.Description)
	if err != nil {
		return nil, fmt.Errorf("failed to generate quiz: %v", err)
	}

	// Save quiz
	if err := u.chapterRepo.CreateQuiz(ctx, quiz); err != nil {
		return nil, fmt.Errorf("failed to save quiz: %v", err)
	}

	// Save questions
	for _, question := range questions {
		if err := u.chapterRepo.CreateQuestion(ctx, question); err != nil {
			return nil, fmt.Errorf("failed to save question: %v", err)
		}
	}

	return quiz, nil
}

// Create custom chapter
func (u *chapterUC) CreateCustomChapter(ctx context.Context, chapter *models.Chapter, userID uuid.UUID) (*models.Chapter, error) {
	chapter.IsCustom = true
	chapter.CreatedBy = userID
	return u.chapterRepo.CreateChapter(ctx, chapter)
}

// Get user custom chapters
func (u *chapterUC) GetUserCustomChapters(ctx context.Context, userID uuid.UUID) ([]*models.Chapter, error) {
	return u.chapterRepo.GetUserCustomChapters(ctx, userID)
}

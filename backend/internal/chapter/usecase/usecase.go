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

type chapterUC struct {
	cfg         *config.Config
	chapterRepo chapter.Repository
	aiService   chapter.AIService
	logger      logger.Logger
}

func NewChapterUseCase(cfg *config.Config, chapterRepo chapter.Repository, aiService chapter.AIService, logger logger.Logger) chapter.UseCase {
	return &chapterUC{cfg: cfg, chapterRepo: chapterRepo, aiService: aiService, logger: logger}
}

func (u *chapterUC) CreateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	return u.chapterRepo.CreateChapter(ctx, chapter)
}

func (u *chapterUC) GetChapterByID(ctx context.Context, chapterID uuid.UUID) (*models.Chapter, error) {
	return u.chapterRepo.GetChapterByID(ctx, chapterID)
}

func (u *chapterUC) GetChaptersBySubject(ctx context.Context, subject string, grade int) ([]*models.Chapter, error) {
	return u.chapterRepo.GetChaptersBySubject(ctx, subject, grade)
}

func (u *chapterUC) UpdateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	return u.chapterRepo.UpdateChapter(ctx, chapter)
}

func (u *chapterUC) DeleteChapter(ctx context.Context, chapterID uuid.UUID) error {
	return u.chapterRepo.DeleteChapter(ctx, chapterID)
}

func (u *chapterUC) GenerateChapterWithAI(ctx context.Context, prompt string, subject string, grade int, userID uuid.UUID) (*models.Chapter, error) {

	chapter, err := u.aiService.GenerateChapterContent(ctx, prompt, subject, grade)
	if err != nil {
		return nil, fmt.Errorf("failed to generate chapter content: %w", err)
	}

	chapter.CreatedBy = userID
	chapter.IsCustom = true

	createdChapter, err := u.chapterRepo.CreateChapter(ctx, chapter)
	if err != nil {
		return nil, fmt.Errorf("failed to create chapter: %w", err)
	}

	for _, lesson := range chapter.Lessons {

		lesson.ChapterID = createdChapter.ChapterID
		lesson.CreatedBy = userID

		err = u.chapterRepo.CreateLesson(ctx, lesson)
		if err != nil {
			u.logger.Errorf("failed to create lesson: %v", err)
			continue
		}

		if u.cfg.OpenAI.APIKey != "" {
			memes, err := u.aiService.GenerateMemes(ctx, lesson.Title, 1)
			if err != nil {
				u.logger.Warnf("skipping meme generation for lesson due to error: %v", err)
			} else {
				for _, meme := range memes {
					meme.LessonID = lesson.LessonID
					if err := u.chapterRepo.CreateLessonMedia(ctx, meme); err != nil {
						u.logger.Warnf("failed to save meme: %v", err)
					}
				}
			}
		}

		if lesson.Order%3 == 0 {
			quiz, questions, err := u.aiService.GenerateQuizContent(ctx, lesson.Content)
			if err != nil {
				u.logger.Errorf("failed to generate quiz for lesson: %v", err)
				continue
			}

			quiz.LessonID = lesson.LessonID
			err = u.chapterRepo.CreateQuiz(ctx, quiz)
			if err != nil {
				u.logger.Errorf("failed to create quiz: %v", err)
				continue
			}

			for _, question := range questions {
				question.QuizID = quiz.QuizID
				err = u.chapterRepo.CreateQuestion(ctx, question)
				if err != nil {
					u.logger.Errorf("failed to create question: %v", err)
				}
			}
		}
	}

	return u.GetChapterByID(ctx, createdChapter.ChapterID)
}

func (u *chapterUC) GenerateMemesForChapter(ctx context.Context, chapterID uuid.UUID, topic string) ([]*models.LessonMedia, error) {

	memes, err := u.aiService.GenerateMemes(ctx, topic, 3)
	if err != nil {
		return nil, fmt.Errorf("failed to generate memes: %v", err)
	}

	for _, meme := range memes {
		if err := u.chapterRepo.CreateLessonMedia(ctx, meme); err != nil {
			return nil, fmt.Errorf("failed to save meme: %v", err)
		}
	}

	return memes, nil
}

func (u *chapterUC) GenerateQuizForChapter(ctx context.Context, chapterID uuid.UUID) (*models.Quiz, error) {

	chapter, err := u.chapterRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chapter: %v", err)
	}

	quiz, questions, err := u.aiService.GenerateQuizContent(ctx, chapter.Description)
	if err != nil {
		return nil, fmt.Errorf("failed to generate quiz: %v", err)
	}

	if err := u.chapterRepo.CreateQuiz(ctx, quiz); err != nil {
		return nil, fmt.Errorf("failed to save quiz: %v", err)
	}

	for _, question := range questions {
		if err := u.chapterRepo.CreateQuestion(ctx, question); err != nil {
			return nil, fmt.Errorf("failed to save question: %v", err)
		}
	}

	return quiz, nil
}

func (u *chapterUC) CreateCustomChapter(ctx context.Context, chapter *models.Chapter, userID uuid.UUID) (*models.Chapter, error) {
	chapter.IsCustom = true
	chapter.CreatedBy = userID
	return u.chapterRepo.CreateChapter(ctx, chapter)
}

func (u *chapterUC) GetUserCustomChapters(ctx context.Context, userID uuid.UUID) ([]*models.Chapter, error) {
	return u.chapterRepo.GetUserCustomChapters(ctx, userID)
}

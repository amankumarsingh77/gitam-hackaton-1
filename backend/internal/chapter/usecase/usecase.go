package usecase

import (
	"context"
	"fmt"
	"time"

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

		// Generate both memes and illustrations if OpenAI API key is available
		if u.cfg.OpenAI.APIKey != "" {
			// Generate meme
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

			// Generate illustrations from prompts
			for _, prompt := range lesson.ImagePrompts {
				media, err := u.aiService.GenerateImageFromPrompt(ctx, prompt)
				if err != nil {
					u.logger.Warnf("failed to generate illustration: %v", err)
					continue
				}
				media.LessonID = lesson.LessonID
				if err := u.chapterRepo.CreateLessonMedia(ctx, media); err != nil {
					u.logger.Warnf("failed to save illustration: %v", err)
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

func (u *chapterUC) GetCustomLessonsByChapter(ctx context.Context, chapterID uuid.UUID) ([]*models.Lesson, error) {
	// First check if the chapter exists
	chapter, err := u.chapterRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chapter: %w", err)
	}

	if chapter == nil {
		return nil, fmt.Errorf("chapter not found")
	}

	// Get custom lessons for the chapter
	lessons, err := u.chapterRepo.GetCustomLessonsByChapter(ctx, chapterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get custom lessons: %w", err)
	}

	return lessons, nil
}

func (u *chapterUC) CreateCustomLesson(ctx context.Context, lesson *models.Lesson, userID uuid.UUID) (*models.Lesson, error) {
	// Set the creator
	lesson.CreatedBy = userID

	// Ensure it's marked as custom
	lesson.IsCustom = true

	// Create the lesson
	if err := u.chapterRepo.CreateCustomLesson(ctx, lesson); err != nil {
		return nil, fmt.Errorf("failed to create custom lesson: %w", err)
	}

	// Return the created lesson
	return lesson, nil
}

func (u *chapterUC) GetLessonByID(ctx context.Context, lessonID uuid.UUID) (*models.Lesson, error) {
	lesson, err := u.chapterRepo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, fmt.Errorf("failed to get lesson: %w", err)
	}

	return lesson, nil
}

func (u *chapterUC) GetQuizByID(ctx context.Context, quizID uuid.UUID) (*models.Quiz, []*models.Question, error) {
	// Get the quiz
	quiz, err := u.chapterRepo.GetQuizByID(ctx, quizID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get quiz: %w", err)
	}

	// Get the questions for the quiz
	questions, err := u.chapterRepo.GetQuestionsByQuizID(ctx, quizID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get questions for quiz: %w", err)
	}

	// For security, don't return the answers to the client
	for _, q := range questions {
		q.Answer = "" // Clear the answer
	}

	return quiz, questions, nil
}

func (u *chapterUC) SubmitQuizAnswers(ctx context.Context, userID uuid.UUID, quizID uuid.UUID, answers []*models.UserQuestionResponse) (*models.UserQuizAttempt, error) {
	// Get the quiz to verify it exists
	_, err := u.chapterRepo.GetQuizByID(ctx, quizID)
	if err != nil {
		return nil, fmt.Errorf("failed to get quiz: %w", err)
	}

	// Create a new quiz attempt
	attempt := &models.UserQuizAttempt{
		UserID:      userID,
		QuizID:      quizID,
		Score:       0,
		TimeSpent:   0, // This would typically come from the client
		CompletedAt: time.Now(),
	}

	// Get all questions for the quiz
	questions, err := u.chapterRepo.GetQuestionsByQuizID(ctx, quizID)
	if err != nil {
		return nil, fmt.Errorf("failed to get questions for quiz: %w", err)
	}

	// Create a map of question IDs to questions for easy lookup
	questionMap := make(map[string]*models.Question)
	totalPoints := 0
	for _, q := range questions {
		questionMap[q.QuestionID.String()] = q
		totalPoints += q.Points
	}

	// Calculate the score based on correct answers
	userPoints := 0
	for _, answer := range answers {
		question, exists := questionMap[answer.QuestionID.String()]
		if !exists {
			return nil, fmt.Errorf("question with ID %s not found in quiz", answer.QuestionID)
		}

		// Check if the answer is correct
		isCorrect := answer.UserAnswer == question.Answer
		answer.IsCorrect = isCorrect

		if isCorrect {
			userPoints += question.Points
		}
	}

	// Calculate the percentage score (0-100)
	if totalPoints > 0 {
		attempt.Score = (userPoints * 100) / totalPoints
	}

	// Save the quiz attempt
	savedAttempt, err := u.chapterRepo.CreateQuizAttempt(ctx, attempt)
	if err != nil {
		return nil, fmt.Errorf("failed to save quiz attempt: %w", err)
	}

	// Save each question response
	for _, answer := range answers {
		answer.AttemptID = savedAttempt.AttemptID
		if err := u.chapterRepo.CreateQuestionResponse(ctx, answer); err != nil {
			u.logger.Errorf("failed to save question response: %v", err)
			// Continue with other responses even if one fails
		}
	}

	return savedAttempt, nil
}

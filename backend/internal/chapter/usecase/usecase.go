package usecase

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/opentracing/opentracing-go"

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

func (u *chapterUC) GenerateChapterWithAI(ctx context.Context, prompt string, subject string, grade int, userID uuid.UUID, contextContent string) (*models.Chapter, error) {

	chapter, err := u.aiService.GenerateChapterContent(ctx, prompt, subject, grade, contextContent)
	if err != nil {
		return nil, fmt.Errorf("failed to generate chapter content: %w", err)
	}

	chapter.CreatedBy = userID
	chapter.IsCustom = true

	createdChapter, err := u.chapterRepo.CreateChapter(ctx, chapter)
	if err != nil {
		return nil, fmt.Errorf("failed to create chapter: %w", err)
	}

	var wg sync.WaitGroup

	errChan := make(chan error, len(chapter.Lessons))

	const maxConcurrentImageRequests = 4
	imageSemaphore := make(chan struct{}, maxConcurrentImageRequests)

	var mu sync.Mutex

	imageCount := 0
	const maxImagesPerMinute = 4

	for _, lesson := range chapter.Lessons {

		lesson.ChapterID = createdChapter.ChapterID
		lesson.CreatedBy = userID

		lessonCopy := lesson

		wg.Add(1)

		go func(lesson *models.Lesson) {
			defer wg.Done()

			err := u.chapterRepo.CreateLesson(ctx, lesson)
			if err != nil {
				u.logger.Errorf("failed to create lesson: %v", err)
				errChan <- fmt.Errorf("failed to create lesson: %w", err)
				return
			}

			if u.cfg.OpenAI.APIKey != "" {

				if shouldGenerateMeme(&mu, &imageCount, maxImagesPerMinute) {

					imageSemaphore <- struct{}{}

					memes, err := u.aiService.GenerateMemes(ctx, lesson.Title, 1, "openai")

					<-imageSemaphore

					if err != nil {
						u.logger.Warnf("skipping meme generation for lesson due to error: %v", err)
					} else {

						mu.Lock()
						imageCount++
						mu.Unlock()

						for _, meme := range memes {
							meme.LessonID = lesson.LessonID
							if err := u.chapterRepo.CreateLessonMedia(ctx, meme); err != nil {
								u.logger.Warnf("failed to save meme: %v", err)
							}
						}
					}
				}

				if len(lesson.ImagePrompts) > 0 && shouldGenerateImage(&mu, &imageCount, maxImagesPerMinute) {

					prompt := lesson.ImagePrompts[0]

					imageSemaphore <- struct{}{}

					media, err := u.aiService.GenerateImageFromPrompt(ctx, prompt)

					<-imageSemaphore

					if err != nil {
						u.logger.Warnf("failed to generate illustration: %v", err)
					} else {

						mu.Lock()
						imageCount++
						mu.Unlock()

						media.LessonID = lesson.LessonID
						if err := u.chapterRepo.CreateLessonMedia(ctx, media); err != nil {
							u.logger.Warnf("failed to save illustration: %v", err)
						}
					}
				}
			}

			if lesson.Order%3 == 0 {
				quiz, questions, err := u.aiService.GenerateQuizContent(ctx, lesson.Content)
				if err != nil {
					u.logger.Errorf("failed to generate quiz for lesson: %v", err)
					return
				}

				quiz.LessonID = lesson.LessonID
				err = u.chapterRepo.CreateQuiz(ctx, quiz)
				if err != nil {
					u.logger.Errorf("failed to create quiz: %v", err)
					return
				}

				for _, question := range questions {
					question.QuizID = quiz.QuizID
					err = u.chapterRepo.CreateQuestion(ctx, question)
					if err != nil {
						u.logger.Errorf("failed to create question: %v", err)
					}
				}
			}
		}(lessonCopy)
	}

	wg.Wait()

	close(errChan)

	var errs []error
	for err := range errChan {
		errs = append(errs, err)
	}

	if len(errs) > 0 {
		u.logger.Errorf("encountered %d errors while processing lessons", len(errs))
	}

	return u.GetChapterByID(ctx, createdChapter.ChapterID)
}

func shouldGenerateMeme(mu *sync.Mutex, imageCount *int, maxImagesPerMinute int) bool {
	mu.Lock()
	defer mu.Unlock()

	return *imageCount < maxImagesPerMinute
}

func shouldGenerateImage(mu *sync.Mutex, imageCount *int, maxImagesPerMinute int) bool {
	mu.Lock()
	defer mu.Unlock()

	return *imageCount < maxImagesPerMinute
}

func (u *chapterUC) GenerateMemesForChapter(ctx context.Context, chapterID uuid.UUID, topic string) ([]*models.LessonMedia, error) {

	memes, err := u.aiService.GenerateMemes(ctx, topic, 1, "openai")
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

	chapter, err := u.chapterRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chapter: %w", err)
	}

	if chapter == nil {
		return nil, fmt.Errorf("chapter not found")
	}

	lessons, err := u.chapterRepo.GetCustomLessonsByChapter(ctx, chapterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get custom lessons: %w", err)
	}

	return lessons, nil
}

func (u *chapterUC) CreateCustomLesson(ctx context.Context, lesson *models.Lesson, userID uuid.UUID) (*models.Lesson, error) {

	lesson.CreatedBy = userID

	lesson.IsCustom = true

	if err := u.chapterRepo.CreateCustomLesson(ctx, lesson); err != nil {
		return nil, fmt.Errorf("failed to create custom lesson: %w", err)
	}

	return lesson, nil
}

func (u *chapterUC) GetLessonByID(ctx context.Context, lessonID uuid.UUID) (*models.Lesson, error) {
	lesson, err := u.chapterRepo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, fmt.Errorf("failed to get lesson: %w", err)
	}

	return lesson, nil
}

func (u *chapterUC) GetQuizzesByChapterID(ctx context.Context, chapterID uuid.UUID) ([]*models.QuizWithQuestions, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "chapterUC.GetQuizzesByChapterID")
	defer span.Finish()

	_, err := u.chapterRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		return nil, err
	}

	quizzes, err := u.chapterRepo.GetQuizzesByChapterID(ctx, chapterID)
	if err != nil {
		return nil, err
	}

	return quizzes, nil
}

func (u *chapterUC) GetQuizByID(ctx context.Context, quizID uuid.UUID) (*models.Quiz, []*models.Question, error) {

	quiz, err := u.chapterRepo.GetQuizByID(ctx, quizID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get quiz: %w", err)
	}

	questions, err := u.chapterRepo.GetQuestionsByQuizID(ctx, quizID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get questions for quiz: %w", err)
	}

	for _, q := range questions {
		q.Answer = ""
	}

	return quiz, questions, nil
}

func (u *chapterUC) SubmitQuizAnswers(ctx context.Context, userID uuid.UUID, quizID uuid.UUID, answers []*models.UserQuestionResponse) (*models.UserQuizAttempt, error) {

	_, err := u.chapterRepo.GetQuizByID(ctx, quizID)
	if err != nil {
		return nil, fmt.Errorf("failed to get quiz: %w", err)
	}

	attempt := &models.UserQuizAttempt{
		UserID:      userID,
		QuizID:      quizID,
		Score:       0,
		TimeSpent:   0,
		CompletedAt: time.Now(),
	}

	questions, err := u.chapterRepo.GetQuestionsByQuizID(ctx, quizID)
	if err != nil {
		return nil, fmt.Errorf("failed to get questions for quiz: %w", err)
	}

	questionMap := make(map[string]*models.Question)
	totalPoints := 0
	for _, q := range questions {
		questionMap[q.QuestionID.String()] = q
		totalPoints += q.Points
	}

	userPoints := 0
	for _, answer := range answers {
		question, exists := questionMap[answer.QuestionID.String()]
		if !exists {
			return nil, fmt.Errorf("question with ID %s not found in quiz", answer.QuestionID)
		}

		isCorrect := answer.UserAnswer == question.Answer
		answer.IsCorrect = isCorrect

		if isCorrect {
			userPoints += question.Points
		}
	}

	if totalPoints > 0 {
		attempt.Score = (userPoints * 100) / totalPoints
	}

	savedAttempt, err := u.chapterRepo.CreateQuizAttempt(ctx, attempt)
	if err != nil {
		return nil, fmt.Errorf("failed to save quiz attempt: %w", err)
	}

	for _, answer := range answers {
		answer.AttemptID = savedAttempt.AttemptID
		if err := u.chapterRepo.CreateQuestionResponse(ctx, answer); err != nil {
			u.logger.Errorf("failed to save question response: %v", err)

		}
	}

	return savedAttempt, nil
}

func (u *chapterUC) CreateQuestion(ctx context.Context, question *models.Question) error {
	span, ctx := opentracing.StartSpanFromContext(ctx, "chapterUC.CreateQuestion")
	defer span.Finish()

	if question.QuizID == uuid.Nil {
		return fmt.Errorf("quiz_id is required")
	}

	_, err := u.chapterRepo.GetQuizByID(ctx, question.QuizID)
	if err != nil {
		return fmt.Errorf("failed to get quiz: %w", err)
	}

	return u.chapterRepo.CreateQuestion(ctx, question)
}

func (u *chapterUC) CreateQuiz(ctx context.Context, quiz *models.Quiz) error {
	span, ctx := opentracing.StartSpanFromContext(ctx, "chapterUC.CreateQuiz")
	defer span.Finish()

	if quiz.LessonID == uuid.Nil {
		return fmt.Errorf("lesson_id is required")
	}

	return u.chapterRepo.CreateQuiz(ctx, quiz)
}

func (u *chapterUC) GetQuizByChapter(ctx context.Context, chapterID uuid.UUID) (*models.Quiz, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "chapterUC.GetQuizByChapter")
	defer span.Finish()

	_, err := u.chapterRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chapter: %w", err)
	}

	return u.chapterRepo.GetQuizByChapter(ctx, chapterID)
}

func (u *chapterUC) GetQuestionsByQuizID(ctx context.Context, quizID uuid.UUID) ([]*models.Question, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "chapterUC.GetQuestionsByQuizID")
	defer span.Finish()

	_, err := u.chapterRepo.GetQuizByID(ctx, quizID)
	if err != nil {
		return nil, fmt.Errorf("failed to get quiz: %w", err)
	}

	return u.chapterRepo.GetQuestionsByQuizID(ctx, quizID)
}

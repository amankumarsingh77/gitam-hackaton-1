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

	// Create a wait group to wait for all goroutines to finish
	var wg sync.WaitGroup

	// Create a channel to collect errors from goroutines
	errChan := make(chan error, len(chapter.Lessons))

	// Create a semaphore to limit concurrent API calls to avoid rate limits
	// OpenAI has a limit of 5 images/minute, so we'll keep it safe
	const maxConcurrentImageRequests = 4
	imageSemaphore := make(chan struct{}, maxConcurrentImageRequests)

	// Create a mutex to protect shared resources
	var mu sync.Mutex

	// Track image generation count to avoid rate limits
	imageCount := 0
	const maxImagesPerMinute = 4 // Keep below the limit of 5 to be safe

	for _, lesson := range chapter.Lessons {
		// Set the chapter ID and user ID for each lesson
		lesson.ChapterID = createdChapter.ChapterID
		lesson.CreatedBy = userID

		// Create a copy of the lesson for the goroutine to avoid race conditions
		lessonCopy := lesson

		// Add to wait group before starting goroutine
		wg.Add(1)

		// Process each lesson in a separate goroutine
		go func(lesson *models.Lesson) {
			defer wg.Done()

			// Create the lesson in the database
			err := u.chapterRepo.CreateLesson(ctx, lesson)
			if err != nil {
				u.logger.Errorf("failed to create lesson: %v", err)
				errChan <- fmt.Errorf("failed to create lesson: %w", err)
				return
			}

			// Only generate media if OpenAI API key is available
			if u.cfg.OpenAI.APIKey != "" {
				// Process meme generation
				if shouldGenerateMeme(&mu, &imageCount, maxImagesPerMinute) {
					// Acquire semaphore before making API call
					imageSemaphore <- struct{}{}

					// Generate meme (limited to 1)
					memes, err := u.aiService.GenerateMemes(ctx, lesson.Title, 1, "openai")

					// Release semaphore after API call
					<-imageSemaphore

					if err != nil {
						u.logger.Warnf("skipping meme generation for lesson due to error: %v", err)
					} else {
						// Lock for updating shared resource
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

				// Process image generation from prompts
				if len(lesson.ImagePrompts) > 0 && shouldGenerateImage(&mu, &imageCount, maxImagesPerMinute) {
					// Only use the first prompt to avoid rate limits
					prompt := lesson.ImagePrompts[0]

					// Acquire semaphore before making API call
					imageSemaphore <- struct{}{}

					media, err := u.aiService.GenerateImageFromPrompt(ctx, prompt)

					// Release semaphore after API call
					<-imageSemaphore

					if err != nil {
						u.logger.Warnf("failed to generate illustration: %v", err)
					} else {
						// Lock for updating shared resource
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

			// Generate quiz for every third lesson
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

				// Process questions sequentially as they depend on the quiz
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

	// Wait for all goroutines to finish
	wg.Wait()

	// Close the error channel
	close(errChan)

	// Check if there were any errors
	var errs []error
	for err := range errChan {
		errs = append(errs, err)
	}

	// If there were errors, log them but continue
	if len(errs) > 0 {
		u.logger.Errorf("encountered %d errors while processing lessons", len(errs))
	}

	return u.GetChapterByID(ctx, createdChapter.ChapterID)
}

// Helper function to check if we should generate a meme
// Uses mutex to safely access and update shared state
func shouldGenerateMeme(mu *sync.Mutex, imageCount *int, maxImagesPerMinute int) bool {
	mu.Lock()
	defer mu.Unlock()

	return *imageCount < maxImagesPerMinute
}

// Helper function to check if we should generate an image
// Uses mutex to safely access and update shared state
func shouldGenerateImage(mu *sync.Mutex, imageCount *int, maxImagesPerMinute int) bool {
	mu.Lock()
	defer mu.Unlock()

	return *imageCount < maxImagesPerMinute
}

func (u *chapterUC) GenerateMemesForChapter(ctx context.Context, chapterID uuid.UUID, topic string) ([]*models.LessonMedia, error) {
	// Always limit to 1 meme to avoid rate limits
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

func (u *chapterUC) GetQuizzesByChapterID(ctx context.Context, chapterID uuid.UUID) ([]*models.QuizWithQuestions, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "chapterUC.GetQuizzesByChapterID")
	defer span.Finish()

	// Check if chapter exists
	_, err := u.chapterRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		return nil, err
	}

	// Get quizzes with questions
	quizzes, err := u.chapterRepo.GetQuizzesByChapterID(ctx, chapterID)
	if err != nil {
		return nil, err
	}

	return quizzes, nil
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

// CreateQuestion implements the CreateQuestion method required by the chapter.UseCase interface
func (u *chapterUC) CreateQuestion(ctx context.Context, question *models.Question) error {
	span, ctx := opentracing.StartSpanFromContext(ctx, "chapterUC.CreateQuestion")
	defer span.Finish()

	// Validate the question
	if question.QuizID == uuid.Nil {
		return fmt.Errorf("quiz_id is required")
	}

	// Check if the quiz exists
	_, err := u.chapterRepo.GetQuizByID(ctx, question.QuizID)
	if err != nil {
		return fmt.Errorf("failed to get quiz: %w", err)
	}

	// Create the question
	return u.chapterRepo.CreateQuestion(ctx, question)
}

// CreateQuiz implements the CreateQuiz method required by the chapter.UseCase interface
func (u *chapterUC) CreateQuiz(ctx context.Context, quiz *models.Quiz) error {
	span, ctx := opentracing.StartSpanFromContext(ctx, "chapterUC.CreateQuiz")
	defer span.Finish()

	// Validate the quiz
	if quiz.LessonID == uuid.Nil {
		return fmt.Errorf("lesson_id is required")
	}

	// Create the quiz
	return u.chapterRepo.CreateQuiz(ctx, quiz)
}

// GetQuizByChapter implements the GetQuizByChapter method required by the chapter.UseCase interface
func (u *chapterUC) GetQuizByChapter(ctx context.Context, chapterID uuid.UUID) (*models.Quiz, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "chapterUC.GetQuizByChapter")
	defer span.Finish()

	// Check if chapter exists
	_, err := u.chapterRepo.GetChapterByID(ctx, chapterID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chapter: %w", err)
	}

	// Get quiz for the chapter
	return u.chapterRepo.GetQuizByChapter(ctx, chapterID)
}

// GetQuestionsByQuizID implements the GetQuestionsByQuizID method required by the chapter.UseCase interface
func (u *chapterUC) GetQuestionsByQuizID(ctx context.Context, quizID uuid.UUID) ([]*models.Question, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "chapterUC.GetQuestionsByQuizID")
	defer span.Finish()

	// Check if quiz exists
	_, err := u.chapterRepo.GetQuizByID(ctx, quizID)
	if err != nil {
		return nil, fmt.Errorf("failed to get quiz: %w", err)
	}

	// Get questions for the quiz
	return u.chapterRepo.GetQuestionsByQuizID(ctx, quizID)
}

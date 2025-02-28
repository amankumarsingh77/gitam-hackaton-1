package http

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/AleksK1NG/api-mc/config"
	"github.com/AleksK1NG/api-mc/internal/chapter"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
	"github.com/AleksK1NG/api-mc/pkg/middleware"
	"github.com/AleksK1NG/api-mc/pkg/response"
)

// Chapter handlers
type chapterHandlers struct {
	cfg       *config.Config
	chapterUC chapter.UseCase
	logger    logger.Logger
}

// Chapter Handlers constructor
func NewChapterHandlers(cfg *config.Config, chapterUC chapter.UseCase, logger logger.Logger) chapter.Handlers {
	return &chapterHandlers{cfg: cfg, chapterUC: chapterUC, logger: logger}
}

// CreateChapter godoc
// @Summary Create new chapter
// @Description Create a new chapter in the system
// @Tags Chapters
// @Accept json
// @Produce json
// @Param chapter body models.Chapter true "Create chapter"
// @Success 201 {object} models.Chapter
// @Router /chapters [post]
func (h *chapterHandlers) CreateChapter() echo.HandlerFunc {
	return func(c echo.Context) error {
		user := c.Get("user").(*models.User)
		chapter := &models.Chapter{}
		if err := c.Bind(chapter); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		chapter.CreatedBy = user.UserID

		createdChapter, err := h.chapterUC.CreateChapter(c.Request().Context(), chapter)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		return c.JSON(http.StatusCreated, createdChapter)
	}
}

// GetChapterByID godoc
// @Summary Get chapter by ID
// @Description Get chapter details by ID
// @Tags Chapters
// @Accept json
// @Produce json
// @Param id path string true "Chapter ID"
// @Success 200 {object} models.Chapter
// @Router /chapters/{id} [get]
func (h *chapterHandlers) GetChapterByID() echo.HandlerFunc {
	return func(c echo.Context) error {
		chapterID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid chapter ID")
		}

		chapter, err := h.chapterUC.GetChapterByID(c.Request().Context(), chapterID)
		if err != nil {
			return echo.NewHTTPError(http.StatusNotFound, "Chapter not found")
		}

		return c.JSON(http.StatusOK, chapter)
	}
}

// GetChaptersBySubject godoc
// @Summary Get chapters by subject
// @Description Get all chapters for a subject and grade
// @Tags Chapters
// @Accept json
// @Produce json
// @Param subject query string true "Subject"
// @Param grade query int true "Grade"
// @Success 200 {array} models.Chapter
// @Router /chapters [get]
func (h *chapterHandlers) GetChaptersBySubject() echo.HandlerFunc {
	return func(c echo.Context) error {
		subject := c.QueryParam("subject")
		if subject == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "Subject is required")
		}

		gradeStr := c.QueryParam("grade")
		if gradeStr == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "Grade is required")
		}

		grade, err := strconv.Atoi(gradeStr)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid grade format")
		}

		chapters, err := h.chapterUC.GetChaptersBySubject(c.Request().Context(), subject, grade)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusOK, chapters)
	}
}

// UpdateChapter godoc
// @Summary Update chapter
// @Description Update chapter details
// @Tags Chapters
// @Accept json
// @Produce json
// @Param id path string true "Chapter ID"
// @Param chapter body models.Chapter true "Update chapter"
// @Success 200 {object} models.Chapter
// @Router /chapters/{id} [put]
func (h *chapterHandlers) UpdateChapter() echo.HandlerFunc {
	return func(c echo.Context) error {
		chapterID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid chapter ID")
		}

		chapter := &models.Chapter{}
		if err := c.Bind(chapter); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		chapter.ChapterID = chapterID

		updatedChapter, err := h.chapterUC.UpdateChapter(c.Request().Context(), chapter)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		return c.JSON(http.StatusOK, updatedChapter)
	}
}

// DeleteChapter godoc
// @Summary Delete chapter
// @Description Delete a chapter by ID
// @Tags Chapters
// @Accept json
// @Produce json
// @Param id path string true "Chapter ID"
// @Success 204 "No Content"
// @Router /chapters/{id} [delete]
func (h *chapterHandlers) DeleteChapter() echo.HandlerFunc {
	return func(c echo.Context) error {
		chapterID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid chapter ID")
		}

		if err := h.chapterUC.DeleteChapter(c.Request().Context(), chapterID); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		return c.NoContent(http.StatusNoContent)
	}
}

// GenerateChapterWithAI godoc
// @Summary Generate chapter using AI
// @Description Generate a new chapter using AI with given prompt
// @Tags AI Generation
// @Accept json
// @Produce json
// @Param prompt body string true "Generation prompt"
// @Param subject query string true "Subject"
// @Param grade query int true "Grade"
// @Success 201 {object} models.Chapter
// @Router /chapters/generate [post]
func (h *chapterHandlers) GenerateChapterWithAI() echo.HandlerFunc {
	return func(c echo.Context) error {
		var input struct {
			Prompt  string `json:"prompt"`
			Subject string `json:"subject"`
			Grade   int    `json:"grade"`
		}
		if err := c.Bind(&input); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		if input.Subject == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "Subject is required")
		}

		if input.Grade == 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "Grade is required")
		}

		user := c.Get("user").(*models.User)

		chapter, err := h.chapterUC.GenerateChapterWithAI(c.Request().Context(), input.Prompt, input.Subject, input.Grade, user.UserID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusCreated, chapter)
	}
}

// GenerateMemesForChapter godoc
// @Summary Generate memes for chapter
// @Description Generate memes for a chapter using AI
// @Tags AI Generation
// @Accept json
// @Produce json
// @Param id path string true "Chapter ID"
// @Param topic body string true "Meme topic"
// @Success 201 {array} models.LessonMedia
// @Router /chapters/{id}/memes [post]
func (h *chapterHandlers) GenerateMemesForChapter() echo.HandlerFunc {
	return func(c echo.Context) error {
		chapterID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid chapter ID")
		}

		var input struct {
			Topic string `json:"topic"`
		}
		if err := c.Bind(&input); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		memes, err := h.chapterUC.GenerateMemesForChapter(c.Request().Context(), chapterID, input.Topic)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusCreated, memes)
	}
}

// GenerateQuizForChapter godoc
// @Summary Generate quiz for chapter
// @Description Generate a quiz for a chapter using AI
// @Tags AI Generation
// @Accept json
// @Produce json
// @Param id path string true "Chapter ID"
// @Success 201 {object} models.Quiz
// @Router /chapters/{id}/quiz [post]
func (h *chapterHandlers) GenerateQuizForChapter() echo.HandlerFunc {
	return func(c echo.Context) error {
		chapterID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid chapter ID")
		}

		quiz, err := h.chapterUC.GenerateQuizForChapter(c.Request().Context(), chapterID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusCreated, quiz)
	}
}

// CreateCustomChapter godoc
// @Summary Create custom chapter
// @Description Create a custom chapter for a user
// @Tags Custom Content
// @Accept json
// @Produce json
// @Param chapter body models.Chapter true "Custom chapter"
// @Success 201 {object} models.Chapter
// @Router /chapters/custom [post]
func (h *chapterHandlers) CreateCustomChapter() echo.HandlerFunc {
	return func(c echo.Context) error {
		chapter := &models.Chapter{}
		if err := c.Bind(chapter); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		// Get user ID from context (set by auth middleware)
		userID, ok := c.Get("user_id").(uuid.UUID)
		if !ok {
			return echo.NewHTTPError(http.StatusUnauthorized, "User not authenticated")
		}

		createdChapter, err := h.chapterUC.CreateCustomChapter(c.Request().Context(), chapter, userID)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		return c.JSON(http.StatusCreated, createdChapter)
	}
}

// GetUserCustomChapters godoc
// @Summary Get user's custom chapters
// @Description Get all custom chapters created by the authenticated user
// @Tags Chapters
// @Accept json
// @Produce json
// @Success 200 {array} models.Chapter
// @Router /chapters/custom [get]
func (h *chapterHandlers) GetUserCustomChapters() echo.HandlerFunc {
	return func(c echo.Context) error {
		user := c.Get("user").(*models.User)

		chapters, err := h.chapterUC.GetUserCustomChapters(c.Request().Context(), user.UserID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		// For each chapter, get the lessons to include their IDs
		for _, chapter := range chapters {
			lessons, err := h.chapterUC.GetCustomLessonsByChapter(c.Request().Context(), chapter.ChapterID)
			if err != nil {
				h.logger.Errorf("Failed to get lessons for chapter %s: %v", chapter.ChapterID, err)
				continue
			}
			chapter.Lessons = lessons
		}

		return c.JSON(http.StatusOK, chapters)
	}
}

// GetLessonByID godoc
// @Summary Get lesson by ID
// @Description Get lesson details by ID
// @Tags Lessons
// @Accept json
// @Produce json
// @Param id path string true "Lesson ID"
// @Success 200 {object} models.Lesson
// @Router /lessons/{id} [get]
func (h *chapterHandlers) GetLessonByID() echo.HandlerFunc {
	return func(c echo.Context) error {
		lessonID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid lesson ID")
		}

		lesson, err := h.chapterUC.GetLessonByID(c.Request().Context(), lessonID)
		if err != nil {
			return echo.NewHTTPError(http.StatusNotFound, "Lesson not found")
		}

		return c.JSON(http.StatusOK, lesson)
	}
}

// GetCustomLessonsByChapter godoc
// @Summary Get custom lessons by chapter ID
// @Description Get all custom lessons for a specific chapter
// @Tags Chapters
// @Accept json
// @Produce json
// @Param id path string true "Chapter ID"
// @Success 200 {array} models.Lesson
// @Router /chapters/{id}/custom-lessons [get]
func (h *chapterHandlers) GetCustomLessonsByChapter() echo.HandlerFunc {
	return func(c echo.Context) error {
		chapterID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid chapter ID")
		}

		lessons, err := h.chapterUC.GetCustomLessonsByChapter(c.Request().Context(), chapterID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusOK, lessons)
	}
}

// CreateCustomLesson godoc
// @Summary Create custom lesson
// @Description Create a custom lesson for a specific chapter
// @Tags Chapters
// @Accept json
// @Produce json
// @Param id path string true "Chapter ID"
// @Param lesson body models.Lesson true "Custom lesson"
// @Success 201 {object} models.Lesson
// @Router /chapters/{id}/custom-lessons [post]
func (h *chapterHandlers) CreateCustomLesson() echo.HandlerFunc {
	return func(c echo.Context) error {
		chapterID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "Invalid chapter ID")
		}

		lesson := &models.Lesson{}
		if err := c.Bind(lesson); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		// Set the chapter ID from the URL parameter
		lesson.ChapterID = chapterID

		// Get user from context
		user := c.Get("user").(*models.User)

		createdLesson, err := h.chapterUC.CreateCustomLesson(c.Request().Context(), lesson, user.UserID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}

		return c.JSON(http.StatusCreated, createdLesson)
	}
}

// GetQuizByID handles the request to get a quiz by its ID
func (h *chapterHandlers) GetQuizByID() echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx := c.Request().Context()

		// Parse quiz ID from path parameter
		quizIDStr := c.Param("quiz_id")
		if quizIDStr == "" {
			return c.JSON(http.StatusBadRequest, response.Error("quiz_id is required"))
		}

		quizID, err := uuid.Parse(quizIDStr)
		if err != nil {
			return c.JSON(http.StatusBadRequest, response.Error("invalid quiz_id format"))
		}

		// Get the quiz and its questions
		quiz, questions, err := h.chapterUC.GetQuizByID(ctx, quizID)
		if err != nil {
			h.logger.Errorf("failed to get quiz: %v", err)
			return c.JSON(http.StatusInternalServerError, response.Error("failed to get quiz "+err.Error()))
		}

		// Return the quiz and questions
		return c.JSON(http.StatusOK, response.Success(map[string]interface{}{
			"quiz":      quiz,
			"questions": questions,
		}))
	}
}

// GetQuizzesByChapter godoc
// @Summary Get all quizzes for a chapter
// @Description Get all quizzes associated with a specific chapter
// @Tags Quiz Management
// @Accept json
// @Produce json
// @Param id path string true "Chapter ID"
// @Success 200 {array} models.Quiz
// @Router /chapters/{id}/quizzes [get]
func (h *chapterHandlers) GetQuizzesByChapter() echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx := c.Request().Context()

		// Parse chapter ID from path parameter
		chapterIDStr := c.Param("id")
		if chapterIDStr == "" {
			return c.JSON(http.StatusBadRequest, response.Error("chapter_id is required"))
		}

		chapterID, err := uuid.Parse(chapterIDStr)
		if err != nil {
			return c.JSON(http.StatusBadRequest, response.Error("invalid chapter_id format"))
		}

		// Get all quizzes for the chapter
		quizzes, err := h.chapterUC.GetQuizzesByChapterID(ctx, chapterID)
		if err != nil {
			h.logger.Errorf("failed to get quizzes for chapter: %v", err)
			return c.JSON(http.StatusInternalServerError, response.Error("failed to get quizzes "+err.Error()))
		}

		// Return the quizzes
		return c.JSON(http.StatusOK, response.Success(map[string]interface{}{
			"quizzes": quizzes,
		}))
	}
}

// SubmitQuizAnswers handles the request to submit answers for a quiz
func (h *chapterHandlers) SubmitQuizAnswers() echo.HandlerFunc {
	type QuestionAnswer struct {
		QuestionID string `json:"question_id"`
		Answer     string `json:"answer"`
	}

	type SubmitQuizRequest struct {
		QuizID  string           `json:"quiz_id"`
		Answers []QuestionAnswer `json:"answers"`
	}

	return func(c echo.Context) error {
		ctx := c.Request().Context()

		// Get user ID from context
		userID, err := middleware.GetUserIDFromContext(c)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, response.Error("unauthorized"))
		}

		// Parse request body
		var req SubmitQuizRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, response.Error("invalid request body"))
		}

		// Validate request
		if req.QuizID == "" {
			return c.JSON(http.StatusBadRequest, response.Error("quiz_id is required"))
		}
		if len(req.Answers) == 0 {
			return c.JSON(http.StatusBadRequest, response.Error("answers are required"))
		}

		// Parse quiz ID
		quizID, err := uuid.Parse(req.QuizID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, response.Error("invalid quiz_id format"))
		}

		// Convert answers to model format
		userAnswers := make([]*models.UserQuestionResponse, 0, len(req.Answers))
		for _, ans := range req.Answers {
			questionID, err := uuid.Parse(ans.QuestionID)
			if err != nil {
				return c.JSON(http.StatusBadRequest, response.Error(fmt.Sprintf("invalid question_id format: %s", ans.QuestionID)))
			}

			userAnswers = append(userAnswers, &models.UserQuestionResponse{
				QuestionID: questionID,
				UserAnswer: ans.Answer,
			})
		}

		// Submit the answers
		attempt, err := h.chapterUC.SubmitQuizAnswers(ctx, userID, quizID, userAnswers)
		if err != nil {
			h.logger.Errorf("failed to submit quiz answers: %v", err)
			return c.JSON(http.StatusInternalServerError, response.Error("failed to submit quiz answers"))
		}

		// Return the result
		return c.JSON(http.StatusOK, response.Success(map[string]interface{}{
			"attempt": attempt,
			"score":   attempt.Score,
		}))
	}
}

// GetQuestionsByQuizID handles the request to get all questions for a specific quiz
func (h *chapterHandlers) GetQuestionsByQuizID() echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx := c.Request().Context()

		// Parse quiz ID from path parameter
		quizIDStr := c.Param("quiz_id")
		if quizIDStr == "" {
			return c.JSON(http.StatusBadRequest, response.Error("quiz_id is required"))
		}

		quizID, err := uuid.Parse(quizIDStr)
		if err != nil {
			return c.JSON(http.StatusBadRequest, response.Error("invalid quiz_id format"))
		}

		// Get questions for the quiz
		questions, err := h.chapterUC.GetQuestionsByQuizID(ctx, quizID)
		if err != nil {
			h.logger.Errorf("failed to get questions for quiz: %v", err)
			return c.JSON(http.StatusInternalServerError, response.Error("failed to get questions for quiz: "+err.Error()))
		}

		// Return the questions
		return c.JSON(http.StatusOK, response.Success(map[string]interface{}{
			"questions": questions,
		}))
	}
}

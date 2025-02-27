package http

import (
	"github.com/labstack/echo/v4"

	"github.com/AleksK1NG/api-mc/internal/chapter"
	"github.com/AleksK1NG/api-mc/internal/middleware"
)

// Map chapter routes
func MapChapterRoutes(chapterGroup *echo.Group, h chapter.Handlers, mw *middleware.MiddlewareManager) {
	// Public routes
	chapterGroup.GET("", h.GetChaptersBySubject())
	chapterGroup.GET("/:id", h.GetChapterByID())

	// Lesson routes
	lessonGroup := chapterGroup.Group("/lessons")
	lessonGroup.GET("/:id", h.GetLessonByID())

	// Protected routes (require authentication)
	protected := chapterGroup.Group("")
	protected.Use(mw.AuthJWTMiddleware(mw.GetAuthUseCase(), mw.GetConfig()))
	{
		// Chapter management
		protected.POST("", h.CreateChapter())
		protected.PUT("/:id", h.UpdateChapter())
		protected.DELETE("/:id", h.DeleteChapter())

		// AI generation
		protected.POST("/generate", h.GenerateChapterWithAI())
		protected.POST("/:id/memes", h.GenerateMemesForChapter())
		protected.POST("/:id/quiz", h.GenerateQuizForChapter())

		// Custom content
		protected.POST("/custom", h.CreateCustomChapter())
		protected.GET("/custom", h.GetUserCustomChapters())
		protected.GET("/:id/custom-lessons", h.GetCustomLessonsByChapter())
		protected.POST("/:id/custom-lessons", h.CreateCustomLesson())

		// Quiz management
		protected.GET("/quizzes/:quiz_id", h.GetQuizByID())
		protected.POST("/quizzes/submit", h.SubmitQuizAnswers())
	}
}

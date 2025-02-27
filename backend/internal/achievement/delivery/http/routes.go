package http

import (
	"github.com/labstack/echo/v4"

	"github.com/AleksK1NG/api-mc/internal/achievement"
	"github.com/AleksK1NG/api-mc/internal/middleware"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

// Map achievement routes
func MapAchievementRoutes(
	achievementGroup *echo.Group,
	h achievement.Handlers,
	mw *middleware.MiddlewareManager,
	achievementUC achievement.UseCase,
	logger logger.Logger,
) {
	// Public routes
	achievementGroup.GET("", h.GetAllAchievements())
	achievementGroup.GET("/:id", h.GetAchievementByID())

	// Protected routes (require authentication)
	protected := achievementGroup.Group("")
	protected.Use(mw.AuthJWTMiddleware(mw.GetAuthUseCase(), mw.GetConfig()))
	{
		// User achievement routes
		protected.GET("/user", h.GetUserAchievements())

		// Admin routes - these would typically be protected by admin authorization
		// In a real app, you would add admin middleware here
		admin := protected.Group("/admin")
		{
			admin.POST("", h.CreateAchievement())
			admin.PUT("/:id", h.UpdateAchievement())
			admin.DELETE("/:id", h.DeleteAchievement())
			admin.POST("/award", h.AwardAchievementToUser())
		}
	}
}

// RegisterAchievementMiddleware registers the achievement checking middleware on relevant endpoints
func RegisterAchievementMiddleware(
	e *echo.Echo,
	achievementUC achievement.UseCase,
	logger logger.Logger,
) {
	// Create the achievement checking middleware
	achievementMiddleware := CheckUserAchievements(achievementUC, logger)

	// Apply the middleware to relevant endpoints
	// These are examples - add more as needed for your application

	// Lesson completion endpoints
	if lessonGroup := e.Group("/lessons"); lessonGroup != nil {
		lessonGroup.Use(achievementMiddleware)
	}

	// Quiz completion endpoints
	if quizGroup := e.Group("/quizzes"); quizGroup != nil {
		quizGroup.Use(achievementMiddleware)
	}

	// User progress endpoints
	if progressGroup := e.Group("/progress"); progressGroup != nil {
		progressGroup.Use(achievementMiddleware)
	}
}

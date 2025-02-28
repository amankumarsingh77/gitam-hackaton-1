package http

import (
	"github.com/labstack/echo/v4"

	"github.com/AleksK1NG/api-mc/internal/leaderboard"
	"github.com/AleksK1NG/api-mc/internal/middleware"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

// MapLeaderboardRoutes maps the leaderboard routes to the Echo router
func MapLeaderboardRoutes(
	leaderboardGroup *echo.Group,
	h leaderboard.Handlers,
	mw *middleware.MiddlewareManager,
	logger logger.Logger,
) {
	// Public routes
	leaderboardGroup.GET("", h.GetLeaderboard())
	leaderboardGroup.GET("/top", h.GetTopPerformers())

	// Recalculate endpoint - this is now public and can be triggered manually if needed
	// Note: Leaderboard is automatically recalculated every 10 minutes by the background worker
	leaderboardGroup.POST("/recalculate", h.RecalculateRankings())

	// Protected routes (require authentication)
	protected := leaderboardGroup.Group("")
	protected.Use(mw.AuthJWTMiddleware(mw.GetAuthUseCase(), mw.GetConfig()))
	{
		// User routes
		protected.GET("/users/:user_id", h.GetUserRank())

		// Admin routes
		admin := protected.Group("/admin")
		{
			admin.POST("/recalculate", h.RecalculateRankings())
		}
	}
}

// RegisterLeaderboardMiddleware registers the leaderboard tracking middleware
func RegisterLeaderboardMiddleware(
	e *echo.Echo,
	leaderboardUC leaderboard.UseCase,
	logger logger.Logger,
) {
	// Create the leaderboard tracking middleware
	leaderboardMiddleware := LeaderboardTrackingMiddleware(leaderboardUC, logger)

	// Apply the middleware to relevant endpoints
	// Auth endpoints (profile updates)
	if authGroup := e.Group("/auth"); authGroup != nil {
		authGroup.Use(leaderboardMiddleware)
	}

	// Lesson endpoints
	if lessonGroup := e.Group("/lessons"); lessonGroup != nil {
		lessonGroup.Use(leaderboardMiddleware)
	}

	// Quiz endpoints
	if quizGroup := e.Group("/quizzes"); quizGroup != nil {
		quizGroup.Use(leaderboardMiddleware)
	}

	// Chapter endpoints
	if chapterGroup := e.Group("/chapters"); chapterGroup != nil {
		chapterGroup.Use(leaderboardMiddleware)
	}

	logger.Info("Leaderboard tracking middleware registered")
}

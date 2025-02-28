package http

import (
	"github.com/labstack/echo/v4"

	"github.com/AleksK1NG/api-mc/internal/achievement"
	"github.com/AleksK1NG/api-mc/internal/middleware"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

func MapAchievementRoutes(
	achievementGroup *echo.Group,
	h achievement.Handlers,
	mw *middleware.MiddlewareManager,
	achievementUC achievement.UseCase,
	logger logger.Logger,
) {

	achievementGroup.GET("", h.GetAllAchievements())
	achievementGroup.GET("/:id", h.GetAchievementByID())

	protected := achievementGroup.Group("")
	protected.Use(mw.AuthJWTMiddleware(mw.GetAuthUseCase(), mw.GetConfig()))
	{

		protected.GET("/user", h.GetUserAchievements())

		admin := protected.Group("/admin")
		{
			admin.POST("", h.CreateAchievement())
			admin.PUT("/:id", h.UpdateAchievement())
			admin.DELETE("/:id", h.DeleteAchievement())
			admin.POST("/award", h.AwardAchievementToUser())
		}
	}
}

func RegisterAchievementMiddleware(
	e *echo.Echo,
	achievementUC achievement.UseCase,
	logger logger.Logger,
) {

	achievementMiddleware := CheckUserAchievements(achievementUC, logger)

	if lessonGroup := e.Group("/lessons"); lessonGroup != nil {
		lessonGroup.Use(achievementMiddleware)
	}

	if quizGroup := e.Group("/quizzes"); quizGroup != nil {
		quizGroup.Use(achievementMiddleware)
	}

	if progressGroup := e.Group("/progress"); progressGroup != nil {
		progressGroup.Use(achievementMiddleware)
	}
}

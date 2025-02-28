package http

import (
	"github.com/labstack/echo/v4"

	"github.com/AleksK1NG/api-mc/internal/auth"
	"github.com/AleksK1NG/api-mc/internal/middleware"
)

func MapAuthRoutes(authGroup *echo.Group, h auth.Handlers, mw *middleware.MiddlewareManager) {

	authGroup.POST("/register", h.Register())
	authGroup.POST("/login", h.Login())

	profile := authGroup.Group("/profile")
	profile.Use(mw.AuthJWTMiddleware(mw.GetAuthUseCase(), mw.GetConfig()))
	{
		profile.PUT("/:id", h.UpdateProfile(), mw.CSRF)
		profile.GET("/:id", h.GetProfile())
		profile.GET("/:id/progress", h.GetProgress())
		profile.GET("/:id/streak", h.GetDailyStreak())
	}
}

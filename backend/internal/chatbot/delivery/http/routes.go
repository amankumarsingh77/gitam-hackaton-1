package http

import (
	"github.com/AleksK1NG/api-mc/internal/chatbot"
	"github.com/AleksK1NG/api-mc/internal/middleware"
	"github.com/labstack/echo/v4"
)

// Map chatbot routes
func MapChatbotRoutes(chatbotGroup *echo.Group, h chatbot.Handlers, mw *middleware.MiddlewareManager) {
	chatbotGroup.POST("/chat", h.AddChatResponse(), mw.AuthJWTMiddleware(mw.GetAuthUseCase(), mw.GetConfig()))
	chatbotGroup.GET("/history", h.GetHistory(), mw.AuthJWTMiddleware(mw.GetAuthUseCase(), mw.GetConfig()))
}

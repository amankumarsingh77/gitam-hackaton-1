package http

import (
	"net/http"

	"github.com/AleksK1NG/api-mc/config"
	"github.com/AleksK1NG/api-mc/internal/chatbot"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
	"github.com/labstack/echo/v4"
)

type chatbotHandlers struct {
	cfg       *config.Config
	chatbotUC chatbot.UseCase
	logger    logger.Logger
}

func NewChatbotHandlers(cfg *config.Config, chatbotUC chatbot.UseCase, logger logger.Logger) chatbot.Handlers {
	return &chatbotHandlers{cfg: cfg, chatbotUC: chatbotUC, logger: logger}
}


func (h *chatbotHandlers) AddChatResponse() echo.HandlerFunc {
	return func(c echo.Context) error {
		user := c.Get("user").(*models.User)
		chat := &models.Chatbot{}
		
		if err := c.Bind(chat); err != nil {
			h.logger.Errorf("bind chat error: %v", err)
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		
		response, err := h.chatbotUC.AddChatResponse(c.Request().Context(), chat, user.UserID)
		if err != nil {
			h.logger.Errorf("AddChatResponse error: %v", err)
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		
		chat.Response = response
		chat.UserID = user.UserID
		
		return c.JSON(http.StatusCreated, chat)
	}
}


func (h *chatbotHandlers) GetHistory() echo.HandlerFunc {
	return func(c echo.Context) error {
		user := c.Get("user").(*models.User)
		
		history, err := h.chatbotUC.GetHistory(c.Request().Context(), user.UserID)
		if err != nil {
			h.logger.Errorf("GetHistory error: %v", err)
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		
		return c.JSON(http.StatusOK, history)
	}
}
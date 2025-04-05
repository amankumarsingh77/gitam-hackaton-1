package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/config"
	"github.com/AleksK1NG/api-mc/internal/chatbot"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

type ChatbotUC struct {
	cfg         *config.Config
	chatbotRepo chatbot.Repository
	aiService   chatbot.AIService
	logger      logger.Logger
}

func NewChatbotUseCase(cfg *config.Config, chatbotRepo chatbot.Repository, aiService chatbot.AIService, logger logger.Logger) chatbot.UseCase {
	return &ChatbotUC{
		cfg:         cfg,
		chatbotRepo: chatbotRepo,
		aiService:   aiService,
		logger:      logger,
	}
}

// AddChatResponse handles the chat interaction process
func (uc *ChatbotUC) AddChatResponse(ctx context.Context, data *models.Chatbot, userID uuid.UUID) (string, error) {
	// Validate input
	if userID == uuid.Nil {
		return "", fmt.Errorf("invalid user ID")
	}

	if data == nil {
		return "", fmt.Errorf("chat data cannot be nil")
	}

	if data.Prompt == "" {
		return "", fmt.Errorf("prompt cannot be empty")
	}

	// Set user ID if not already set
	if data.UserID == uuid.Nil {
		data.UserID = userID
	}

	// Set creation time
	data.CreatedAt = time.Now()

	// Generate a new ID if not already set
	if data.ID == uuid.Nil {
		data.ID = uuid.New()
	}

	// Get response from AI service
	uc.logger.Infof("Getting AI response for user %s with prompt: %s", userID, data.Prompt)

	aiResponse, err := uc.aiService.GetResponse(ctx, data.Prompt)
	if err != nil {
		uc.logger.Errorf("Failed to get AI response: %v", err)
		return "", fmt.Errorf("failed to get AI response: %w", err)
	}

	// Set the response in the chat data
	data.Response = aiResponse

	// Save the chat history to the database
	uc.logger.Infof("Saving chat history for user %s", userID)

	response, err := uc.chatbotRepo.AddChatResponse(ctx, data, userID)
	if err != nil {
		uc.logger.Errorf("Failed to save chat history: %v", err)
		return "", fmt.Errorf("failed to save chat history: %w", err)
	}

	return response, nil
}

// GetHistory retrieves the chat history for a specific user
func (uc *ChatbotUC) GetHistory(ctx context.Context, userID uuid.UUID) ([]*models.Chatbot, error) {
	if userID == uuid.Nil {
		return nil, fmt.Errorf("invalid user ID")
	}

	uc.logger.Infof("Retrieving chat history for user %s", userID)

	history, err := uc.chatbotRepo.GetHistory(ctx, userID)
	if err != nil {
		uc.logger.Errorf("Failed to retrieve chat history: %v", err)
		return nil, fmt.Errorf("failed to retrieve chat history: %w", err)
	}

	return history, nil
}

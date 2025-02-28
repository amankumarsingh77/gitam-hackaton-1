package chatbot

import (
	"context"

	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/google/uuid"
)

type UseCase interface{
	AddChatResponse(ctx context.Context, data *models.Chatbot, userID uuid.UUID) (string, error)
	GetHistory(ctx context.Context, userID uuid.UUID) ([]*models.Chatbot, error)
}




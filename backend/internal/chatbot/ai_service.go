package chatbot

import (
	"context"
)

type AIService interface {
	GetResponse(ctx context.Context, prompt string) (string, error)
}
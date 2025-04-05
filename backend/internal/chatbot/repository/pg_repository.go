package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/AleksK1NG/api-mc/internal/chatbot"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// chatHistoryDB is a temporary struct used for database mapping
type chatHistoryDB struct {
	ID        uuid.UUID `db:"id"`
	UserID    uuid.UUID `db:"user_id"`
	Prompt    string    `db:"prompt"`
	Response  string    `db:"response"`
	CreatedAt time.Time `db:"created_at"`
}

// Convert to models.Chatbot
func (c *chatHistoryDB) toChatbot() *models.Chatbot {
	return &models.Chatbot{
		ID:        c.ID,
		UserID:    c.UserID,
		Prompt:    c.Prompt,
		Response:  c.Response,
		CreatedAt: c.CreatedAt,
	}
}

type chatbotRepo struct {
	db *sqlx.DB
}

func NewChatbotRepository(db *sqlx.DB) chatbot.Repository {
	return &chatbotRepo{db: db}
}

func (r *chatbotRepo) GetHistory(ctx context.Context, userID uuid.UUID) ([]*models.Chatbot, error) {
	// Use the temporary struct with proper db tags for the query
	dbHistory := []*chatHistoryDB{}
	if err := r.db.SelectContext(ctx, &dbHistory, GetChatHistoryByUserIDQuery, userID); err != nil {
		return nil, fmt.Errorf("failed to retrieve chat history: %w", err)
	}

	// Convert to the model struct
	history := make([]*models.Chatbot, len(dbHistory))
	for i, item := range dbHistory {
		history[i] = item.toChatbot()
	}

	return history, nil
}

func (r *chatbotRepo) AddChatResponse(ctx context.Context, data *models.Chatbot, userID uuid.UUID) (string, error) {
	// Validate input data
	if data.UserID == uuid.Nil {
		return "", fmt.Errorf("no user id provided")
	}

	// Ensure we have a valid ID
	if data.ID == uuid.Nil {
		data.ID = uuid.New()
	}

	// Set creation time if not already set
	if data.CreatedAt.IsZero() {
		data.CreatedAt = time.Now()
	}

	// Validate that we have both a prompt and a response
	if data.Prompt == "" {
		return "", fmt.Errorf("prompt cannot be empty")
	}

	if data.Response == "" {
		return "", fmt.Errorf("response cannot be empty")
	}

	// Insert the chat entry with both prompt and response
	_, err := r.db.ExecContext(
		ctx,
		CreateChatHistoryQuery,
		data.ID,
		data.UserID,
		data.Prompt,
		data.Response,
		data.CreatedAt,
	)

	if err != nil {
		return "", fmt.Errorf("failed to add chat response: %w", err)
	}

	return data.Response, nil
}

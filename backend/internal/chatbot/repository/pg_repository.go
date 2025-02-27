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

type chatbotRepo struct {
	db *sqlx.DB
}

func NewChatbotRepository(db *sqlx.DB) chatbot.Repository {
	return &chatbotRepo{db: db}
}

func (r *chatbotRepo) GetHistory(ctx context.Context,userID uuid.UUID) ([]*models.Chatbot, error){
	history := []*models.Chatbot{}
	if err := r.db.SelectContext(ctx, &history, GetChatHistoryByUserIDQuery, userID); err != nil {
		return nil, err
	}
	return history, nil
}



func (r *chatbotRepo) AddChatResponse(ctx context.Context,data *models.Chatbot, userID uuid.UUID) (string, error) {
	if data.UserID == uuid.Nil{
		return "",fmt.Errorf("No user id provided")
	}
	if data.CreatedAt.IsZero(){
		data.CreatedAt = time.Now()
	}
	
	_,err := r.db.ExecContext(
		ctx,
		CreateChatHistoryQuery,
		data.ID,
		data.UserID,
		data.Prompt,
		data.Response,
		data.CreatedAt,

	)
	if err !=nil{
		return "",err
	}
	return data.Response,nil
}


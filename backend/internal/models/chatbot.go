package models

import (
	"time"

	"github.com/google/uuid"
)

// ChatHistory represents a record of a chat interaction.
type Chatbot struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid"`
	Prompt    string    `json:"prompt" gorm:"type:text"`
	Response  string    `json:"response" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

package models

import (
	"time"

	"github.com/google/uuid"
)

// Lesson represents a learning unit with content and associated media
type Lesson struct {
	LessonID     uuid.UUID `json:"lesson_id" db:"lesson_id" validate:"omitempty"`
	ChapterID    uuid.UUID `json:"chapter_id" db:"chapter_id" validate:"required"`
	Title        string    `json:"title" db:"title" validate:"required,lte=100"`
	Description  string    `json:"description" db:"description" validate:"required,lte=500"`
	Content      string    `json:"content" db:"content" validate:"required"`
	Grade        int       `json:"grade" db:"grade" validate:"required,gte=1,lte=12"`
	Subject      string    `json:"subject" db:"subject" validate:"required,lte=50"`
	Order        int       `json:"order" db:"order" validate:"required"`
	IsCustom     bool      `json:"is_custom" db:"is_custom"`
	CreatedBy    uuid.UUID `json:"created_by" db:"created_by" validate:"required"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
	ImagePrompts []string  `json:"image_prompts,omitempty" db:"-"`
}

// LessonMedia represents images and memes associated with a lesson
type LessonMedia struct {
	MediaID     uuid.UUID `json:"media_id" db:"media_id" validate:"omitempty"`
	LessonID    uuid.UUID `json:"lesson_id" db:"lesson_id" validate:"required"`
	MediaType   string    `json:"media_type" db:"media_type" validate:"required,oneof=image meme"`
	URL         string    `json:"url" db:"url" validate:"required,url"`
	Description string    `json:"description" db:"description" validate:"required,lte=200"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Chapter represents a collection of related lessons
type Chapter struct {
	ChapterID   uuid.UUID `json:"chapter_id" db:"chapter_id" validate:"omitempty"`
	Title       string    `json:"title" db:"title" validate:"required,lte=100"`
	Description string    `json:"description" db:"description" validate:"required,lte=500"`
	Grade       int       `json:"grade" db:"grade" validate:"required,gte=1,lte=12"`
	Subject     string    `json:"subject" db:"subject" validate:"required,lte=50"`
	Order       int       `json:"order" db:"order" validate:"required"`
	IsCustom    bool      `json:"is_custom" db:"is_custom"`
	CreatedBy   uuid.UUID `json:"created_by" db:"created_by" validate:"required"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	Lessons     []*Lesson `json:"lessons,omitempty" db:"-"`
}

// LessonList represents a paginated list of lessons
type LessonList struct {
	TotalCount int       `json:"total_count"`
	TotalPages int       `json:"total_pages"`
	Page       int       `json:"page"`
	Size       int       `json:"size"`
	HasMore    bool      `json:"has_more"`
	Lessons    []*Lesson `json:"lessons"`
}

// ChapterList represents a paginated list of chapters
type ChapterList struct {
	TotalCount int        `json:"total_count"`
	TotalPages int        `json:"total_pages"`
	Page       int        `json:"page"`
	Size       int        `json:"size"`
	HasMore    bool       `json:"has_more"`
	Chapters   []*Chapter `json:"chapters"`
}

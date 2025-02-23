package models

import (
	"time"

	"github.com/google/uuid"
)

// UserProgress tracks overall progress in a subject
type UserProgress struct {
	ProgressID   uuid.UUID `json:"progress_id" db:"progress_id" validate:"omitempty"`
	UserID       uuid.UUID `json:"user_id" db:"user_id" validate:"required"`
	Subject      string    `json:"subject" db:"subject" validate:"required,lte=50"`
	Grade        int       `json:"grade" db:"grade" validate:"required,gte=1,lte=12"`
	ChaptersRead int       `json:"chapters_read" db:"chapters_read"`
	QuizzesTaken int       `json:"quizzes_taken" db:"quizzes_taken"`
	AvgScore     float64   `json:"avg_score" db:"avg_score"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// LessonProgress tracks progress in individual lessons
type LessonProgress struct {
	LessonProgressID uuid.UUID  `json:"lesson_progress_id" db:"lesson_progress_id" validate:"omitempty"`
	UserID           uuid.UUID  `json:"user_id" db:"user_id" validate:"required"`
	LessonID         uuid.UUID  `json:"lesson_id" db:"lesson_id" validate:"required"`
	Status           string     `json:"status" db:"status" validate:"required,oneof=not_started in_progress completed"`
	CompletedAt      *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	TimeSpent        int        `json:"time_spent" db:"time_spent"` // in seconds
	CreatedAt        time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
}

// Achievement represents user achievements and badges
type Achievement struct {
	AchievementID uuid.UUID `json:"achievement_id" db:"achievement_id" validate:"omitempty"`
	Title         string    `json:"title" db:"title" validate:"required,lte=100"`
	Description   string    `json:"description" db:"description" validate:"required,lte=500"`
	Type          string    `json:"type" db:"type" validate:"required,oneof=streak quiz_score subject_mastery custom"`
	RequiredValue int       `json:"required_value" db:"required_value" validate:"required,gt=0"`
	IconURL       string    `json:"icon_url" db:"icon_url" validate:"required,url"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// UserAchievement tracks achievements earned by users
type UserAchievement struct {
	UserAchievementID uuid.UUID `json:"user_achievement_id" db:"user_achievement_id" validate:"omitempty"`
	UserID            uuid.UUID `json:"user_id" db:"user_id" validate:"required"`
	AchievementID     uuid.UUID `json:"achievement_id" db:"achievement_id" validate:"required"`
	EarnedAt          time.Time `json:"earned_at" db:"earned_at"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}

// DailyStreak tracks user's daily learning streaks
type DailyStreak struct {
	StreakID      uuid.UUID `json:"streak_id" db:"streak_id" validate:"omitempty"`
	UserID        uuid.UUID `json:"user_id" db:"user_id" validate:"required"`
	CurrentStreak int       `json:"current_streak" db:"current_streak"`
	MaxStreak     int       `json:"max_streak" db:"max_streak"`
	LastActivity  time.Time `json:"last_activity" db:"last_activity"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// ProgressList represents a paginated list of user progress records
type ProgressList struct {
	TotalCount int             `json:"total_count"`
	TotalPages int             `json:"total_pages"`
	Page       int             `json:"page"`
	Size       int             `json:"size"`
	HasMore    bool            `json:"has_more"`
	Progress   []*UserProgress `json:"progress"`
}

// AchievementList represents a paginated list of achievements
type AchievementList struct {
	TotalCount   int            `json:"total_count"`
	TotalPages   int            `json:"total_pages"`
	Page         int            `json:"page"`
	Size         int            `json:"size"`
	HasMore      bool           `json:"has_more"`
	Achievements []*Achievement `json:"achievements"`
}

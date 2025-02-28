package models

import (
	"time"

	"github.com/google/uuid"
)

// LeaderboardEntry represents a single entry in the leaderboard
type LeaderboardEntry struct {
	EntryID   uuid.UUID `json:"entry_id" db:"entry_id" validate:"omitempty"`
	UserID    uuid.UUID `json:"user_id" db:"user_id" validate:"required"`
	Username  string    `json:"username" db:"username" validate:"required"`
	AvatarURL string    `json:"avatar_url" db:"avatar_url"`
	XP        int       `json:"xp" db:"xp"`
	Level     int       `json:"level" db:"level"`
	Streak    int       `json:"streak" db:"streak"`
	Rank      int       `json:"rank" db:"rank"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// LeaderboardFilter represents filter options for leaderboard queries
type LeaderboardFilter struct {
	TimeFrame string    `json:"time_frame"` // daily, weekly, monthly, all-time
	Subject   string    `json:"subject"`    // filter by subject
	Grade     int       `json:"grade"`      // filter by grade
	Limit     int       `json:"limit"`      // number of entries to return
	UserID    uuid.UUID `json:"user_id"`    // to get a specific user's rank
}

// LeaderboardResponse represents the response for leaderboard queries
type LeaderboardResponse struct {
	Entries      []*LeaderboardEntry `json:"entries"`
	TotalEntries int                 `json:"total_entries"`
	UserRank     *LeaderboardEntry   `json:"user_rank,omitempty"` // Current user's rank if requested
}

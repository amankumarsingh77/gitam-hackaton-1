package leaderboard

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/internal/models"
)

// UseCase interface for leaderboard operations
type UseCase interface {
	// Get leaderboard entries with optional filtering
	GetLeaderboard(ctx context.Context, filter *models.LeaderboardFilter) (*models.LeaderboardResponse, error)

	// Get a specific user's rank and stats
	GetUserRank(ctx context.Context, userID uuid.UUID) (*models.LeaderboardEntry, error)

	// Update a user's leaderboard entry (typically called when user earns XP, etc.)
	UpdateUserStats(ctx context.Context, entry *models.LeaderboardEntry) error

	// Recalculate all rankings (typically run as a scheduled job)
	RecalculateRankings(ctx context.Context) error

	// Get top performers for a specific metric (XP, streak, etc.)
	GetTopPerformers(ctx context.Context, metric string, limit int) ([]*models.LeaderboardEntry, error)

	// Sync a user's stats from various repositories to the leaderboard
	SyncUserStats(ctx context.Context, userID uuid.UUID) error

	// Get the context timeout duration for leaderboard operations
	GetContextTimeout() time.Duration
}

// UserProgressRepository provides access to user progress data
type UserProgressRepository interface {
	GetUserXP(ctx context.Context, userID uuid.UUID) (int, error)
	GetUserLevel(ctx context.Context, userID uuid.UUID) (int, error)
}

// UserStreakRepository provides access to user streak data
type UserStreakRepository interface {
	GetUserStreak(ctx context.Context, userID uuid.UUID) (int, error)
}

package leaderboard

import (
	"context"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/internal/models"
)

type Repository interface {
	GetLeaderboard(ctx context.Context, filter *models.LeaderboardFilter) (*models.LeaderboardResponse, error)

	GetUserRank(ctx context.Context, userID uuid.UUID) (*models.LeaderboardEntry, error)

	UpdateUserStats(ctx context.Context, entry *models.LeaderboardEntry) error

	RecalculateRankings(ctx context.Context) error

	GetTopPerformers(ctx context.Context, metric string, limit int) ([]*models.LeaderboardEntry, error)
}

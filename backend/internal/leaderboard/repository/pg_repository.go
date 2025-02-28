package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/AleksK1NG/api-mc/internal/leaderboard"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

// PostgresRepository implements the leaderboard.Repository interface
type PostgresRepository struct {
	db     *sqlx.DB
	logger logger.Logger
}

// NewPostgresRepository creates a new PostgreSQL repository for leaderboard
func NewPostgresRepository(db *sqlx.DB, logger logger.Logger) leaderboard.Repository {
	return &PostgresRepository{
		db:     db,
		logger: logger,
	}
}

// GetLeaderboard retrieves leaderboard entries with optional filtering
func (r *PostgresRepository) GetLeaderboard(ctx context.Context, filter *models.LeaderboardFilter) (*models.LeaderboardResponse, error) {
	var entries []*models.LeaderboardEntry
	var totalEntries int

	// Set default limit if not specified
	limit := 10
	if filter.Limit > 0 {
		limit = filter.Limit
	}

	// Build query based on filters
	query := getLeaderboardBaseQuery
	countQuery := countLeaderboardBaseQuery
	args := []interface{}{}

	// Add filters
	if filter.Subject != "" {
		query += ` AND le.subject = $` + fmt.Sprintf("%d", len(args)+1)
		countQuery += ` AND le.subject = $` + fmt.Sprintf("%d", len(args)+1)
		args = append(args, filter.Subject)
	}

	if filter.Grade > 0 {
		query += ` AND le.grade = $` + fmt.Sprintf("%d", len(args)+1)
		countQuery += ` AND le.grade = $` + fmt.Sprintf("%d", len(args)+1)
		args = append(args, filter.Grade)
	}

	// Add time frame filter if specified
	if filter.TimeFrame != "" {
		var timeCondition string
		switch filter.TimeFrame {
		case "daily":
			timeCondition = dailyTimeFrameCondition
		case "weekly":
			timeCondition = weeklyTimeFrameCondition
		case "monthly":
			timeCondition = monthlyTimeFrameCondition
		}

		if timeCondition != "" {
			query += " AND " + timeCondition
			countQuery += " AND " + timeCondition
		}
	}

	// Add order by and limit
	query += ` ORDER BY le.rank ASC LIMIT $` + fmt.Sprintf("%d", len(args)+1)
	args = append(args, limit)

	// Execute query
	if err := r.db.SelectContext(ctx, &entries, query, args...); err != nil {
		r.logger.Errorf("Error getting leaderboard entries: %v", err)
		return nil, err
	}

	// Get total count
	if err := r.db.GetContext(ctx, &totalEntries, countQuery, args[:len(args)-1]...); err != nil {
		r.logger.Errorf("Error getting total leaderboard entries count: %v", err)
		return nil, err
	}

	// Get user rank if requested
	var userRank *models.LeaderboardEntry
	if filter.UserID != uuid.Nil {
		if err := r.db.GetContext(ctx, &userRank, getUserRankQuery, filter.UserID); err != nil {
			r.logger.Warnf("User %s not found in leaderboard: %v", filter.UserID, err)
			// Not returning error as this is not a critical failure
		}
	}

	return &models.LeaderboardResponse{
		Entries:      entries,
		TotalEntries: totalEntries,
		UserRank:     userRank,
	}, nil
}

// GetUserRank retrieves a specific user's rank and stats
func (r *PostgresRepository) GetUserRank(ctx context.Context, userID uuid.UUID) (*models.LeaderboardEntry, error) {
	var entry models.LeaderboardEntry

	if err := r.db.GetContext(ctx, &entry, getUserRankQuery, userID); err != nil {
		r.logger.Errorf("Error getting user rank: %v", err)
		return nil, err
	}

	return &entry, nil
}

// UpdateUserStats updates a user's leaderboard entry
func (r *PostgresRepository) UpdateUserStats(ctx context.Context, entry *models.LeaderboardEntry) error {
	if entry.EntryID == uuid.Nil {
		entry.EntryID = uuid.New()
	}

	row := r.db.QueryRowContext(
		ctx,
		updateUserStatsQuery,
		entry.EntryID,
		entry.UserID,
		entry.XP,
		entry.Level,
		entry.Streak,
		entry.Rank,
	)

	if err := row.Scan(&entry.EntryID, &entry.CreatedAt, &entry.UpdatedAt); err != nil {
		r.logger.Errorf("Error updating user stats: %v", err)
		return err
	}

	return nil
}

// RecalculateRankings recalculates all rankings
func (r *PostgresRepository) RecalculateRankings(ctx context.Context) error {
	_, err := r.db.ExecContext(ctx, recalculateRankingsQuery)
	if err != nil {
		r.logger.Errorf("Error recalculating rankings: %v", err)
		return err
	}

	return nil
}

// GetTopPerformers retrieves top performers for a specific metric
func (r *PostgresRepository) GetTopPerformers(ctx context.Context, metric string, limit int) ([]*models.LeaderboardEntry, error) {
	var entries []*models.LeaderboardEntry

	// Set default limit if not specified
	if limit <= 0 {
		limit = 10
	}

	// Select query based on metric
	var query string
	switch metric {
	case "xp":
		query = getTopPerformersByXPQuery
	case "streak":
		query = getTopPerformersByStreakQuery
	case "level":
		query = getTopPerformersByLevelQuery
	default:
		query = getTopPerformersByRankQuery
	}

	if err := r.db.SelectContext(ctx, &entries, query, limit); err != nil {
		r.logger.Errorf("Error getting top performers: %v", err)
		return nil, err
	}

	return entries, nil
}

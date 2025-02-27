package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/internal/leaderboard"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

type LeaderboardUseCase struct {
	leaderboardRepo  leaderboard.Repository
	userProgressRepo leaderboard.UserProgressRepository
	userStreakRepo   leaderboard.UserStreakRepository
	logger           logger.Logger
}

func NewLeaderboardUseCase(
	leaderboardRepo leaderboard.Repository,
	userProgressRepo leaderboard.UserProgressRepository,
	userStreakRepo leaderboard.UserStreakRepository,
	logger logger.Logger,
) leaderboard.UseCase {
	return &LeaderboardUseCase{
		leaderboardRepo:  leaderboardRepo,
		userProgressRepo: userProgressRepo,
		userStreakRepo:   userStreakRepo,
		logger:           logger,
	}
}

func NewLeaderboardUseCaseWithoutDeps(
	leaderboardRepo leaderboard.Repository,
	logger logger.Logger,
) leaderboard.UseCase {
	return &LeaderboardUseCase{
		leaderboardRepo:  leaderboardRepo,
		userProgressRepo: nil,
		userStreakRepo:   nil,
		logger:           logger,
	}
}

func (u *LeaderboardUseCase) GetLeaderboard(ctx context.Context, filter *models.LeaderboardFilter) (*models.LeaderboardResponse, error) {
	return u.leaderboardRepo.GetLeaderboard(ctx, filter)
}

func (u *LeaderboardUseCase) GetUserRank(ctx context.Context, userID uuid.UUID) (*models.LeaderboardEntry, error) {
	return u.leaderboardRepo.GetUserRank(ctx, userID)
}

func (u *LeaderboardUseCase) UpdateUserStats(ctx context.Context, entry *models.LeaderboardEntry) error {
	return u.leaderboardRepo.UpdateUserStats(ctx, entry)
}

func (u *LeaderboardUseCase) RecalculateRankings(ctx context.Context) error {
	return u.leaderboardRepo.RecalculateRankings(ctx)
}

func (u *LeaderboardUseCase) GetTopPerformers(ctx context.Context, metric string, limit int) ([]*models.LeaderboardEntry, error) {
	return u.leaderboardRepo.GetTopPerformers(ctx, metric, limit)
}

// SyncUserStats syncs a user's stats from various repositories to the leaderboard
// This is a helper method that can be called when user stats change
func (u *LeaderboardUseCase) SyncUserStats(ctx context.Context, userID uuid.UUID) error {
	// Default values
	xp := 0
	level := 1
	streak := 0

	// Get user XP if repository is available
	if u.userProgressRepo != nil {
		userXP, err := u.userProgressRepo.GetUserXP(ctx, userID)
		if err != nil {
			u.logger.Warnf("Error getting user XP: %v", err)
		} else {
			xp = userXP
		}
	}

	// Get user level if repository is available
	if u.userProgressRepo != nil {
		userLevel, err := u.userProgressRepo.GetUserLevel(ctx, userID)
		if err != nil {
			u.logger.Warnf("Error getting user level: %v", err)
		} else {
			level = userLevel
		}
	}

	// Get user streak if repository is available
	if u.userStreakRepo != nil {
		userStreak, err := u.userStreakRepo.GetUserStreak(ctx, userID)
		if err != nil {
			u.logger.Warnf("Error getting user streak: %v", err)
		} else {
			streak = userStreak
		}
	}

	// Create or update leaderboard entry
	entry := &models.LeaderboardEntry{
		UserID: userID,
		XP:     xp,
		Level:  level,
		Streak: streak,
		// Rank will be updated by RecalculateRankings
	}

	// Update user stats
	if err := u.leaderboardRepo.UpdateUserStats(ctx, entry); err != nil {
		u.logger.Errorf("Error updating user stats: %v", err)
		return err
	}

	// Recalculate rankings
	if err := u.leaderboardRepo.RecalculateRankings(ctx); err != nil {
		u.logger.Errorf("Error recalculating rankings: %v", err)
		return err
	}

	return nil
}

// GetContextTimeout returns the context timeout duration for leaderboard operations
func (u *LeaderboardUseCase) GetContextTimeout() time.Duration {
	return 30 * time.Second
}

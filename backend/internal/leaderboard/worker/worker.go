package worker

import (
	"context"
	"time"

	"github.com/AleksK1NG/api-mc/internal/leaderboard"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

// LeaderboardWorker handles periodic leaderboard recalculation
type LeaderboardWorker struct {
	leaderboardUC leaderboard.UseCase
	logger        logger.Logger
	interval      time.Duration
	stopCh        chan struct{}
}

// NewLeaderboardWorker creates a new leaderboard worker
func NewLeaderboardWorker(leaderboardUC leaderboard.UseCase, logger logger.Logger) *LeaderboardWorker {
	return &LeaderboardWorker{
		leaderboardUC: leaderboardUC,
		logger:        logger,
		interval:      10 * time.Minute, // Recalculate every 10 minutes
		stopCh:        make(chan struct{}),
	}
}

// Start begins the periodic leaderboard recalculation
func (w *LeaderboardWorker) Start() {
	w.logger.Info("Starting leaderboard recalculation worker")

	// Run immediately on startup
	go w.recalculateLeaderboard()

	// Then run periodically
	ticker := time.NewTicker(w.interval)
	go func() {
		for {
			select {
			case <-ticker.C:
				go w.recalculateLeaderboard()
			case <-w.stopCh:
				ticker.Stop()
				return
			}
		}
	}()
}

// Stop halts the periodic leaderboard recalculation
func (w *LeaderboardWorker) Stop() {
	w.logger.Info("Stopping leaderboard recalculation worker")
	close(w.stopCh)
}

// recalculateLeaderboard triggers the leaderboard recalculation
func (w *LeaderboardWorker) recalculateLeaderboard() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	w.logger.Info("Recalculating leaderboard rankings")

	if err := w.leaderboardUC.RecalculateRankings(ctx); err != nil {
		w.logger.Errorf("Error recalculating leaderboard rankings: %v", err)
		return
	}

	w.logger.Info("Leaderboard rankings recalculated successfully")
}

package leaderboard

import "github.com/labstack/echo/v4"

// Handlers interface for leaderboard HTTP handlers
type Handlers interface {
	// Get leaderboard with optional filtering
	GetLeaderboard() echo.HandlerFunc

	// Get a specific user's rank
	GetUserRank() echo.HandlerFunc

	// Get top performers for a specific metric
	GetTopPerformers() echo.HandlerFunc

	// Admin endpoints
	RecalculateRankings() echo.HandlerFunc
}

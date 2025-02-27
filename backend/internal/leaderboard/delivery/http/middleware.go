package http

import (
	"context"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/AleksK1NG/api-mc/internal/leaderboard"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

// LeaderboardTrackingMiddleware creates a middleware that updates the leaderboard
// whenever user progress is updated
func LeaderboardTrackingMiddleware(leaderboardUC leaderboard.UseCase, logger logger.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Execute the handler first
			err := next(c)
			if err != nil {
				return err
			}

			// Only process for successful responses
			if c.Response().Status >= 200 && c.Response().Status < 300 {
				// Get user ID from context
				userID, err := getUserIDFromContext(c)
				if err != nil {
					// Just log the error and continue, don't fail the request
					logger.Warnf("Failed to get user ID from context for leaderboard tracking: %v", err)
					return nil
				}

				// Check if this is a progress-related endpoint
				path := c.Request().URL.Path
				method := c.Request().Method

				// Determine if this is a progress-related endpoint
				isProgressEndpoint := isProgressRelatedEndpoint(path, method)

				if isProgressEndpoint {
					// Update the leaderboard asynchronously
					go updateLeaderboard(c.Request().Context(), leaderboardUC, userID, logger)
				}
			}

			return nil
		}
	}
}

// getUserIDFromContext extracts the user ID from the context
func getUserIDFromContext(c echo.Context) (uuid.UUID, error) {
	// Try to get user from context
	user, ok := c.Get("user").(map[string]interface{})
	if !ok {
		return uuid.Nil, echo.NewHTTPError(http.StatusUnauthorized, "unauthorized")
	}

	// Extract user ID
	userIDStr, ok := user["user_id"].(string)
	if !ok {
		return uuid.Nil, echo.NewHTTPError(http.StatusUnauthorized, "user_id not found")
	}

	// Parse user ID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return uuid.Nil, echo.NewHTTPError(http.StatusUnauthorized, "invalid user_id")
	}

	return userID, nil
}

// isProgressRelatedEndpoint determines if the endpoint is related to user progress
func isProgressRelatedEndpoint(path string, method string) bool {
	// Progress update endpoints
	progressEndpoints := []string{
		"/auth/profile/", // Profile updates
		"/lessons/",      // Lesson completion
		"/quizzes/",      // Quiz completion
		"/chapters/",     // Chapter progress
	}

	// Only consider POST, PUT, PATCH methods as they modify data
	if method != http.MethodPost && method != http.MethodPut && method != http.MethodPatch {
		return false
	}

	// Check if the path contains any of the progress endpoints
	for _, endpoint := range progressEndpoints {
		if contains(path, endpoint) {
			return true
		}
	}

	return false
}

// contains checks if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && s[:len(substr)] == substr
}

// updateLeaderboard updates the leaderboard for a user
func updateLeaderboard(ctx context.Context, leaderboardUC leaderboard.UseCase, userID uuid.UUID, logger logger.Logger) {
	// Create a new context with timeout to avoid blocking indefinitely
	newCtx, cancel := context.WithTimeout(context.Background(), leaderboardUC.GetContextTimeout())
	defer cancel()

	// Sync user stats to update the leaderboard
	if err := leaderboardUC.SyncUserStats(newCtx, userID); err != nil {
		logger.Errorf("Failed to sync user stats for leaderboard: %v", err)
	} else {
		logger.Infof("Successfully updated leaderboard for user %s", userID.String())
	}
}

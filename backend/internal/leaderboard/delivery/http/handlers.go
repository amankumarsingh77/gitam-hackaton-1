package http

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/AleksK1NG/api-mc/internal/leaderboard"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/httpErrors"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

// LeaderboardHandlers implements the leaderboard.Handlers interface
type LeaderboardHandlers struct {
	leaderboardUC leaderboard.UseCase
	logger        logger.Logger
}

// NewLeaderboardHandlers creates a new leaderboard HTTP handlers
func NewLeaderboardHandlers(leaderboardUC leaderboard.UseCase, logger logger.Logger) leaderboard.Handlers {
	return &LeaderboardHandlers{
		leaderboardUC: leaderboardUC,
		logger:        logger,
	}
}

// getUserIDFromToken extracts the user ID from the JWT token
func getUserIDFromToken(c echo.Context) (uuid.UUID, bool) {
	user, ok := c.Get("user").(*models.User)
	if !ok || user == nil {
		return uuid.Nil, false
	}
	return user.UserID, true
}

// GetLeaderboard godoc
// @Summary Get leaderboard entries
// @Description Get leaderboard entries with optional filtering
// @Tags Leaderboard
// @Accept json
// @Produce json
// @Param time_frame query string false "Time frame (daily, weekly, monthly, all-time)"
// @Param subject query string false "Filter by subject"
// @Param grade query int false "Filter by grade"
// @Param limit query int false "Number of entries to return (default: 10)"
// @Success 200 {object} models.LeaderboardResponse
// @Failure 400 {object} httpErrors.RestErr
// @Failure 500 {object} httpErrors.RestErr
// @Router /leaderboard [get]
func (h *LeaderboardHandlers) GetLeaderboard() echo.HandlerFunc {
	return func(c echo.Context) error {
		// Parse query parameters
		filter := &models.LeaderboardFilter{
			TimeFrame: c.QueryParam("time_frame"),
			Subject:   c.QueryParam("subject"),
		}

		// Parse grade if provided
		if gradeStr := c.QueryParam("grade"); gradeStr != "" {
			grade, err := strconv.Atoi(gradeStr)
			if err != nil {
				return c.JSON(http.StatusBadRequest, httpErrors.NewBadRequestError("Invalid grade parameter"))
			}
			filter.Grade = grade
		}

		// Parse limit if provided
		if limitStr := c.QueryParam("limit"); limitStr != "" {
			limit, err := strconv.Atoi(limitStr)
			if err != nil {
				return c.JSON(http.StatusBadRequest, httpErrors.NewBadRequestError("Invalid limit parameter"))
			}
			filter.Limit = limit
		}

		// Get user ID from token if available (for getting user's rank)
		userID, ok := getUserIDFromToken(c)
		if ok {
			filter.UserID = userID
		}

		// Get leaderboard
		leaderboard, err := h.leaderboardUC.GetLeaderboard(c.Request().Context(), filter)
		if err != nil {
			h.logger.Errorf("Error getting leaderboard: %v", err)
			return c.JSON(http.StatusInternalServerError, httpErrors.NewInternalServerError("Error getting leaderboard"))
		}

		return c.JSON(http.StatusOK, leaderboard)
	}
}

// GetUserRank godoc
// @Summary Get a user's rank
// @Description Get a specific user's rank and stats
// @Tags Leaderboard
// @Accept json
// @Produce json
// @Param user_id path string true "User ID"
// @Success 200 {object} models.LeaderboardEntry
// @Failure 400 {object} httpErrors.RestErr
// @Failure 404 {object} httpErrors.RestErr
// @Failure 500 {object} httpErrors.RestErr
// @Router /leaderboard/users/{user_id} [get]
func (h *LeaderboardHandlers) GetUserRank() echo.HandlerFunc {
	return func(c echo.Context) error {
		// Parse user ID from path
		userIDParam := c.Param("user_id")
		if userIDParam == "me" {
			// Get current user's ID from token
			userID, ok := getUserIDFromToken(c)
			if !ok {
				return c.JSON(http.StatusUnauthorized, httpErrors.NewUnauthorizedError("Unauthorized"))
			}
			userIDParam = userID.String()
		}

		userID, err := uuid.Parse(userIDParam)
		if err != nil {
			return c.JSON(http.StatusBadRequest, httpErrors.NewBadRequestError("Invalid user ID"))
		}

		// Get user rank
		userRank, err := h.leaderboardUC.GetUserRank(c.Request().Context(), userID)
		if err != nil {
			h.logger.Errorf("Error getting user rank: %v", err)
			return c.JSON(http.StatusNotFound, httpErrors.NewNotFoundError("User not found in leaderboard"))
		}

		return c.JSON(http.StatusOK, userRank)
	}
}

// GetTopPerformers godoc
// @Summary Get top performers
// @Description Get top performers for a specific metric
// @Tags Leaderboard
// @Accept json
// @Produce json
// @Param metric query string true "Metric (xp, streak, level)"
// @Param limit query int false "Number of entries to return (default: 10)"
// @Success 200 {array} models.LeaderboardEntry
// @Failure 400 {object} httpErrors.RestErr
// @Failure 500 {object} httpErrors.RestErr
// @Router /leaderboard/top [get]
func (h *LeaderboardHandlers) GetTopPerformers() echo.HandlerFunc {
	return func(c echo.Context) error {
		// Parse metric
		metric := c.QueryParam("metric")
		if metric == "" {
			return c.JSON(http.StatusBadRequest, httpErrors.NewBadRequestError("Metric parameter is required"))
		}

		// Validate metric
		validMetrics := map[string]bool{"xp": true, "streak": true, "level": true}
		if !validMetrics[metric] {
			return c.JSON(http.StatusBadRequest, httpErrors.NewBadRequestError("Invalid metric parameter"))
		}

		// Parse limit if provided
		limit := 10
		if limitStr := c.QueryParam("limit"); limitStr != "" {
			var err error
			limit, err = strconv.Atoi(limitStr)
			if err != nil {
				return c.JSON(http.StatusBadRequest, httpErrors.NewBadRequestError("Invalid limit parameter"))
			}
		}

		// Get top performers
		topPerformers, err := h.leaderboardUC.GetTopPerformers(c.Request().Context(), metric, limit)
		if err != nil {
			h.logger.Errorf("Error getting top performers: %v", err)
			return c.JSON(http.StatusInternalServerError, httpErrors.NewInternalServerError("Error getting top performers"))
		}

		return c.JSON(http.StatusOK, topPerformers)
	}
}

// RecalculateRankings godoc
// @Summary Recalculate rankings
// @Description Recalculate all rankings (public endpoint)
// @Tags Leaderboard
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} httpErrors.RestErr
// @Router /leaderboard/recalculate [post]
func (h *LeaderboardHandlers) RecalculateRankings() echo.HandlerFunc {
	return func(c echo.Context) error {
		// Recalculate rankings
		if err := h.leaderboardUC.RecalculateRankings(c.Request().Context()); err != nil {
			h.logger.Errorf("Error recalculating rankings: %v", err)
			return c.JSON(http.StatusInternalServerError, httpErrors.NewInternalServerError("Error recalculating rankings"))
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Rankings recalculated successfully",
		})
	}
}

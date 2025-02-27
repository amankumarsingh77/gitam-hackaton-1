package http

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/pkg/errors"

	"github.com/AleksK1NG/api-mc/internal/achievement"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/httpErrors"
	"github.com/AleksK1NG/api-mc/pkg/logger"
	"github.com/AleksK1NG/api-mc/pkg/utils"
)

// Achievement handlers
type achievementHandlers struct {
	achievementUC achievement.UseCase
	logger        logger.Logger
}

// Achievement handlers constructor
func NewAchievementHandlers(achievementUC achievement.UseCase, logger logger.Logger) achievement.Handlers {
	return &achievementHandlers{
		achievementUC: achievementUC,
		logger:        logger,
	}
}

// Create achievement handler
func (h *achievementHandlers) CreateAchievement() echo.HandlerFunc {
	return func(c echo.Context) error {
		achievement := &models.Achievement{}
		if err := c.Bind(achievement); err != nil {
			return httpErrors.NewBadRequestError(errors.Wrap(err, "achievementHandlers.CreateAchievement.Bind"))
		}

		if err := utils.ValidateStruct(c.Request().Context(), achievement); err != nil {
			return httpErrors.NewBadRequestError(errors.Wrap(err, "achievementHandlers.CreateAchievement.ValidateStruct"))
		}

		createdAchievement, err := h.achievementUC.CreateAchievement(c.Request().Context(), achievement)
		if err != nil {
			return httpErrors.NewInternalServerError(errors.Wrap(err, "achievementHandlers.CreateAchievement.CreateAchievement"))
		}

		return c.JSON(http.StatusCreated, createdAchievement)
	}
}

// Get achievement by id handler
func (h *achievementHandlers) GetAchievementByID() echo.HandlerFunc {
	return func(c echo.Context) error {
		idParam := c.Param("id")
		achievementID, err := uuid.Parse(idParam)
		if err != nil {
			return httpErrors.NewBadRequestError(errors.Wrap(err, "achievementHandlers.GetAchievementByID.Parse"))
		}

		achievement, err := h.achievementUC.GetAchievementByID(c.Request().Context(), achievementID)
		if err != nil {
			return httpErrors.NewInternalServerError(errors.Wrap(err, "achievementHandlers.GetAchievementByID.GetAchievementByID"))
		}

		return c.JSON(http.StatusOK, achievement)
	}
}

// Get all achievements handler
func (h *achievementHandlers) GetAllAchievements() echo.HandlerFunc {
	return func(c echo.Context) error {
		achievements, err := h.achievementUC.GetAllAchievements(c.Request().Context())
		if err != nil {
			return httpErrors.NewInternalServerError(errors.Wrap(err, "achievementHandlers.GetAllAchievements.GetAllAchievements"))
		}

		return c.JSON(http.StatusOK, achievements)
	}
}

// Update achievement handler
func (h *achievementHandlers) UpdateAchievement() echo.HandlerFunc {
	return func(c echo.Context) error {
		idParam := c.Param("id")
		achievementID, err := uuid.Parse(idParam)
		if err != nil {
			return httpErrors.NewBadRequestError(errors.Wrap(err, "achievementHandlers.UpdateAchievement.Parse"))
		}

		achievement := &models.Achievement{}
		if err := c.Bind(achievement); err != nil {
			return httpErrors.NewBadRequestError(errors.Wrap(err, "achievementHandlers.UpdateAchievement.Bind"))
		}

		if err := utils.ValidateStruct(c.Request().Context(), achievement); err != nil {
			return httpErrors.NewBadRequestError(errors.Wrap(err, "achievementHandlers.UpdateAchievement.ValidateStruct"))
		}

		achievement.AchievementID = achievementID
		updatedAchievement, err := h.achievementUC.UpdateAchievement(c.Request().Context(), achievement)
		if err != nil {
			return httpErrors.NewInternalServerError(errors.Wrap(err, "achievementHandlers.UpdateAchievement.UpdateAchievement"))
		}

		return c.JSON(http.StatusOK, updatedAchievement)
	}
}

// Delete achievement handler
func (h *achievementHandlers) DeleteAchievement() echo.HandlerFunc {
	return func(c echo.Context) error {
		idParam := c.Param("id")
		achievementID, err := uuid.Parse(idParam)
		if err != nil {
			return httpErrors.NewBadRequestError(errors.Wrap(err, "achievementHandlers.DeleteAchievement.Parse"))
		}

		if err := h.achievementUC.DeleteAchievement(c.Request().Context(), achievementID); err != nil {
			return httpErrors.NewInternalServerError(errors.Wrap(err, "achievementHandlers.DeleteAchievement.DeleteAchievement"))
		}

		return c.NoContent(http.StatusNoContent)
	}
}

// Get user achievements handler
func (h *achievementHandlers) GetUserAchievements() echo.HandlerFunc {
	return func(c echo.Context) error {
		userID, err := utils.GetUserIDFromContext(c)
		if err != nil {
			return httpErrors.NewUnauthorizedError(errors.Wrap(err, "achievementHandlers.GetUserAchievements.GetUserIDFromContext"))
		}

		// Automatically check for new achievements when user views their achievements
		go func() {
			if err := h.achievementUC.CheckAndAwardAchievements(c.Request().Context(), userID); err != nil {
				h.logger.Errorf("Error checking and awarding achievements: %v", err)
			}
		}()

		achievements, err := h.achievementUC.GetUserAchievements(c.Request().Context(), userID)
		if err != nil {
			return httpErrors.NewInternalServerError(errors.Wrap(err, "achievementHandlers.GetUserAchievements.GetUserAchievements"))
		}

		return c.JSON(http.StatusOK, achievements)
	}
}

// Award achievement to user handler
func (h *achievementHandlers) AwardAchievementToUser() echo.HandlerFunc {
	return func(c echo.Context) error {
		// This endpoint would typically be used by admins or internal services
		// to manually award achievements to users

		type AwardRequest struct {
			UserID        uuid.UUID `json:"user_id" validate:"required"`
			AchievementID uuid.UUID `json:"achievement_id" validate:"required"`
		}

		req := &AwardRequest{}
		if err := c.Bind(req); err != nil {
			return httpErrors.NewBadRequestError(errors.Wrap(err, "achievementHandlers.AwardAchievementToUser.Bind"))
		}

		if err := utils.ValidateStruct(c.Request().Context(), req); err != nil {
			return httpErrors.NewBadRequestError(errors.Wrap(err, "achievementHandlers.AwardAchievementToUser.ValidateStruct"))
		}

		if err := h.achievementUC.AwardAchievementToUser(c.Request().Context(), req.UserID, req.AchievementID); err != nil {
			return httpErrors.NewInternalServerError(errors.Wrap(err, "achievementHandlers.AwardAchievementToUser.AwardAchievementToUser"))
		}

		return c.NoContent(http.StatusOK)
	}
}

// CheckUserAchievements is a middleware that can be used to check for achievements
// after certain user actions like completing a lesson or quiz
func CheckUserAchievements(achievementUC achievement.UseCase, logger logger.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Process the request first
			if err := next(c); err != nil {
				return err
			}

			// After the request is processed, check for achievements asynchronously
			userID, err := utils.GetUserIDFromContext(c)
			if err != nil {
				logger.Errorf("Error getting user ID from context: %v", err)
				return nil // Don't fail the request if we can't check achievements
			}

			go func() {
				if err := achievementUC.CheckAndAwardAchievements(c.Request().Context(), userID); err != nil {
					logger.Errorf("Error checking and awarding achievements: %v", err)
				}
			}()

			return nil
		}
	}
}

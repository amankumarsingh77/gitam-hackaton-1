package utils

import (
	"context"

	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/httpErrors"
	"github.com/AleksK1NG/api-mc/pkg/logger"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// Validate is user from owner of content
func ValidateIsOwner(ctx context.Context, creatorID string, logger logger.Logger) error {
	user, err := GetUserFromCtx(ctx)
	if err != nil {
		return err
	}

	if user.UserID.String() != creatorID {
		logger.Errorf(
			"ValidateIsOwner, userID: %v, creatorID: %v",
			user.UserID.String(),
			creatorID,
		)
		return httpErrors.Forbidden
	}

	return nil
}

// Get user ID from Echo context
func GetUserIDFromContext(c echo.Context) (uuid.UUID, error) {
	user, ok := c.Get("user").(*models.User)
	if !ok {
		return uuid.Nil, httpErrors.Unauthorized
	}
	return user.UserID, nil
}

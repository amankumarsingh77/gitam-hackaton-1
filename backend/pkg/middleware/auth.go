package middleware

import (
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/httpErrors"
)

// GetUserIDFromContext extracts the user ID from the Echo context
func GetUserIDFromContext(c echo.Context) (uuid.UUID, error) {
	user, ok := c.Get("user").(*models.User)
	if !ok {
		return uuid.Nil, httpErrors.Unauthorized
	}
	return user.UserID, nil
}

// GetUserFromContext extracts the user from the Echo context
func GetUserFromContext(c echo.Context) (*models.User, error) {
	user, ok := c.Get("user").(*models.User)
	if !ok {
		return nil, httpErrors.Unauthorized
	}
	return user, nil
}

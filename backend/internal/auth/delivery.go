package auth

import (
	"github.com/labstack/echo/v4"
)

// Auth HTTP Handlers interface
type Handlers interface {
	// Auth routes
	Register() echo.HandlerFunc
	Login() echo.HandlerFunc

	// User routes
	UpdateProfile() echo.HandlerFunc
	GetProfile() echo.HandlerFunc

	// Progress routes
	GetProgress() echo.HandlerFunc
	GetDailyStreak() echo.HandlerFunc
}

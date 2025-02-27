package achievement

import "github.com/labstack/echo/v4"

// Achievement HTTP Handlers interface
type Handlers interface {
	// Achievement Management (Admin)
	CreateAchievement() echo.HandlerFunc
	GetAchievementByID() echo.HandlerFunc
	GetAllAchievements() echo.HandlerFunc
	UpdateAchievement() echo.HandlerFunc
	DeleteAchievement() echo.HandlerFunc

	// User Achievement Management
	GetUserAchievements() echo.HandlerFunc
	AwardAchievementToUser() echo.HandlerFunc
}

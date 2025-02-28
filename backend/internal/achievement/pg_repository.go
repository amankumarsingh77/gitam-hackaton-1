package achievement

import (
	"context"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/internal/models"
)

// Achievement Repository interface
type Repository interface {
	// Achievement Management
	CreateAchievement(ctx context.Context, achievement *models.Achievement) (*models.Achievement, error)
	GetAchievementByID(ctx context.Context, achievementID uuid.UUID) (*models.Achievement, error)
	GetAllAchievements(ctx context.Context) ([]*models.Achievement, error)
	UpdateAchievement(ctx context.Context, achievement *models.Achievement) (*models.Achievement, error)
	DeleteAchievement(ctx context.Context, achievementID uuid.UUID) error

	// User Achievement Management
	GetUserAchievements(ctx context.Context, userID uuid.UUID) ([]*models.Achievement, error)
	AwardAchievementToUser(ctx context.Context, userAchievement *models.UserAchievement) error
	CheckUserHasAchievement(ctx context.Context, userID uuid.UUID, achievementID uuid.UUID) (bool, error)
}

//go:generate mockgen -source usecase.go -destination mock/usecase_mock.go -package mock
package auth

import (
	"context"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/internal/models"
)

// Auth usecase interface
type UseCase interface {
	// User Authentication
	Register(ctx context.Context, user *models.User) (*models.UserWithToken, error)
	Login(ctx context.Context, user *models.User) (*models.UserWithToken, error)

	// User Management
	Update(ctx context.Context, user *models.User) (*models.User, error)
	UpdateAvatar(ctx context.Context, userID uuid.UUID, avatarURL string) (*models.User, error)
	GetByID(ctx context.Context, userID uuid.UUID) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)

	// User Progress
	GetUserProgress(ctx context.Context, userID uuid.UUID, subject string, grade int) (*models.UserProgress, error)
	UpdateUserProgress(ctx context.Context, progress *models.UserProgress) error

	// Daily Streak
	GetDailyStreak(ctx context.Context, userID uuid.UUID) (*models.DailyStreak, error)
	UpdateDailyStreak(ctx context.Context, streak *models.DailyStreak) error
}

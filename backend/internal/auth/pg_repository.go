//go:generate mockgen -source pg_repository.go -destination mock/pg_repository_mock.go -package mock
package auth

import (
	"context"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/internal/models"
)

// Auth repository interface
type Repository interface {
	// User Management
	Register(ctx context.Context, user *models.User) (*models.User, error)
	Update(ctx context.Context, user *models.User) (*models.User, error)
	GetByID(ctx context.Context, userID uuid.UUID) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	UpdateAvatar(ctx context.Context, userID uuid.UUID, avatarURL string) (*models.User, error)

	// User Progress
	CreateUserProgress(ctx context.Context, progress *models.UserProgress) error
	GetUserProgress(ctx context.Context, userID uuid.UUID, subject string, grade int) (*models.UserProgress, error)
	UpdateUserProgress(ctx context.Context, progress *models.UserProgress) error

	// Daily Streak
	CreateDailyStreak(ctx context.Context, streak *models.DailyStreak) error
	GetDailyStreak(ctx context.Context, userID uuid.UUID) (*models.DailyStreak, error)
	UpdateDailyStreak(ctx context.Context, streak *models.DailyStreak) error
}

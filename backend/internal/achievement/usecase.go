package achievement

import (
	"context"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/internal/models"
)

// Achievement UseCase interface
type UseCase interface {
	// Achievement Management
	CreateAchievement(ctx context.Context, achievement *models.Achievement) (*models.Achievement, error)
	GetAchievementByID(ctx context.Context, achievementID uuid.UUID) (*models.Achievement, error)
	GetAllAchievements(ctx context.Context) ([]*models.Achievement, error)
	UpdateAchievement(ctx context.Context, achievement *models.Achievement) (*models.Achievement, error)
	DeleteAchievement(ctx context.Context, achievementID uuid.UUID) error

	// User Achievement Management
	GetUserAchievements(ctx context.Context, userID uuid.UUID) ([]*models.Achievement, error)
	AwardAchievementToUser(ctx context.Context, userID uuid.UUID, achievementID uuid.UUID) error
	CheckAndAwardAchievements(ctx context.Context, userID uuid.UUID) error
}

// UserProgressRepository provides access to user progress data
type UserProgressRepository interface {
	GetUserStreak(ctx context.Context, userID uuid.UUID) (int, error)
	GetUserSubjectProgress(ctx context.Context, userID uuid.UUID) ([]*models.UserProgress, error)
	GetUserXP(ctx context.Context, userID uuid.UUID) (int, error)
}

// LessonProgressRepository provides access to lesson progress data
type LessonProgressRepository interface {
	GetUserCompletedLessonsCount(ctx context.Context, userID uuid.UUID) (int, error)
}

// UserQuizAttemptsRepository provides access to quiz attempt data
type UserQuizAttemptsRepository interface {
	GetUserHighestQuizScore(ctx context.Context, userID uuid.UUID) (int, error)
	GetUserQuizAttemptsCount(ctx context.Context, userID uuid.UUID) (int, error)
}

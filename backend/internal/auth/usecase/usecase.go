package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/AleksK1NG/api-mc/config"
	"github.com/AleksK1NG/api-mc/internal/auth"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
	"github.com/AleksK1NG/api-mc/pkg/utils"
)

const (
	basePrefix          = "api-auth:"
	cacheDuration       = 3600
	tokenExpirationTime = 24 * time.Hour
)

// Auth UseCase
type authUC struct {
	cfg       *config.Config
	authRepo  auth.Repository
	redisRepo auth.RedisRepository
	logger    logger.Logger
}

// Auth UseCase constructor
func NewAuthUseCase(cfg *config.Config, authRepo auth.Repository, redisRepo auth.RedisRepository, logger logger.Logger) auth.UseCase {
	return &authUC{
		cfg:       cfg,
		authRepo:  authRepo,
		redisRepo: redisRepo,
		logger:    logger,
	}
}

// Register new user
func (u *authUC) Register(ctx context.Context, user *models.User) (*models.UserWithToken, error) {
	// Check if user exists
	existingUser, err := u.authRepo.GetByEmail(ctx, user.Email)
	if err == nil && existingUser != nil {
		return nil, fmt.Errorf("user with email %s already exists", user.Email)
	}

	if err := user.PrepareCreate(); err != nil {
		return nil, err
	}

	createdUser, err := u.authRepo.Register(ctx, user)
	if err != nil {
		return nil, err
	}

	// Create initial user progress for the user's grade
	progress := &models.UserProgress{
		UserID:       createdUser.UserID,
		Subject:      "general",
		Grade:        createdUser.Grade,
		ChaptersRead: 0,
		QuizzesTaken: 0,
		AvgScore:     0,
	}
	if err := u.authRepo.CreateUserProgress(ctx, progress); err != nil {
		return nil, err
	}

	// Initialize daily streak
	streak := &models.DailyStreak{
		UserID:        createdUser.UserID,
		CurrentStreak: 0,
		MaxStreak:     0,
		LastActivity:  time.Now(),
	}
	if err := u.authRepo.CreateDailyStreak(ctx, streak); err != nil {
		return nil, err
	}

	// Generate JWT token
	token, err := utils.GenerateJWTToken(createdUser, u.cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %v", err)
	}

	return &models.UserWithToken{
		User:  createdUser,
		Token: token,
	}, nil
}

// Login user
func (u *authUC) Login(ctx context.Context, user *models.User) (*models.UserWithToken, error) {
	foundUser, err := u.authRepo.GetByEmail(ctx, user.Email)
	if err != nil {
		return nil, err
	}

	if err := foundUser.ComparePasswords(user.Password); err != nil {
		return nil, fmt.Errorf("invalid password")
	}

	foundUser.LastActive = time.Now()
	updatedUser, err := u.authRepo.Update(ctx, foundUser)
	if err != nil {
		return nil, err
	}

	// Generate JWT token
	token, err := utils.GenerateJWTToken(updatedUser, u.cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %v", err)
	}

	return &models.UserWithToken{
		User:  updatedUser,
		Token: token,
	}, nil
}

// Update user profile
func (u *authUC) Update(ctx context.Context, user *models.User) (*models.User, error) {
	if err := user.PrepareUpdate(); err != nil {
		return nil, err
	}
	return u.authRepo.Update(ctx, user)
}

// Update user avatar
func (u *authUC) UpdateAvatar(ctx context.Context, userID uuid.UUID, avatarURL string) (*models.User, error) {
	return u.authRepo.UpdateAvatar(ctx, userID, avatarURL)
}

// Get user by id
func (u *authUC) GetByID(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	// Try to get from Redis first
	cachedUser, err := u.redisRepo.GetByIDCtx(ctx, userID.String())
	if err == nil && cachedUser != nil {
		return cachedUser, nil
	}

	// Get from database
	user, err := u.authRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Cache in Redis
	if err := u.redisRepo.SetUserCtx(ctx, userID.String(), int(tokenExpirationTime.Seconds()), user); err != nil {
		u.logger.Errorf("Failed to cache user: %v", err)
	}

	return user, nil
}

// Get user by email
func (u *authUC) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	return u.authRepo.GetByEmail(ctx, email)
}

// Get user progress
func (u *authUC) GetUserProgress(ctx context.Context, userID uuid.UUID, subject string, grade int) (*models.UserProgress, error) {
	return u.authRepo.GetUserProgress(ctx, userID, subject, grade)
}

// Update user progress
func (u *authUC) UpdateUserProgress(ctx context.Context, progress *models.UserProgress) error {
	return u.authRepo.UpdateUserProgress(ctx, progress)
}

// Get daily streak
func (u *authUC) GetDailyStreak(ctx context.Context, userID uuid.UUID) (*models.DailyStreak, error) {
	return u.authRepo.GetDailyStreak(ctx, userID)
}

// Update daily streak
func (u *authUC) UpdateDailyStreak(ctx context.Context, streak *models.DailyStreak) error {
	if streak.CurrentStreak > streak.MaxStreak {
		streak.MaxStreak = streak.CurrentStreak
	}
	return u.authRepo.UpdateDailyStreak(ctx, streak)
}

func (u *authUC) GenerateUserKey(userID string) string {
	return fmt.Sprintf("%s: %s", basePrefix, userID)
}

package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/pkg/errors"

	"github.com/AleksK1NG/api-mc/internal/achievement"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

// Achievement UseCase
type achievementUC struct {
	achievementRepo achievement.Repository
	logger          logger.Logger
	// Additional repositories needed for checking user progress
	userProgressRepo     achievement.UserProgressRepository
	lessonProgressRepo   achievement.LessonProgressRepository
	userQuizAttemptsRepo achievement.UserQuizAttemptsRepository
}

// Achievement UseCase constructor
func NewAchievementUseCase(
	achievementRepo achievement.Repository,
	userProgressRepo achievement.UserProgressRepository,
	lessonProgressRepo achievement.LessonProgressRepository,
	userQuizAttemptsRepo achievement.UserQuizAttemptsRepository,
	logger logger.Logger,
) achievement.UseCase {
	return &achievementUC{
		achievementRepo:      achievementRepo,
		userProgressRepo:     userProgressRepo,
		lessonProgressRepo:   lessonProgressRepo,
		userQuizAttemptsRepo: userQuizAttemptsRepo,
		logger:               logger,
	}
}

// Create new achievement
func (u *achievementUC) CreateAchievement(ctx context.Context, achievement *models.Achievement) (*models.Achievement, error) {
	return u.achievementRepo.CreateAchievement(ctx, achievement)
}

// Get achievement by id
func (u *achievementUC) GetAchievementByID(ctx context.Context, achievementID uuid.UUID) (*models.Achievement, error) {
	return u.achievementRepo.GetAchievementByID(ctx, achievementID)
}

// Get all achievements
func (u *achievementUC) GetAllAchievements(ctx context.Context) ([]*models.Achievement, error) {
	return u.achievementRepo.GetAllAchievements(ctx)
}

// Update achievement
func (u *achievementUC) UpdateAchievement(ctx context.Context, achievement *models.Achievement) (*models.Achievement, error) {
	return u.achievementRepo.UpdateAchievement(ctx, achievement)
}

// Delete achievement
func (u *achievementUC) DeleteAchievement(ctx context.Context, achievementID uuid.UUID) error {
	return u.achievementRepo.DeleteAchievement(ctx, achievementID)
}

// Get user achievements
func (u *achievementUC) GetUserAchievements(ctx context.Context, userID uuid.UUID) ([]*models.Achievement, error) {
	return u.achievementRepo.GetUserAchievements(ctx, userID)
}

// Award achievement to user
func (u *achievementUC) AwardAchievementToUser(ctx context.Context, userID uuid.UUID, achievementID uuid.UUID) error {
	// Check if user already has this achievement
	hasAchievement, err := u.achievementRepo.CheckUserHasAchievement(ctx, userID, achievementID)
	if err != nil {
		return errors.Wrap(err, "achievementUC.AwardAchievementToUser.CheckUserHasAchievement")
	}

	if hasAchievement {
		return errors.New("user already has this achievement")
	}

	userAchievement := &models.UserAchievement{
		UserID:        userID,
		AchievementID: achievementID,
		EarnedAt:      time.Now(),
		CreatedAt:     time.Now(),
	}

	return u.achievementRepo.AwardAchievementToUser(ctx, userAchievement)
}

// Check and award achievements based on user activity
func (u *achievementUC) CheckAndAwardAchievements(ctx context.Context, userID uuid.UUID) error {
	// Get all available achievements
	achievements, err := u.achievementRepo.GetAllAchievements(ctx)
	if err != nil {
		return errors.Wrap(err, "achievementUC.CheckAndAwardAchievements.GetAllAchievements")
	}

	// Check each achievement type and award if criteria are met
	for _, achievement := range achievements {
		// Skip if user already has this achievement
		hasAchievement, err := u.achievementRepo.CheckUserHasAchievement(ctx, userID, achievement.AchievementID)
		if err != nil {
			u.logger.Errorf("Error checking if user has achievement: %v", err)
			continue
		}
		if hasAchievement {
			continue
		}

		// Check achievement criteria based on type
		switch achievement.Type {
		case "streak":
			// Check user streak
			streak, err := u.userProgressRepo.GetUserStreak(ctx, userID)
			if err != nil {
				u.logger.Errorf("Error getting user streak: %v", err)
				continue
			}
			if streak >= achievement.RequiredValue {
				if err := u.AwardAchievementToUser(ctx, userID, achievement.AchievementID); err != nil {
					u.logger.Errorf("Error awarding streak achievement: %v", err)
				}
			}

		case "quiz_score":
			// Check quiz scores
			highScore, err := u.userQuizAttemptsRepo.GetUserHighestQuizScore(ctx, userID)
			if err != nil {
				u.logger.Errorf("Error getting user quiz scores: %v", err)
				continue
			}
			if highScore >= achievement.RequiredValue {
				if err := u.AwardAchievementToUser(ctx, userID, achievement.AchievementID); err != nil {
					u.logger.Errorf("Error awarding quiz score achievement: %v", err)
				}
			}

		case "subject_mastery":
			// Check subject progress
			subjectProgress, err := u.userProgressRepo.GetUserSubjectProgress(ctx, userID)
			if err != nil {
				u.logger.Errorf("Error getting user subject progress: %v", err)
				continue
			}

			// Check if any subject has reached the required mastery level
			for _, progress := range subjectProgress {
				if progress.ChaptersRead >= achievement.RequiredValue {
					if err := u.AwardAchievementToUser(ctx, userID, achievement.AchievementID); err != nil {
						u.logger.Errorf("Error awarding subject mastery achievement: %v", err)
					}
					break
				}
			}

		case "lessons_completed":
			// Check completed lessons count
			completedLessons, err := u.lessonProgressRepo.GetUserCompletedLessonsCount(ctx, userID)
			if err != nil {
				u.logger.Errorf("Error getting user completed lessons: %v", err)
				continue
			}
			if completedLessons >= achievement.RequiredValue {
				if err := u.AwardAchievementToUser(ctx, userID, achievement.AchievementID); err != nil {
					u.logger.Errorf("Error awarding lessons completed achievement: %v", err)
				}
			}

		case "quizzes_taken":
			// Check number of quizzes taken
			quizzesTaken, err := u.userQuizAttemptsRepo.GetUserQuizAttemptsCount(ctx, userID)
			if err != nil {
				u.logger.Errorf("Error getting user quiz attempts: %v", err)
				continue
			}
			if quizzesTaken >= achievement.RequiredValue {
				if err := u.AwardAchievementToUser(ctx, userID, achievement.AchievementID); err != nil {
					u.logger.Errorf("Error awarding quizzes taken achievement: %v", err)
				}
			}

		case "xp_earned":
			// Check user XP
			xp, err := u.userProgressRepo.GetUserXP(ctx, userID)
			if err != nil {
				u.logger.Errorf("Error getting user XP: %v", err)
				continue
			}
			if xp >= achievement.RequiredValue {
				if err := u.AwardAchievementToUser(ctx, userID, achievement.AchievementID); err != nil {
					u.logger.Errorf("Error awarding XP achievement: %v", err)
				}
			}

		case "custom":
			// Custom achievements would be handled separately
			// They might require more complex logic or manual awarding
			continue
		}
	}

	return nil
}

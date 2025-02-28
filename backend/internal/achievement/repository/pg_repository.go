package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"

	"github.com/AleksK1NG/api-mc/internal/achievement"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/logger"
)

type achievementRepo struct {
	db     *sqlx.DB
	logger logger.Logger
}

func NewAchievementRepository(db *sqlx.DB, logger logger.Logger) achievement.Repository {
	return &achievementRepo{
		db:     db,
		logger: logger,
	}
}

func (r *achievementRepo) CreateAchievement(ctx context.Context, achievement *models.Achievement) (*models.Achievement, error) {
	achievement.AchievementID = uuid.New()
	achievement.CreatedAt = time.Now()

	if err := r.db.QueryRowxContext(
		ctx,
		createAchievementQuery,
		achievement.AchievementID,
		achievement.Title,
		achievement.Description,
		achievement.Type,
		achievement.RequiredValue,
		achievement.IconURL,
		achievement.CreatedAt,
	).StructScan(achievement); err != nil {
		return nil, errors.Wrap(err, "achievementRepo.CreateAchievement.QueryRowxContext")
	}

	return achievement, nil
}

func (r *achievementRepo) GetAchievementByID(ctx context.Context, achievementID uuid.UUID) (*models.Achievement, error) {
	achievement := &models.Achievement{}
	if err := r.db.GetContext(ctx, achievement, getAchievementByIDQuery, achievementID); err != nil {
		return nil, errors.Wrap(err, "achievementRepo.GetAchievementByID.GetContext")
	}
	return achievement, nil
}

func (r *achievementRepo) GetAllAchievements(ctx context.Context) ([]*models.Achievement, error) {
	achievements := make([]*models.Achievement, 0)
	if err := r.db.SelectContext(ctx, &achievements, getAllAchievementsQuery); err != nil {
		return nil, errors.Wrap(err, "achievementRepo.GetAllAchievements.SelectContext")
	}
	return achievements, nil
}

func (r *achievementRepo) UpdateAchievement(ctx context.Context, achievement *models.Achievement) (*models.Achievement, error) {
	if err := r.db.GetContext(
		ctx,
		achievement,
		updateAchievementQuery,
		achievement.Title,
		achievement.Description,
		achievement.Type,
		achievement.RequiredValue,
		achievement.IconURL,
		achievement.AchievementID,
	); err != nil {
		return nil, errors.Wrap(err, "achievementRepo.UpdateAchievement.GetContext")
	}
	return achievement, nil
}

func (r *achievementRepo) DeleteAchievement(ctx context.Context, achievementID uuid.UUID) error {
	result, err := r.db.ExecContext(ctx, deleteAchievementQuery, achievementID)
	if err != nil {
		return errors.Wrap(err, "achievementRepo.DeleteAchievement.ExecContext")
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.Wrap(err, "achievementRepo.DeleteAchievement.RowsAffected")
	}
	if rowsAffected == 0 {
		return errors.New("achievement not found")
	}

	return nil
}

func (r *achievementRepo) GetUserAchievements(ctx context.Context, userID uuid.UUID) ([]*models.Achievement, error) {
	achievements := make([]*models.Achievement, 0)
	if err := r.db.SelectContext(ctx, &achievements, getUserAchievementsQuery, userID); err != nil {
		return nil, errors.Wrap(err, "achievementRepo.GetUserAchievements.SelectContext")
	}
	return achievements, nil
}

func (r *achievementRepo) AwardAchievementToUser(ctx context.Context, userAchievement *models.UserAchievement) error {
	userAchievement.UserAchievementID = uuid.New()
	userAchievement.EarnedAt = time.Now()
	userAchievement.CreatedAt = time.Now()

	_, err := r.db.ExecContext(
		ctx,
		awardAchievementToUserQuery,
		userAchievement.UserAchievementID,
		userAchievement.UserID,
		userAchievement.AchievementID,
		userAchievement.EarnedAt,
		userAchievement.CreatedAt,
	)
	if err != nil {
		return errors.Wrap(err, "achievementRepo.AwardAchievementToUser.ExecContext")
	}

	return nil
}

func (r *achievementRepo) CheckUserHasAchievement(ctx context.Context, userID uuid.UUID, achievementID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx, checkUserHasAchievementQuery, userID, achievementID).Scan(&exists)
	if err != nil && err != sql.ErrNoRows {
		return false, errors.Wrap(err, "achievementRepo.CheckUserHasAchievement.QueryRowContext")
	}
	return exists, nil
}

type userProgressRepo struct {
	db     *sqlx.DB
	logger logger.Logger
}

func NewUserProgressRepository(db *sqlx.DB, logger logger.Logger) achievement.UserProgressRepository {
	return &userProgressRepo{
		db:     db,
		logger: logger,
	}
}

func (r *userProgressRepo) GetUserStreak(ctx context.Context, userID uuid.UUID) (int, error) {
	var streak int
	err := r.db.QueryRowContext(ctx, getUserStreakQuery, userID).Scan(&streak)
	if err != nil && err != sql.ErrNoRows {
		return 0, errors.Wrap(err, "userProgressRepo.GetUserStreak.QueryRowContext")
	}
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return streak, nil
}

func (r *userProgressRepo) GetUserSubjectProgress(ctx context.Context, userID uuid.UUID) ([]*models.UserProgress, error) {
	progress := make([]*models.UserProgress, 0)
	if err := r.db.SelectContext(ctx, &progress, getUserSubjectProgressQuery, userID); err != nil {
		return nil, errors.Wrap(err, "userProgressRepo.GetUserSubjectProgress.SelectContext")
	}
	return progress, nil
}

func (r *userProgressRepo) GetUserXP(ctx context.Context, userID uuid.UUID) (int, error) {
	var xp int
	err := r.db.QueryRowContext(ctx, getUserXPQuery, userID).Scan(&xp)
	if err != nil && err != sql.ErrNoRows {
		return 0, errors.Wrap(err, "userProgressRepo.GetUserXP.QueryRowContext")
	}
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return xp, nil
}

type lessonProgressRepo struct {
	db     *sqlx.DB
	logger logger.Logger
}

func NewLessonProgressRepository(db *sqlx.DB, logger logger.Logger) achievement.LessonProgressRepository {
	return &lessonProgressRepo{
		db:     db,
		logger: logger,
	}
}

func (r *lessonProgressRepo) GetUserCompletedLessonsCount(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, getUserCompletedLessonsCountQuery, userID).Scan(&count)
	if err != nil && err != sql.ErrNoRows {
		return 0, errors.Wrap(err, "lessonProgressRepo.GetUserCompletedLessonsCount.QueryRowContext")
	}
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return count, nil
}

type userQuizAttemptsRepo struct {
	db     *sqlx.DB
	logger logger.Logger
}

func NewUserQuizAttemptsRepository(db *sqlx.DB, logger logger.Logger) achievement.UserQuizAttemptsRepository {
	return &userQuizAttemptsRepo{
		db:     db,
		logger: logger,
	}
}

func (r *userQuizAttemptsRepo) GetUserHighestQuizScore(ctx context.Context, userID uuid.UUID) (int, error) {
	var score int
	err := r.db.QueryRowContext(ctx, getUserHighestQuizScoreQuery, userID).Scan(&score)
	if err != nil && err != sql.ErrNoRows {
		return 0, errors.Wrap(err, "userQuizAttemptsRepo.GetUserHighestQuizScore.QueryRowContext")
	}
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return score, nil
}

func (r *userQuizAttemptsRepo) GetUserQuizAttemptsCount(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, getUserQuizAttemptsCountQuery, userID).Scan(&count)
	if err != nil && err != sql.ErrNoRows {
		return 0, errors.Wrap(err, "userQuizAttemptsRepo.GetUserQuizAttemptsCount.QueryRowContext")
	}
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return count, nil
}

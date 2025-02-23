package repository

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/opentracing/opentracing-go"
	"github.com/pkg/errors"

	"github.com/AleksK1NG/api-mc/internal/auth"
	"github.com/AleksK1NG/api-mc/internal/models"
	"github.com/AleksK1NG/api-mc/pkg/utils"
)

// Auth Repository
type authRepo struct {
	db *sqlx.DB
}

// Auth Repository constructor
func NewAuthRepository(db *sqlx.DB) auth.Repository {
	return &authRepo{db: db}
}

// Register new user
func (r *authRepo) Register(ctx context.Context, user *models.User) (*models.User, error) {
	u := &models.User{}
	if err := r.db.QueryRowxContext(
		ctx,
		createUserQuery,
		user.FirstName,
		user.LastName,
		user.Email,
		user.Password,
		user.Grade,
		user.Avatar,
		0, // Initial XP
		0, // Initial Streak
		user.LastActive,
	).StructScan(u); err != nil {
		return nil, err
	}
	return u, nil
}

// Update user
func (r *authRepo) Update(ctx context.Context, user *models.User) (*models.User, error) {
	u := &models.User{}
	if err := r.db.QueryRowxContext(
		ctx,
		updateUserQuery,
		user.FirstName,
		user.LastName,
		user.Email,
		user.Grade,
		user.UserID,
	).StructScan(u); err != nil {
		return nil, err
	}
	return u, nil
}

// Update user avatar
func (r *authRepo) UpdateAvatar(ctx context.Context, userID uuid.UUID, avatarURL string) (*models.User, error) {
	u := &models.User{}
	if err := r.db.QueryRowxContext(
		ctx,
		updateAvatarQuery,
		avatarURL,
		userID,
	).StructScan(u); err != nil {
		return nil, err
	}
	return u, nil
}

// Get user by id
func (r *authRepo) GetByID(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	u := &models.User{}
	if err := r.db.GetContext(ctx, u, getUserByIDQuery, userID); err != nil {
		return nil, err
	}
	return u, nil
}

// Get user by email
func (r *authRepo) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	u := &models.User{}
	if err := r.db.GetContext(ctx, u, getUserByEmailQuery, email); err != nil {
		return nil, err
	}
	return u, nil
}

// Create user progress
func (r *authRepo) CreateUserProgress(ctx context.Context, progress *models.UserProgress) error {
	_, err := r.db.ExecContext(
		ctx,
		createUserProgressQuery,
		progress.UserID,
		progress.Subject,
		progress.Grade,
		progress.ChaptersRead,
		progress.QuizzesTaken,
		progress.AvgScore,
	)
	return err
}

// Get user progress
func (r *authRepo) GetUserProgress(ctx context.Context, userID uuid.UUID, subject string, grade int) (*models.UserProgress, error) {
	progress := &models.UserProgress{}
	if err := r.db.GetContext(ctx, progress, getUserProgressQuery, userID, subject, grade); err != nil {
		return nil, err
	}
	return progress, nil
}

// Update user progress
func (r *authRepo) UpdateUserProgress(ctx context.Context, progress *models.UserProgress) error {
	_, err := r.db.ExecContext(
		ctx,
		updateUserProgressQuery,
		progress.ChaptersRead,
		progress.QuizzesTaken,
		progress.AvgScore,
		progress.ProgressID,
	)
	return err
}

// Create daily streak
func (r *authRepo) CreateDailyStreak(ctx context.Context, streak *models.DailyStreak) error {
	_, err := r.db.ExecContext(
		ctx,
		createDailyStreakQuery,
		streak.UserID,
		streak.CurrentStreak,
		streak.MaxStreak,
		streak.LastActivity,
	)
	return err
}

// Get daily streak
func (r *authRepo) GetDailyStreak(ctx context.Context, userID uuid.UUID) (*models.DailyStreak, error) {
	streak := &models.DailyStreak{}
	if err := r.db.GetContext(ctx, streak, getDailyStreakQuery, userID); err != nil {
		return nil, err
	}
	return streak, nil
}

// Update daily streak
func (r *authRepo) UpdateDailyStreak(ctx context.Context, streak *models.DailyStreak) error {
	_, err := r.db.ExecContext(
		ctx,
		updateDailyStreakQuery,
		streak.CurrentStreak,
		streak.MaxStreak,
		streak.LastActivity,
		streak.StreakID,
	)
	return err
}

// Delete existing user
func (r *authRepo) Delete(ctx context.Context, userID uuid.UUID) error {
	span, ctx := opentracing.StartSpanFromContext(ctx, "authRepo.Delete")
	defer span.Finish()

	result, err := r.db.ExecContext(ctx, deleteUserQuery, userID)
	if err != nil {
		return errors.WithMessage(err, "authRepo Delete ExecContext")
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return errors.Wrap(err, "authRepo.Delete.RowsAffected")
	}
	if rowsAffected == 0 {
		return errors.Wrap(sql.ErrNoRows, "authRepo.Delete.rowsAffected")
	}

	return nil
}

// Find users by name
func (r *authRepo) FindByName(ctx context.Context, name string, query *utils.PaginationQuery) (*models.UsersList, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "authRepo.FindByName")
	defer span.Finish()

	var totalCount int
	if err := r.db.GetContext(ctx, &totalCount, getTotalCount, name); err != nil {
		return nil, errors.Wrap(err, "authRepo.FindByName.GetContext.totalCount")
	}

	if totalCount == 0 {
		return &models.UsersList{
			TotalCount: totalCount,
			TotalPages: utils.GetTotalPages(totalCount, query.GetSize()),
			Page:       query.GetPage(),
			Size:       query.GetSize(),
			HasMore:    utils.GetHasMore(query.GetPage(), totalCount, query.GetSize()),
			Users:      make([]*models.User, 0),
		}, nil
	}

	rows, err := r.db.QueryxContext(ctx, findUsers, name, query.GetOffset(), query.GetLimit())
	if err != nil {
		return nil, errors.Wrap(err, "authRepo.FindByName.QueryxContext")
	}
	defer rows.Close()

	var users = make([]*models.User, 0, query.GetSize())
	for rows.Next() {
		var user models.User
		if err = rows.StructScan(&user); err != nil {
			return nil, errors.Wrap(err, "authRepo.FindByName.StructScan")
		}
		users = append(users, &user)
	}

	if err = rows.Err(); err != nil {
		return nil, errors.Wrap(err, "authRepo.FindByName.rows.Err")
	}

	return &models.UsersList{
		TotalCount: totalCount,
		TotalPages: utils.GetTotalPages(totalCount, query.GetSize()),
		Page:       query.GetPage(),
		Size:       query.GetSize(),
		HasMore:    utils.GetHasMore(query.GetPage(), totalCount, query.GetSize()),
		Users:      users,
	}, nil
}

// Get users with pagination
func (r *authRepo) GetUsers(ctx context.Context, pq *utils.PaginationQuery) (*models.UsersList, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "authRepo.GetUsers")
	defer span.Finish()

	var totalCount int
	if err := r.db.GetContext(ctx, &totalCount, getTotal); err != nil {
		return nil, errors.Wrap(err, "authRepo.GetUsers.GetContext.totalCount")
	}

	if totalCount == 0 {
		return &models.UsersList{
			TotalCount: totalCount,
			TotalPages: utils.GetTotalPages(totalCount, pq.GetSize()),
			Page:       pq.GetPage(),
			Size:       pq.GetSize(),
			HasMore:    utils.GetHasMore(pq.GetPage(), totalCount, pq.GetSize()),
			Users:      make([]*models.User, 0),
		}, nil
	}

	var users = make([]*models.User, 0, pq.GetSize())
	if err := r.db.SelectContext(
		ctx,
		&users,
		getUsers,
		pq.GetOrderBy(),
		pq.GetOffset(),
		pq.GetLimit(),
	); err != nil {
		return nil, errors.Wrap(err, "authRepo.GetUsers.SelectContext")
	}

	return &models.UsersList{
		TotalCount: totalCount,
		TotalPages: utils.GetTotalPages(totalCount, pq.GetSize()),
		Page:       pq.GetPage(),
		Size:       pq.GetSize(),
		HasMore:    utils.GetHasMore(pq.GetPage(), totalCount, pq.GetSize()),
		Users:      users,
	}, nil
}

// Find user by email
func (r *authRepo) FindByEmail(ctx context.Context, user *models.User) (*models.User, error) {
	span, ctx := opentracing.StartSpanFromContext(ctx, "authRepo.FindByEmail")
	defer span.Finish()

	foundUser := &models.User{}
	if err := r.db.QueryRowxContext(ctx, findUserByEmail, user.Email).StructScan(foundUser); err != nil {
		return nil, errors.Wrap(err, "authRepo.FindByEmail.QueryRowxContext")
	}
	return foundUser, nil
}

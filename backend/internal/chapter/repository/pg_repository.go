package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/AleksK1NG/api-mc/internal/chapter"
	"github.com/AleksK1NG/api-mc/internal/models"
)

// Chapter Repository
type chapterRepo struct {
	db *sqlx.DB
}

// Chapter Repository constructor
func NewChapterRepository(db *sqlx.DB) chapter.Repository {
	return &chapterRepo{db: db}
}

// Create new chapter
func (r *chapterRepo) CreateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	c := &models.Chapter{}
	if err := r.db.QueryRowxContext(
		ctx,
		createChapterQuery,
		chapter.Title,
		chapter.Description,
		chapter.Grade,
		chapter.Subject,
		chapter.Order,
		chapter.IsCustom,
		chapter.CreatedBy,
	).StructScan(c); err != nil {
		return nil, err
	}
	return c, nil
}

// Get chapter by id
func (r *chapterRepo) GetChapterByID(ctx context.Context, chapterID uuid.UUID) (*models.Chapter, error) {
	chapter := &models.Chapter{}
	if err := r.db.GetContext(ctx, chapter, getChapterByIDQuery, chapterID); err != nil {
		return nil, err
	}
	return chapter, nil
}

// Get chapters by subject and grade
func (r *chapterRepo) GetChaptersBySubject(ctx context.Context, subject string, grade int) ([]*models.Chapter, error) {
	var chapters []*models.Chapter
	if err := r.db.SelectContext(ctx, &chapters, getChaptersBySubjectQuery, subject, grade); err != nil {
		return nil, err
	}
	return chapters, nil
}

// Update chapter
func (r *chapterRepo) UpdateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	c := &models.Chapter{}
	if err := r.db.QueryRowxContext(
		ctx,
		updateChapterQuery,
		chapter.Title,
		chapter.Description,
		chapter.ChapterID,
	).StructScan(c); err != nil {
		return nil, err
	}
	return c, nil
}

// Delete chapter
func (r *chapterRepo) DeleteChapter(ctx context.Context, chapterID uuid.UUID) error {
	_, err := r.db.ExecContext(ctx, deleteChapterQuery, chapterID)
	return err
}

// Create lesson media
func (r *chapterRepo) CreateLessonMedia(ctx context.Context, media *models.LessonMedia) error {
	_, err := r.db.ExecContext(
		ctx,
		createLessonMediaQuery,
		media.LessonID,
		media.MediaType,
		media.URL,
		media.Description,
	)
	return err
}

// Get lesson media by chapter
func (r *chapterRepo) GetLessonMediaByChapter(ctx context.Context, chapterID uuid.UUID) ([]*models.LessonMedia, error) {
	var media []*models.LessonMedia
	if err := r.db.SelectContext(ctx, &media, getLessonMediaByChapterQuery, chapterID); err != nil {
		return nil, err
	}
	return media, nil
}

// Create quiz
func (r *chapterRepo) CreateQuiz(ctx context.Context, quiz *models.Quiz) error {
	_, err := r.db.ExecContext(
		ctx,
		createQuizQuery,
		quiz.LessonID,
		quiz.Title,
		quiz.Description,
		quiz.TimeLimit,
	)
	return err
}

// Get quiz by chapter
func (r *chapterRepo) GetQuizByChapter(ctx context.Context, chapterID uuid.UUID) (*models.Quiz, error) {
	quiz := &models.Quiz{}
	if err := r.db.GetContext(ctx, quiz, getQuizByChapterQuery, chapterID); err != nil {
		return nil, err
	}
	return quiz, nil
}

// Create question
func (r *chapterRepo) CreateQuestion(ctx context.Context, question *models.Question) error {
	_, err := r.db.ExecContext(
		ctx,
		createQuestionQuery,
		question.QuizID,
		question.Text,
		question.QuestionType,
		question.Options,
		question.Answer,
		question.Explanation,
		question.Points,
		question.Difficulty,
	)
	return err
}

// Get user custom chapters
func (r *chapterRepo) GetUserCustomChapters(ctx context.Context, userID uuid.UUID) ([]*models.Chapter, error) {
	var chapters []*models.Chapter
	if err := r.db.SelectContext(ctx, &chapters, getUserCustomChaptersQuery, userID); err != nil {
		return nil, err
	}
	return chapters, nil
}

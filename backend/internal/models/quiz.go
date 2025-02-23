package models

import (
	"time"

	"github.com/google/uuid"
)

// Quiz represents a collection of questions for a lesson
type Quiz struct {
	QuizID      uuid.UUID `json:"quiz_id" db:"quiz_id" validate:"omitempty"`
	LessonID    uuid.UUID `json:"lesson_id" db:"lesson_id" validate:"required"`
	Title       string    `json:"title" db:"title" validate:"required,lte=100"`
	Description string    `json:"description" db:"description" validate:"required,lte=500"`
	TimeLimit   *int      `json:"time_limit" db:"time_limit" validate:"omitempty"` // in minutes
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Question represents a single quiz question
type Question struct {
	QuestionID   uuid.UUID `json:"question_id" db:"question_id" validate:"omitempty"`
	QuizID       uuid.UUID `json:"quiz_id" db:"quiz_id" validate:"required"`
	Text         string    `json:"text" db:"text" validate:"required"`
	QuestionType string    `json:"question_type" db:"question_type" validate:"required,oneof=multiple_choice true_false open_ended"`
	Options      []string  `json:"options" db:"options" validate:"required_if=QuestionType multiple_choice"`
	Answer       string    `json:"answer" db:"answer" validate:"required"`
	Explanation  string    `json:"explanation" db:"explanation" validate:"required"`
	Points       int       `json:"points" db:"points" validate:"required,gte=1"`
	Difficulty   string    `json:"difficulty" db:"difficulty" validate:"required,oneof=easy medium hard"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// UserQuizAttempt tracks a user's attempt at a quiz
type UserQuizAttempt struct {
	AttemptID   uuid.UUID `json:"attempt_id" db:"attempt_id" validate:"omitempty"`
	UserID      uuid.UUID `json:"user_id" db:"user_id" validate:"required"`
	QuizID      uuid.UUID `json:"quiz_id" db:"quiz_id" validate:"required"`
	Score       int       `json:"score" db:"score" validate:"required,gte=0"`
	TimeSpent   int       `json:"time_spent" db:"time_spent" validate:"required,gte=0"` // in seconds
	CompletedAt time.Time `json:"completed_at" db:"completed_at"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// UserQuestionResponse tracks a user's response to a specific question
type UserQuestionResponse struct {
	ResponseID uuid.UUID `json:"response_id" db:"response_id" validate:"omitempty"`
	AttemptID  uuid.UUID `json:"attempt_id" db:"attempt_id" validate:"required"`
	QuestionID uuid.UUID `json:"question_id" db:"question_id" validate:"required"`
	UserAnswer string    `json:"user_answer" db:"user_answer" validate:"required"`
	IsCorrect  bool      `json:"is_correct" db:"is_correct"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// WrongAnswer tracks questions that users got wrong for later review
type WrongAnswer struct {
	WrongAnswerID uuid.UUID `json:"wrong_answer_id" db:"wrong_answer_id" validate:"omitempty"`
	UserID        uuid.UUID `json:"user_id" db:"user_id" validate:"required"`
	QuestionID    uuid.UUID `json:"question_id" db:"question_id" validate:"required"`
	AttemptCount  int       `json:"attempt_count" db:"attempt_count"`
	LastAttempt   time.Time `json:"last_attempt" db:"last_attempt"`
	NextReview    time.Time `json:"next_review" db:"next_review"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// QuizList represents a paginated list of quizzes
type QuizList struct {
	TotalCount int     `json:"total_count"`
	TotalPages int     `json:"total_pages"`
	Page       int     `json:"page"`
	Size       int     `json:"size"`
	HasMore    bool    `json:"has_more"`
	Quizzes    []*Quiz `json:"quizzes"`
}

// QuestionList represents a paginated list of questions
type QuestionList struct {
	TotalCount int         `json:"total_count"`
	TotalPages int         `json:"total_pages"`
	Page       int         `json:"page"`
	Size       int         `json:"size"`
	HasMore    bool        `json:"has_more"`
	Questions  []*Question `json:"questions"`
}

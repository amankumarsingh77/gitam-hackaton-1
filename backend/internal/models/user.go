package models

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// User model for the learning platform
type User struct {
	UserID     uuid.UUID `json:"user_id" db:"user_id" validate:"omitempty"`
	FirstName  string    `json:"first_name" db:"first_name" validate:"required,lte=30"`
	LastName   string    `json:"last_name" db:"last_name" validate:"required,lte=30"`
	Email      string    `json:"email" db:"email" validate:"required,lte=60,email"`
	Password   string    `json:"password,omitempty" db:"password" validate:"required,gte=6"`
	Grade      int       `json:"grade" db:"grade" validate:"required,gte=1,lte=12"`
	Avatar     *string   `json:"avatar,omitempty" db:"avatar" validate:"omitempty,lte=512,url"`
	XP         int       `json:"xp" db:"xp"`
	Streak     int       `json:"streak" db:"streak"`
	LastActive time.Time `json:"last_active" db:"last_active"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
	LoginDate  time.Time `json:"login_date" db:"login_date"`
}

// Hash user password with bcrypt
func (u *User) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// Compare user password and payload
func (u *User) ComparePasswords(password string) error {
	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)); err != nil {
		return err
	}
	return nil
}

// Sanitize user password
func (u *User) SanitizePassword() {
	u.Password = ""
}

// Prepare user for register
func (u *User) PrepareCreate() error {
	u.Email = strings.ToLower(strings.TrimSpace(u.Email))
	u.Password = strings.TrimSpace(u.Password)

	if err := u.HashPassword(); err != nil {
		return err
	}

	u.XP = 0
	u.Streak = 0
	u.LastActive = time.Now()
	return nil
}

// Prepare user for update
func (u *User) PrepareUpdate() error {
	u.Email = strings.ToLower(strings.TrimSpace(u.Email))
	return nil
}

// UsersList represents a paginated list of users
type UsersList struct {
	TotalCount int     `json:"total_count"`
	TotalPages int     `json:"total_pages"`
	Page       int     `json:"page"`
	Size       int     `json:"size"`
	HasMore    bool    `json:"has_more"`
	Users      []*User `json:"users"`
}

// UserWithToken represents a user with their authentication token
type UserWithToken struct {
	User  *User  `json:"user"`
	Token string `json:"token"`
}

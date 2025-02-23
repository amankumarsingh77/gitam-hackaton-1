package models

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JwtCustomClaims represents custom claims for JWT
type JwtCustomClaims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	jwt.RegisteredClaims
}

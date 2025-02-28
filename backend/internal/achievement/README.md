# Achievement Service

This service handles user achievements in the learning platform.

## Features

- Achievement management (CRUD operations)
- User achievement tracking
- Achievement awarding based on user activity

## API Endpoints

### Public Endpoints

- `GET /achievements` - Get all achievements
- `GET /achievements/:id` - Get achievement by ID

### Protected Endpoints (require authentication)

- `GET /achievements/user` - Get current user's achievements

### Admin Endpoints (require admin privileges)

- `POST /achievements/admin` - Create a new achievement
- `PUT /achievements/admin/:id` - Update an achievement
- `DELETE /achievements/admin/:id` - Delete an achievement
- `POST /achievements/admin/award` - Award an achievement to a user

## Models

### Achievement

```go
type Achievement struct {
    AchievementID uuid.UUID `json:"achievement_id" db:"achievement_id" validate:"omitempty"`
    Title         string    `json:"title" db:"title" validate:"required,lte=100"`
    Description   string    `json:"description" db:"description" validate:"required,lte=500"`
    Type          string    `json:"type" db:"type" validate:"required,oneof=streak quiz_score subject_mastery custom"`
    RequiredValue int       `json:"required_value" db:"required_value" validate:"required,gt=0"`
    IconURL       string    `json:"icon_url" db:"icon_url" validate:"required,url"`
    CreatedAt     time.Time `json:"created_at" db:"created_at"`
}
```

### UserAchievement

```go
type UserAchievement struct {
    UserAchievementID uuid.UUID `json:"user_achievement_id" db:"user_achievement_id" validate:"omitempty"`
    UserID            uuid.UUID `json:"user_id" db:"user_id" validate:"required"`
    AchievementID     uuid.UUID `json:"achievement_id" db:"achievement_id" validate:"required"`
    EarnedAt          time.Time `json:"earned_at" db:"earned_at"`
    CreatedAt         time.Time `json:"created_at" db:"created_at"`
}
```

## Database Schema

### achievements Table

```sql
CREATE TABLE achievements (
    achievement_id UUID PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,
    required_value INTEGER NOT NULL,
    icon_url VARCHAR(512) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### user_achievements Table

```sql
CREATE TABLE user_achievements (
    user_achievement_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(user_id, achievement_id)
);
``` 
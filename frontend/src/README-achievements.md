# Achievements Implementation

This document outlines the implementation of the achievements feature in the application.

## Files Structure

- `src/pages/Achievements.jsx` - Main component for displaying user achievements
- `src/components/AchievementCard.jsx` - Reusable component for displaying individual achievement cards
- `src/services/api.js` - Centralized API service that includes achievement endpoints
- `src/utils/achievementUtils.js` - Utility functions for working with achievement data

## API Integration

The achievements feature integrates with the following API endpoints through the centralized API service:

### Public Routes
- `GET /api/v1/achievements` - Get all achievements
- `GET /api/v1/achievements/{achievement_id}` - Get achievement by ID

### Protected Routes
- `GET /api/v1/achievements/user` - Get user's achievements (requires authentication)

### Admin Routes (not implemented in the UI)
- `POST /api/v1/achievements/admin` - Create achievement
- `PUT /api/v1/achievements/admin/{achievement_id}` - Update achievement
- `DELETE /api/v1/achievements/admin/{achievement_id}` - Delete achievement
- `POST /api/v1/achievements/admin/award` - Award achievement to user manually

## Data Flow

1. When the Achievements page loads, it checks if the user is authenticated
2. If authenticated, it fetches the user's achievements using the `/api/v1/achievements/user` endpoint via the achievementsAPI
3. If not authenticated, it fetches all public achievements using the `/api/v1/achievements` endpoint via the achievementsAPI
4. The API response is mapped to the component's data format using the `mapAchievementData` utility function
5. The achievements are displayed in the UI with progress indicators for locked achievements

## Achievement Types

The application supports the following achievement types:
- `lessons_completed` - Awarded for completing a certain number of lessons
- `streak` - Awarded for maintaining a learning streak
- `quiz_score` - Awarded for achieving a high score on quizzes
- `subject_mastery` - Awarded for completing chapters in a subject
- `xp_earned` - Awarded for earning XP points
- `custom` - Custom achievements

## UI Components

- Achievement progress bar - Shows overall progress in unlocking achievements
- Achievement stats - Shows counts of unlocked achievements, current level, and total XP
- Achievement cards - Display individual achievements with their status (locked/unlocked)
- Progress indicators - Show progress towards unlocking achievements

## Error Handling

The implementation includes error handling for API calls:
- Loading state while fetching data
- Error state if the API call fails
- Retry button to reload the page if there's an error

## Authentication

The application uses a centralized API service with an interceptor that automatically adds the authentication token to requests. This eliminates the need to manually pass tokens to each API call. 
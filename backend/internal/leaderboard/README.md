# Leaderboard Service

The leaderboard service provides functionality for tracking and displaying user rankings based on various metrics such as XP, streak, and level.

## Features

- Get leaderboard entries with optional filtering (time frame, subject, grade)
- Get a specific user's rank and stats
- Get top performers for a specific metric (XP, streak, level)
- Automatic leaderboard recalculation every 10 minutes
- Manual leaderboard recalculation via API endpoint

## API Endpoints

### GET /leaderboard

Get leaderboard entries with optional filtering.

Query parameters:
- `time_frame`: Filter by time frame (daily, weekly, monthly, all-time)
- `subject`: Filter by subject
- `grade`: Filter by grade
- `limit`: Number of entries to return (default: 10)

### GET /leaderboard/top

Get top performers for a specific metric.

Query parameters:
- `metric`: Metric to sort by (xp, streak, level)
- `limit`: Number of entries to return (default: 10)

### GET /leaderboard/users/:user_id

Get a specific user's rank and stats.

Path parameters:
- `user_id`: User ID or "me" for the current user

### POST /leaderboard/recalculate

Manually trigger a leaderboard recalculation.

## Automatic Recalculation

The leaderboard is automatically recalculated every 10 minutes by a background worker. This ensures that the rankings are always up-to-date without requiring manual intervention.

The recalculation process:
1. Sorts all users by XP (primary), streak (secondary), and level (tertiary)
2. Assigns ranks based on the sorted order
3. Updates the rank field for all users in the database

## Implementation Details

The leaderboard service follows the clean architecture pattern:

- **Models**: Data structures for leaderboard entries and filters
- **Repository**: Database operations for leaderboard data
- **Use Case**: Business logic for leaderboard operations
- **Delivery**: HTTP handlers for leaderboard API endpoints
- **Worker**: Background worker for automatic recalculation

## Configuration

The automatic recalculation interval is set to 10 minutes by default. This can be modified in the `worker/worker.go` file if needed. 
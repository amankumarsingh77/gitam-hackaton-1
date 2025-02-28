# Auth API Test Commands

## Authentication

### Register New User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -H "Access-Control-Request-Method: POST" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "securepass123",
    "grade": 10
  }'
```

### Login User
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -H "Access-Control-Request-Method: POST" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepass123"
  }'
```

## Profile Management
Note: Replace `{token}` with actual JWT token received from login/register.
Replace `{user_id}` with actual user ID.

### Get User Profile
```bash
curl -X GET http://localhost:8000/api/v1/auth/profile/{user_id} \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Update Profile
```bash
curl -X PUT http://localhost:8000/api/v1/auth/profile/{user_id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "grade": 11
  }'
```

### Update Avatar
```bash
curl -X PUT http://localhost:8000/api/v1/auth/profile/{user_id}/avatar \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "avatar_url": "https://example.com/avatars/user123.jpg"
  }'
```

## Progress Tracking

### Get User Progress
```bash
curl -X GET "http://localhost:8000/api/v1/auth/profile/{user_id}/progress?subject=math&grade=10" \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Get Daily Streak
```bash
curl -X GET http://localhost:8000/api/v1/auth/profile/{user_id}/streak \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

# Chapter API Test Commands

## Public Routes

### Get Chapters by Subject
```bash
curl -X GET "http://localhost:8000/api/v1/chapters?subject=math&grade=10" \
  -H "Origin: http://localhost:8000"
```

### Get Chapter by ID
```bash
curl -X GET http://localhost:8000/api/v1/chapters/{chapter_id} \
  -H "Origin: http://localhost:8000"
```

## Protected Routes
Note: Replace `{token}` with actual JWT token received from login.

### Create Chapter
```bash
curl -X POST http://localhost:8000/api/v1/chapters \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "title": "Introduction to Algebra",
    "description": "Learn the basics of algebraic expressions",
    "grade": 10,
    "subject": "math",
    "order": 1
  }'
```

### Update Chapter
```bash
curl -X PUT http://localhost:8000/api/v1/chapters/{chapter_id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "title": "Updated Chapter Title",
    "description": "Updated chapter description"
  }'
```

### Delete Chapter
```bash
curl -X DELETE http://localhost:8000/api/v1/chapters/{chapter_id} \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Get Lesson by ID
```bash
curl -X GET http://localhost:8000/api/v1/chapters/lessons/{lesson_id} \
  -H "Origin: http://localhost:8000"
```

## AI Generation Routes

### Generate Chapter with AI
```bash
curl -X POST http://localhost:8000/api/v1/chapters/generate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "prompt": "Introduction to Quadratic Equations",
    "subject": "math",
    "grade": 10
  }'
```

### Generate Memes for Chapter
```bash
curl -X POST http://localhost:8000/api/v1/chapters/{chapter_id}/memes \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "topic": "Quadratic Equations"
  }'
```

### Generate Quiz for Chapter
```bash
curl -X POST http://localhost:8000/api/v1/chapters/{chapter_id}/quiz \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000"
```

## Custom Content Routes

### Create Custom Chapter
```bash
curl -X POST http://localhost:8000/api/v1/chapters/custom \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "title": "My Custom Chapter",
    "description": "Personalized learning content",
    "grade": 10,
    "subject": "math",
    "order": 1
  }'
```

### Get User's Custom Chapters
```bash
curl -X GET http://localhost:8000/api/v1/chapters/custom \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Get Custom Lessons by Chapter ID
```bash
curl -X GET http://localhost:8000/api/v1/chapters/{chapter_id}/custom-lessons \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Create Custom Lesson for Chapter
```bash
curl -X POST http://localhost:8000/api/v1/chapters/{chapter_id}/custom-lessons \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "title": "My Custom Lesson",
    "description": "A personalized lesson I created",
    "content": "This is the content of my custom lesson. It can include text, code examples, and explanations."
  }'
```

# Leaderboard API Test Commands

## Public Routes

### Get Leaderboard
```bash
curl -X GET "http://localhost:8000/api/v1/leaderboard?time_frame=all-time&subject=math&grade=10&limit=20" \
  -H "Origin: http://localhost:8000"
```

### Get Top Performers by Metric
```bash
curl -X GET "http://localhost:8000/api/v1/leaderboard/top?metric=xp&limit=10" \
  -H "Origin: http://localhost:8000"
```

### Manually Recalculate Leaderboard
```bash
curl -X POST http://localhost:8000/api/v1/leaderboard/recalculate \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000"
```
Note: The leaderboard is automatically recalculated every 10 minutes by a background worker, so manual recalculation is typically not necessary.

## Protected Routes
Note: Replace `{token}` with actual JWT token received from login.
Replace `{user_id}` with actual user ID or use "me" to get current user's rank.

### Get User's Rank
```bash
curl -X GET http://localhost:8000/api/v1/leaderboard/users/{user_id} \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Get Current User's Rank
```bash
curl -X GET http://localhost:8000/api/v1/leaderboard/users/me \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

## Automatic Leaderboard Updates
The leaderboard is updated in two ways:
1. **Background Worker**: Automatically recalculates the entire leaderboard every 10 minutes
2. **Middleware Tracking**: Updates individual user stats in real-time when they perform certain actions

The leaderboard is automatically updated when users:
1. Complete lessons
2. Submit quizzes
3. Update their profile
4. Earn achievements

The following endpoints will trigger leaderboard updates:

### Update Profile (triggers leaderboard update)
```bash
curl -X PUT http://localhost:8000/api/v1/auth/profile/{user_id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "grade": 11
  }'
```

### Complete a Lesson (triggers leaderboard update)
```bash
curl -X PUT http://localhost:8000/api/v1/lessons/{lesson_id}/complete \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Submit a Quiz (triggers leaderboard update)
```bash
curl -X POST http://localhost:8000/api/v1/chapters/quizzes/submit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "quiz_id": "{quiz_id}",
    "answers": [
      {
        "question_id": "{question_id_1}",
        "answer": "option A"
      },
      {
        "question_id": "{question_id_2}",
        "answer": "option B"
      }
    ]
  }'
```

# Achievement API Test Commands

## Public Routes

### Get All Achievements
```bash
curl -X GET http://localhost:8000/api/v1/achievements \
  -H "Origin: http://localhost:8000"
```

### Get Achievement by ID
```bash
curl -X GET http://localhost:8000/api/v1/achievements/{achievement_id} \
  -H "Origin: http://localhost:8000"
```

## Protected Routes
Note: Replace `{token}` with actual JWT token received from login.

### Get User's Achievements
```bash
curl -X GET http://localhost:8000/api/v1/achievements/user \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Trigger Achievement Check Manually
```bash
# This endpoint is automatically called when user views their achievements
# or interacts with lessons, quizzes, or progress endpoints
# The following endpoints will trigger achievement checks:

# 1. View user achievements (triggers check automatically)
curl -X GET http://localhost:8000/api/v1/achievements/user \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"

# 2. Complete a lesson (triggers check automatically)
curl -X PUT http://localhost:8000/api/v1/lessons/{lesson_id}/complete \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"

# 3. Submit a quiz (triggers check automatically)
curl -X POST http://localhost:8000/api/v1/quizzes/{quiz_id}/submit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "answers": [
      {
        "question_id": "{question_id}",
        "answer": "user_answer"
      }
    ]
  }'
```

## Admin Routes
Note: These routes require admin privileges.

### Create Achievement
```bash
curl -X POST http://localhost:8000/api/v1/achievements/admin \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "title": "First Steps",
    "description": "Complete your first lesson",
    "type": "lessons_completed",
    "required_value": 1,
    "icon_url": "https://example.com/icons/first_steps.png"
  }'
```

### Create Streak Achievement
```bash
curl -X POST http://localhost:8000/api/v1/achievements/admin \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "title": "Consistent Learner",
    "description": "Maintain a 7-day learning streak",
    "type": "streak",
    "required_value": 7,
    "icon_url": "https://example.com/icons/streak.png"
  }'
```

### Create Quiz Score Achievement
```bash
curl -X POST http://localhost:8000/api/v1/achievements/admin \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "title": "Quiz Master",
    "description": "Score 90 or higher on a quiz",
    "type": "quiz_score",
    "required_value": 90,
    "icon_url": "https://example.com/icons/quiz_master.png"
  }'
```

### Create Subject Mastery Achievement
```bash
curl -X POST http://localhost:8000/api/v1/achievements/admin \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "title": "Math Whiz",
    "description": "Read 10 chapters in Mathematics",
    "type": "subject_mastery",
    "required_value": 10,
    "icon_url": "https://example.com/icons/math_whiz.png"
  }'
```

### Create XP Achievement
```bash
curl -X POST http://localhost:8000/api/v1/achievements/admin \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "title": "Experience Collector",
    "description": "Earn 1000 XP points",
    "type": "xp_earned",
    "required_value": 1000,
    "icon_url": "https://example.com/icons/xp_collector.png"
  }'
```

### Update Achievement
```bash
curl -X PUT http://localhost:8000/api/v1/achievements/admin/{achievement_id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "title": "Updated Achievement",
    "description": "Updated achievement description",
    "type": "custom",
    "required_value": 1,
    "icon_url": "https://example.com/icons/updated.png"
  }'
```

### Delete Achievement
```bash
curl -X DELETE http://localhost:8000/api/v1/achievements/admin/{achievement_id} \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Award Achievement to User Manually
```bash
curl -X POST http://localhost:8000/api/v1/achievements/admin/award \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "user_id": "{user_id}",
    "achievement_id": "{achievement_id}"
  }'
```

## Quiz Management Routes

### Get All Quizzes for a Chapter
```bash
curl -X GET http://localhost:8000/api/v1/chapters/{chapter_id}/quizzes \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Get Quiz by ID
```bash
curl -X GET http://localhost:8000/api/v1/chapters/quizzes/{quiz_id} \
  -H "Authorization: Bearer {token}" \
  -H "Origin: http://localhost:8000"
```

### Submit Quiz Answers
```bash
curl -X POST http://localhost:8000/api/v1/chapters/quizzes/submit \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8000" \
  -d '{
    "quiz_id": "{quiz_id}",
    "answers": [
      {
        "question_id": "{question_id_1}",
        "answer": "option A"
      },
      {
        "question_id": "{question_id_2}",
        "answer": "option B"
      }
    ]
  }'
```

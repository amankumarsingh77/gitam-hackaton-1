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

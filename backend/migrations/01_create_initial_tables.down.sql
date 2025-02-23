-- Drop tables in reverse order of creation (to handle foreign key dependencies)
DROP TABLE IF EXISTS daily_streaks CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS wrong_answers CASCADE;
DROP TABLE IF EXISTS user_question_responses CASCADE;
DROP TABLE IF EXISTS user_quiz_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS lesson_media CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop extensions if they exist
DROP EXTENSION IF EXISTS CITEXT;
DROP EXTENSION IF EXISTS "uuid-ossp";

DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS lesson_media CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS user_quiz_attempts CASCADE;
DROP TABLE IF EXISTS user_question_responses CASCADE;
DROP TABLE IF EXISTS wrong_answers CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS daily_streaks CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS CITEXT;
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS postgis_topology;


CREATE TABLE users
(
    user_id     UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    first_name  VARCHAR(30)             NOT NULL CHECK (first_name <> ''),
    last_name   VARCHAR(30)             NOT NULL CHECK (last_name <> ''),
    email       VARCHAR(60) UNIQUE      NOT NULL CHECK (email <> ''),
    password    VARCHAR(250)            NOT NULL CHECK (octet_length(password) <> 0),
    grade       INTEGER                 NOT NULL CHECK (grade >= 1 AND grade <= 12),
    avatar      VARCHAR(512),
    xp          INTEGER                 NOT NULL DEFAULT 0,
    streak      INTEGER                 NOT NULL DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    login_date  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chapters
(
    chapter_id  UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    title       VARCHAR(100)            NOT NULL CHECK (title <> ''),
    description VARCHAR(500)            NOT NULL CHECK (description <> ''),
    grade       INTEGER                 NOT NULL CHECK (grade >= 1 AND grade <= 12),
    subject     VARCHAR(50)             NOT NULL CHECK (subject <> ''),
    "order"     INTEGER                 NOT NULL,
    is_custom   BOOLEAN                 NOT NULL DEFAULT false,
    created_by  UUID                    NOT NULL REFERENCES users(user_id),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lessons
(
    lesson_id   UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    chapter_id  UUID                    NOT NULL REFERENCES chapters(chapter_id) ON DELETE CASCADE,
    title       VARCHAR(100)            NOT NULL CHECK (title <> ''),
    description VARCHAR(500)            NOT NULL CHECK (description <> ''),
    content     TEXT                    NOT NULL CHECK (content <> ''),
    grade       INTEGER                 NOT NULL CHECK (grade >= 1 AND grade <= 12),
    subject     VARCHAR(50)             NOT NULL CHECK (subject <> ''),
    is_custom   BOOLEAN                 NOT NULL DEFAULT false,
    created_by  UUID                    NOT NULL REFERENCES users(user_id),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lesson_media
(
    media_id    UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    lesson_id   UUID                    NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    media_type  VARCHAR(5)              NOT NULL CHECK (media_type IN ('image', 'meme')),
    url         VARCHAR(512)            NOT NULL CHECK (url <> ''),
    description VARCHAR(200)            NOT NULL CHECK (description <> ''),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes
(
    quiz_id     UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    lesson_id   UUID                    NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    title       VARCHAR(100)            NOT NULL CHECK (title <> ''),
    description VARCHAR(500)            NOT NULL CHECK (description <> ''),
    time_limit  INTEGER,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions
(
    question_id   UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    quiz_id       UUID                    NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    text          TEXT                    NOT NULL CHECK (text <> ''),
    question_type VARCHAR(15)             NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'open_ended')),
    options       TEXT[]                  CHECK (question_type != 'multiple_choice' OR array_length(options, 1) >= 2),
    answer        TEXT                    NOT NULL CHECK (answer <> ''),
    explanation   TEXT                    NOT NULL CHECK (explanation <> ''),
    points        INTEGER                 NOT NULL CHECK (points >= 1),
    difficulty    VARCHAR(6)              NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_quiz_attempts
(
    attempt_id   UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    user_id      UUID                    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    quiz_id      UUID                    NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    score        INTEGER                 NOT NULL CHECK (score >= 0),
    time_spent   INTEGER                 NOT NULL CHECK (time_spent >= 0), -- in seconds
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_question_responses
(
    response_id  UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    attempt_id   UUID                    NOT NULL REFERENCES user_quiz_attempts(attempt_id) ON DELETE CASCADE,
    question_id  UUID                    NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    user_answer  TEXT                    NOT NULL CHECK (user_answer <> ''),
    is_correct   BOOLEAN                 NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wrong_answers
(
    wrong_answer_id UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    user_id         UUID                    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    question_id     UUID                    NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    attempt_count   INTEGER                 NOT NULL DEFAULT 1,
    last_attempt    TIMESTAMP WITH TIME ZONE NOT NULL,
    next_review     TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_progress
(
    progress_id    UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    user_id        UUID                    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    subject        VARCHAR(50)             NOT NULL CHECK (subject <> ''),
    grade          INTEGER                 NOT NULL CHECK (grade >= 1 AND grade <= 12),
    chapters_read  INTEGER                 NOT NULL DEFAULT 0,
    quizzes_taken  INTEGER                 NOT NULL DEFAULT 0,
    avg_score      DECIMAL(5,2)            NOT NULL DEFAULT 0.00,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, subject, grade)
);

CREATE TABLE lesson_progress
(
    lesson_progress_id UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    user_id            UUID                    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    lesson_id          UUID                    NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    status             VARCHAR(11)             NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completed_at       TIMESTAMP WITH TIME ZONE,
    time_spent         INTEGER                 NOT NULL DEFAULT 0, -- in seconds
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, lesson_id)
);

CREATE TABLE achievements
(
    achievement_id UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    title          VARCHAR(100)            NOT NULL CHECK (title <> ''),
    description    VARCHAR(500)            NOT NULL CHECK (description <> ''),
    type           VARCHAR(15)             NOT NULL CHECK (type IN ('streak', 'quiz_score', 'subject_mastery', 'custom')),
    required_value INTEGER                 NOT NULL CHECK (required_value > 0),
    icon_url       VARCHAR(512)            NOT NULL CHECK (icon_url <> ''),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_achievements
(
    user_achievement_id UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    user_id            UUID                    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id     UUID                    NOT NULL REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    earned_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, achievement_id)
);

CREATE TABLE daily_streaks
(
    streak_id      UUID PRIMARY KEY                  DEFAULT uuid_generate_v4(),
    user_id        UUID                    NOT NULL REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER                 NOT NULL DEFAULT 0,
    max_streak     INTEGER                 NOT NULL DEFAULT 0,
    last_activity  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lessons_chapter_id ON lessons(chapter_id);
CREATE INDEX idx_lessons_grade_subject ON lessons(grade, subject);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_user_quiz_attempts_user_id ON user_quiz_attempts(user_id);
CREATE INDEX idx_user_quiz_attempts_quiz_id ON user_quiz_attempts(quiz_id);
CREATE INDEX idx_wrong_answers_user_id ON wrong_answers(user_id);
CREATE INDEX idx_wrong_answers_next_review ON wrong_answers(next_review);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress(status);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

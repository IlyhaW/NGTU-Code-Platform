CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS edu;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS auth.groups (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.users (
  id BIGSERIAL PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  password_hash BYTEA NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  group_id BIGINT REFERENCES auth.groups(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS edu.assignments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  variants_count INT NOT NULL DEFAULT 0,
  tags VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS edu.assignment_tasks (
  id BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES edu.assignments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tags VARCHAR(500),
  input_format TEXT,
  output_format TEXT,
  judge_time_limit_ms INT,
  judge_memory_limit_kb INT
);

CREATE INDEX IF NOT EXISTS idx_assignment_tasks_assignment_id
  ON edu.assignment_tasks(assignment_id);

CREATE TABLE IF NOT EXISTS edu.assignment_variants (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES edu.assignment_tasks(id) ON DELETE CASCADE,
  variant_name TEXT,
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignment_variants_task_id
  ON edu.assignment_variants(task_id);

CREATE TABLE IF NOT EXISTS edu.tests (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id BIGINT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  total_time_minutes INT NOT NULL DEFAULT 0,
  allow_late_submission BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tests_teacher_id
  ON edu.tests(teacher_id);

CREATE TABLE IF NOT EXISTS edu.test_groups (
  id BIGSERIAL PRIMARY KEY,
  test_id BIGINT NOT NULL REFERENCES edu.tests(id) ON DELETE CASCADE,
  group_id BIGINT NOT NULL REFERENCES auth.groups(id) ON DELETE CASCADE,
  UNIQUE (test_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_test_groups_test_id
  ON edu.test_groups(test_id);

CREATE INDEX IF NOT EXISTS idx_test_groups_group_id
  ON edu.test_groups(group_id);

CREATE TABLE IF NOT EXISTS edu.test_questions (
  id BIGSERIAL PRIMARY KEY,
  test_id BIGINT NOT NULL REFERENCES edu.tests(id) ON DELETE CASCADE,
  assignment_id BIGINT NOT NULL REFERENCES edu.assignments(id) ON DELETE CASCADE,
  assignment_task_id BIGINT REFERENCES edu.assignment_tasks(id) ON DELETE CASCADE,
  individual_variants BOOLEAN NOT NULL DEFAULT FALSE,
  max_attempts INT NOT NULL DEFAULT 1,
  solve_time_minutes INT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test_id
  ON edu.test_questions(test_id);

CREATE INDEX IF NOT EXISTS idx_test_questions_assignment_task_id
  ON edu.test_questions(assignment_task_id);

CREATE TABLE IF NOT EXISTS edu.test_question_answers (
  id BIGSERIAL PRIMARY KEY,
  test_question_id BIGINT NOT NULL REFERENCES edu.test_questions(id) ON DELETE CASCADE,
  student_user_id BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  attempts_used INT NOT NULL DEFAULT 1,
  time_spent_seconds INT,
  solution_status VARCHAR(32) NOT NULL DEFAULT 'saved',
  UNIQUE (test_question_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_tqa_test_question
  ON edu.test_question_answers(test_question_id);

CREATE INDEX IF NOT EXISTS idx_tqa_student
  ON edu.test_question_answers(student_user_id);

CREATE TABLE IF NOT EXISTS edu.student_test_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id BIGINT NOT NULL REFERENCES edu.tests(id) ON DELETE CASCADE,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_time_seconds INT,
  UNIQUE (user_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_stc_user
  ON edu.student_test_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_stc_test
  ON edu.student_test_completions(test_id);

CREATE TABLE IF NOT EXISTS edu.task_test_cases (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES edu.assignment_tasks(id) ON DELETE CASCADE,
  input_data TEXT NOT NULL DEFAULT '',
  expected_output TEXT NOT NULL DEFAULT '',
  time_limit_ms INT NOT NULL DEFAULT 2000,
  memory_limit_kb INT NOT NULL DEFAULT 262144,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  variant_id BIGINT REFERENCES edu.assignment_variants(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_task_test_cases_task_id
  ON edu.task_test_cases(task_id);

CREATE INDEX IF NOT EXISTS idx_task_test_cases_variant_id
  ON edu.task_test_cases(variant_id);

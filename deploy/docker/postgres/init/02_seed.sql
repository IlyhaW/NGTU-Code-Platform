INSERT INTO auth.groups (name)
VALUES ('22-KT')
ON CONFLICT (name) DO NOTHING;

INSERT INTO auth.users (login, password_hash, full_name, role, group_id)
SELECT
  'teacher',
  convert_to(crypt('teacher123', gen_salt('bf', 10)), 'UTF8'),
  'Demo Teacher',
  'teacher',
  NULL
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE login = 'teacher');

INSERT INTO auth.users (login, password_hash, full_name, role, group_id)
SELECT
  'student',
  convert_to(crypt('student123', gen_salt('bf', 10)), 'UTF8'),
  'Demo Student',
  'student',
  (SELECT id FROM auth.groups WHERE name = '22-KT')
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE login = 'student');

INSERT INTO edu.assignments (name, teacher_id, variants_count, tags)
SELECT
  'Introduction to Python',
  u.id,
  1,
  'python,basics'
FROM auth.users u
WHERE u.login = 'teacher'
  AND NOT EXISTS (SELECT 1 FROM edu.assignments WHERE name = 'Introduction to Python');

INSERT INTO edu.assignment_tasks (
  assignment_id,
  title,
  sort_order,
  tags,
  input_format,
  output_format,
  judge_time_limit_ms,
  judge_memory_limit_kb
)
SELECT
  a.id,
  'Sum of two numbers',
  1,
  'math,io',
  'Two integers a and b in one line',
  'One integer: a + b',
  2000,
  262144
FROM edu.assignments a
WHERE a.name = 'Introduction to Python'
  AND NOT EXISTS (
    SELECT 1 FROM edu.assignment_tasks t
    WHERE t.assignment_id = a.id AND t.title = 'Sum of two numbers'
  );

INSERT INTO edu.assignment_variants (task_id, variant_name, content)
SELECT
  t.id,
  'Default variant',
  to_jsonb('Write a Python program that reads two integers and prints their sum.'::text)
FROM edu.assignment_tasks t
WHERE t.title = 'Sum of two numbers'
  AND NOT EXISTS (
    SELECT 1 FROM edu.assignment_variants v
    WHERE v.task_id = t.id AND v.variant_name = 'Default variant'
  );

INSERT INTO edu.task_test_cases (
  task_id, variant_id, input_data, expected_output, time_limit_ms, memory_limit_kb, active, is_public
)
SELECT
  t.id,
  v.id,
  '2 3',
  '5',
  2000,
  262144,
  TRUE,
  TRUE
FROM edu.assignment_tasks t
JOIN edu.assignment_variants v ON v.task_id = t.id
WHERE t.title = 'Sum of two numbers'
  AND NOT EXISTS (
    SELECT 1 FROM edu.task_test_cases tc
    WHERE tc.task_id = t.id AND tc.input_data = '2 3'
  );

INSERT INTO edu.task_test_cases (
  task_id, variant_id, input_data, expected_output, time_limit_ms, memory_limit_kb, active, is_public
)
SELECT
  t.id,
  v.id,
  '10 20',
  '30',
  2000,
  262144,
  TRUE,
  FALSE
FROM edu.assignment_tasks t
JOIN edu.assignment_variants v ON v.task_id = t.id
WHERE t.title = 'Sum of two numbers'
  AND NOT EXISTS (
    SELECT 1 FROM edu.task_test_cases tc
    WHERE tc.task_id = t.id AND tc.input_data = '10 20'
  );

INSERT INTO edu.tests (
  name, teacher_id, start_date, end_date, total_time_minutes, allow_late_submission, status
)
SELECT
  'Demo Test',
  u.id,
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '7 day',
  30,
  FALSE,
  'active'
FROM auth.users u
WHERE u.login = 'teacher'
  AND NOT EXISTS (SELECT 1 FROM edu.tests WHERE name = 'Demo Test');

INSERT INTO edu.test_groups (test_id, group_id)
SELECT
  t.id,
  g.id
FROM edu.tests t
JOIN auth.groups g ON g.name = '22-KT'
WHERE t.name = 'Demo Test'
ON CONFLICT (test_id, group_id) DO NOTHING;

INSERT INTO edu.test_questions (
  test_id, assignment_id, assignment_task_id, individual_variants, max_attempts, solve_time_minutes, sort_order
)
SELECT
  tst.id,
  a.id,
  task.id,
  FALSE,
  3,
  30,
  0
FROM edu.tests tst
JOIN edu.assignments a ON a.name = 'Introduction to Python'
JOIN edu.assignment_tasks task ON task.assignment_id = a.id AND task.title = 'Sum of two numbers'
WHERE tst.name = 'Demo Test'
  AND NOT EXISTS (
    SELECT 1 FROM edu.test_questions q
    WHERE q.test_id = tst.id AND q.assignment_task_id = task.id
  );

UPDATE edu.assignments a
SET variants_count = COALESCE(v.cnt, 0)
FROM (
  SELECT t.assignment_id, COUNT(av.id) AS cnt
  FROM edu.assignment_tasks t
  LEFT JOIN edu.assignment_variants av ON av.task_id = t.id
  GROUP BY t.assignment_id
) v
WHERE a.id = v.assignment_id;

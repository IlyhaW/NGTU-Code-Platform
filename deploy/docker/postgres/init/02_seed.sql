-- Large demonstration dataset for a fresh Docker PostgreSQL volume.
-- The script is idempotent enough for manual reruns, but docker-entrypoint runs it only once.

INSERT INTO auth.groups (name)
VALUES ('22-КТ'), ('23-ИС'), ('21-ПИ'), ('24-ВТ')
ON CONFLICT (name) DO NOTHING;

INSERT INTO auth.users (login, password_hash, full_name, role, group_id)
SELECT 'teacher', convert_to(crypt('teacher123', gen_salt('bf', 10)), 'UTF8'), 'Иванов Сергей Петрович', 'teacher', NULL
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE login = 'teacher');

WITH demo_students(login, full_name, group_name) AS (
  VALUES
    ('student01', 'Алексеева Мария Андреевна', '22-КТ'),
    ('student02', 'Борисов Никита Олегович', '22-КТ'),
    ('student03', 'Васильева Анна Сергеевна', '22-КТ'),
    ('student04', 'Григорьев Павел Игоревич', '22-КТ'),
    ('student05', 'Дмитриева Софья Максимовна', '23-ИС'),
    ('student06', 'Егоров Артем Денисович', '23-ИС'),
    ('student07', 'Зайцева Дарья Романовна', '23-ИС'),
    ('student08', 'Козлов Илья Владимирович', '23-ИС'),
    ('student09', 'Лебедева Полина Кирилловна', '21-ПИ'),
    ('student10', 'Морозов Тимофей Александрович', '21-ПИ'),
    ('student11', 'Новикова Елизавета Павловна', '21-ПИ'),
    ('student12', 'Орлов Максим Артемович', '21-ПИ'),
    ('student13', 'Павлова Ксения Ильинична', '24-ВТ'),
    ('student14', 'Романов Даниил Евгеньевич', '24-ВТ'),
    ('student15', 'Соколова Варвара Никитична', '24-ВТ'),
    ('student16', 'Федоров Матвей Дмитриевич', '24-ВТ')
)
INSERT INTO auth.users (login, password_hash, full_name, role, group_id)
SELECT s.login, convert_to(crypt('student123', gen_salt('bf', 10)), 'UTF8'), s.full_name, 'student', g.id
FROM demo_students s
JOIN auth.groups g ON g.name = s.group_name
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.login = s.login);

WITH demo_assignments(name, tags) AS (
  VALUES
    ('Python: ввод, вывод и арифметика', 'python,basics,io,math'),
    ('Python: условные операторы', 'python,conditions,logic'),
    ('Python: циклы и последовательности', 'python,loops,sequences'),
    ('Python: строки', 'python,strings'),
    ('Python: списки и массивы', 'python,lists,arrays'),
    ('Python: функции и декомпозиция', 'python,functions')
)
INSERT INTO edu.assignments (name, teacher_id, variants_count, tags)
SELECT a.name, u.id, 0, a.tags
FROM demo_assignments a
JOIN auth.users u ON u.login = 'teacher'
WHERE NOT EXISTS (SELECT 1 FROM edu.assignments x WHERE x.name = a.name);

WITH demo_tasks(assignment_name, title, sort_order, tags, input_format, output_format, time_limit_ms, memory_limit_kb) AS (
  VALUES
    ('Python: ввод, вывод и арифметика', 'Сумма двух чисел', 1, 'math,io', 'Два целых числа a и b в одной строке.', 'Одно целое число: сумма a и b.', 2000, 262144),
    ('Python: ввод, вывод и арифметика', 'Среднее арифметическое', 2, 'math,float', 'Три вещественных числа.', 'Среднее значение с точностью до двух знаков.', 2000, 262144),
    ('Python: условные операторы', 'Максимум из трех чисел', 1, 'conditions,math', 'Три целых числа.', 'Наибольшее из введенных чисел.', 2000, 262144),
    ('Python: условные операторы', 'Високосный год', 2, 'conditions,calendar', 'Одно целое число: год.', 'YES, если год високосный, иначе NO.', 2000, 262144),
    ('Python: циклы и последовательности', 'Количество четных чисел', 1, 'loops,counts', 'n, затем n целых чисел.', 'Количество четных чисел.', 2000, 262144),
    ('Python: циклы и последовательности', 'Сумма цифр числа', 2, 'loops,digits', 'Одно неотрицательное целое число.', 'Сумма его цифр.', 2000, 262144),
    ('Python: строки', 'Палиндром', 1, 'strings,conditions', 'Одна строка.', 'YES, если строка является палиндромом без учета регистра, иначе NO.', 2000, 262144),
    ('Python: строки', 'Количество гласных', 2, 'strings,counts', 'Одна строка.', 'Количество гласных букв.', 2000, 262144),
    ('Python: списки и массивы', 'Минимальный элемент списка', 1, 'lists,min', 'n, затем n целых чисел.', 'Минимальное число.', 2000, 262144),
    ('Python: списки и массивы', 'Сдвиг списка вправо', 2, 'lists,shift', 'n, затем n чисел списка.', 'Список после циклического сдвига вправо на один элемент.', 2000, 262144),
    ('Python: функции и декомпозиция', 'Факториал числа', 1, 'functions,math', 'Одно целое число n от 0 до 10.', 'n!.', 2000, 262144),
    ('Python: функции и декомпозиция', 'НОД двух чисел', 2, 'functions,gcd', 'Два натуральных числа.', 'Их наибольший общий делитель.', 2000, 262144)
)
INSERT INTO edu.assignment_tasks (assignment_id, title, sort_order, tags, input_format, output_format, judge_time_limit_ms, judge_memory_limit_kb)
SELECT a.id, t.title, t.sort_order, t.tags, t.input_format, t.output_format, t.time_limit_ms, t.memory_limit_kb
FROM demo_tasks t
JOIN edu.assignments a ON a.name = t.assignment_name
WHERE NOT EXISTS (
  SELECT 1 FROM edu.assignment_tasks x WHERE x.assignment_id = a.id AND x.title = t.title
);

INSERT INTO edu.assignment_variants (task_id, variant_name, content)
SELECT t.id, v.variant_name, to_jsonb(v.content::text)
FROM (
  VALUES
    ('Сумма двух чисел', 'Исходный вариант', 'Даны два целых числа. Найдите их сумму.'),
    ('Сумма двух чисел', 'Вариант 1', 'Кассир подсчитывает выручку за две смены. Даны суммы за первую и вторую смену. Определите общую выручку.'),
    ('Сумма двух чисел', 'Вариант 2', 'Робот проехал маршрут из двух участков. Даны длины участков в метрах. Найдите длину всего маршрута.'),
    ('Среднее арифметическое', 'Исходный вариант', 'Даны три числа. Найдите их среднее арифметическое.'),
    ('Среднее арифметическое', 'Вариант 1', 'Студент получил три оценки за лабораторные работы. Определите средний балл.'),
    ('Среднее арифметическое', 'Вариант 2', 'Известны три значения температуры за день. Найдите среднюю температуру.'),
    ('Максимум из трех чисел', 'Исходный вариант', 'Даны три целых числа. Определите наибольшее из них.'),
    ('Максимум из трех чисел', 'Вариант 1', 'В соревновании участвовали три команды. Даны их результаты в баллах. Найдите лучший результат.'),
    ('Максимум из трех чисел', 'Вариант 2', 'Даны высоты трех зданий. Определите высоту самого высокого здания.'),
    ('Високосный год', 'Исходный вариант', 'Дан номер года. Определите, является ли этот год високосным по правилам григорианского календаря.'),
    ('Високосный год', 'Вариант 1', 'Для календаря нужно понять, есть ли в указанном году 29 февраля. Определите, является ли год високосным.'),
    ('Високосный год', 'Вариант 2', 'Дан год выпуска архива. Определите, содержит ли соответствующий календарный год 366 дней.'),
    ('Количество четных чисел', 'Исходный вариант', 'Дана последовательность целых чисел. Посчитайте, сколько элементов последовательности являются четными.'),
    ('Количество четных чисел', 'Вариант 1', 'В журнале записаны результаты измерений. Определите количество измерений, значения которых делятся на 2.'),
    ('Количество четных чисел', 'Вариант 2', 'Дан набор числовых кодов. Посчитайте, сколько кодов оканчиваются на четную цифру.'),
    ('Сумма цифр числа', 'Исходный вариант', 'Дано неотрицательное целое число. Найдите сумму его цифр.'),
    ('Сумма цифр числа', 'Вариант 1', 'Дан номер билета. Найдите сумму всех цифр этого номера.'),
    ('Сумма цифр числа', 'Вариант 2', 'Дан числовой код товара. Вычислите контрольную сумму как сумму цифр кода.'),
    ('Палиндром', 'Исходный вариант', 'Дана строка. Определите, является ли она палиндромом без учета регистра.'),
    ('Палиндром', 'Вариант 1', 'Дано слово. Проверьте, одинаково ли оно читается слева направо и справа налево без учета регистра.'),
    ('Палиндром', 'Вариант 2', 'Дана короткая фраза без пробелов. Определите, является ли она палиндромом.'),
    ('Количество гласных', 'Исходный вариант', 'Дана строка. Посчитайте количество гласных букв английского алфавита.'),
    ('Количество гласных', 'Вариант 1', 'Дано слово. Определите, сколько в нем гласных символов.'),
    ('Количество гласных', 'Вариант 2', 'Дан текст без переноса строк. Найдите количество гласных букв в этом тексте.'),
    ('Минимальный элемент списка', 'Исходный вариант', 'Дан список целых чисел. Найдите его минимальный элемент.'),
    ('Минимальный элемент списка', 'Вариант 1', 'Даны результаты нескольких измерений. Определите самое маленькое значение.'),
    ('Минимальный элемент списка', 'Вариант 2', 'Дан набор цен. Найдите минимальную цену среди всех предложений.'),
    ('Сдвиг списка вправо', 'Исходный вариант', 'Дан список чисел. Выполните циклический сдвиг списка вправо на один элемент.'),
    ('Сдвиг списка вправо', 'Вариант 1', 'Очередь задач хранится в списке. Переместите последнюю задачу в начало очереди.'),
    ('Сдвиг списка вправо', 'Вариант 2', 'Дан ряд чисел. Выполните один циклический сдвиг ряда вправо.'),
    ('Факториал числа', 'Исходный вариант', 'Дано целое число n. Вычислите факториал этого числа.'),
    ('Факториал числа', 'Вариант 1', 'Для заданного n найдите произведение всех натуральных чисел от 1 до n включительно.'),
    ('Факториал числа', 'Вариант 2', 'Дано количество различных объектов n. Определите количество способов расположить их в ряд.'),
    ('НОД двух чисел', 'Исходный вариант', 'Даны два натуральных числа. Найдите их наибольший общий делитель.'),
    ('НОД двух чисел', 'Вариант 1', 'Даны длины двух отрезков. Найдите максимальную длину мерки, которой можно отмерить оба отрезка без остатка.'),
    ('НОД двух чисел', 'Вариант 2', 'Для двух натуральных чисел определите наибольшее число, на которое оба числа делятся без остатка.')
) AS v(task_title, variant_name, content)
JOIN edu.assignment_tasks t ON t.title = v.task_title
WHERE NOT EXISTS (
  SELECT 1 FROM edu.assignment_variants x WHERE x.task_id = t.id AND x.variant_name = v.variant_name
);

WITH case_templates(task_title, case_no, input_data, expected_output) AS (
  VALUES
    ('Сумма двух чисел', 1, '2 3', '5'),
    ('Сумма двух чисел', 2, '-5 8', '3'),
    ('Сумма двух чисел', 3, '0 0', '0'),
    ('Сумма двух чисел', 4, '100 250', '350'),
    ('Сумма двух чисел', 5, '-10 -20', '-30'),
    ('Сумма двух чисел', 6, '999 1', '1000'),
    ('Сумма двух чисел', 7, '-100 50', '-50'),
    ('Сумма двух чисел', 8, '12345 67890', '80235'),
    ('Сумма двух чисел', 9, '7 -3', '4'),
    ('Сумма двух чисел', 10, '500 500', '1000'),
    ('Среднее арифметическое', 1, '1 2 3', '2.00'),
    ('Среднее арифметическое', 2, '2.5 3.5 4', '3.33'),
    ('Среднее арифметическое', 3, '0 0 0', '0.00'),
    ('Среднее арифметическое', 4, '10 20 30', '20.00'),
    ('Среднее арифметическое', 5, '-1 -2 -3', '-2.00'),
    ('Среднее арифметическое', 6, '1.2 1.3 1.4', '1.30'),
    ('Среднее арифметическое', 7, '100 50 0', '50.00'),
    ('Среднее арифметическое', 8, '7 8 9', '8.00'),
    ('Среднее арифметическое', 9, '-5 5 10', '3.33'),
    ('Среднее арифметическое', 10, '3.33 3.33 3.33', '3.33'),
    ('Максимум из трех чисел', 1, '4 9 1', '9'),
    ('Максимум из трех чисел', 2, '12 12 3', '12'),
    ('Максимум из трех чисел', 3, '-5 -2 -9', '-2'),
    ('Максимум из трех чисел', 4, '0 0 0', '0'),
    ('Максимум из трех чисел', 5, '100 99 98', '100'),
    ('Максимум из трех чисел', 6, '7 8 8', '8'),
    ('Максимум из трех чисел', 7, '-1 5 3', '5'),
    ('Максимум из трех чисел', 8, '42 17 42', '42'),
    ('Максимум из трех чисел', 9, '-10 -20 -30', '-10'),
    ('Максимум из трех чисел', 10, '6 6 9', '9'),
    ('Високосный год', 1, '2024', 'YES'),
    ('Високосный год', 2, '1900', 'NO'),
    ('Високосный год', 3, '2000', 'YES'),
    ('Високосный год', 4, '2023', 'NO'),
    ('Високосный год', 5, '2400', 'YES'),
    ('Високосный год', 6, '2100', 'NO'),
    ('Високосный год', 7, '1996', 'YES'),
    ('Високосный год', 8, '1800', 'NO'),
    ('Високосный год', 9, '1600', 'YES'),
    ('Високосный год', 10, '2022', 'NO'),
    ('Количество четных чисел', 1, '5\n1 2 3 4 6', '3'),
    ('Количество четных чисел', 2, '4\n8 10 11 13', '2'),
    ('Количество четных чисел', 3, '3\n7 9 11', '0'),
    ('Количество четных чисел', 4, '6\n0 1 2 3 4 5', '3'),
    ('Количество четных чисел', 5, '1\n2', '1'),
    ('Количество четных чисел', 6, '5\n-2 -1 0 1 2', '3'),
    ('Количество четных чисел', 7, '4\n5 7 9 11', '0'),
    ('Количество четных чисел', 8, '7\n2 4 6 8 10 12 14', '7'),
    ('Количество четных чисел', 9, '3\n-3 -4 -5', '1'),
    ('Количество четных чисел', 10, '2\n100 101', '1'),
    ('Сумма цифр числа', 1, '12345', '15'),
    ('Сумма цифр числа', 2, '9001', '10'),
    ('Сумма цифр числа', 3, '0', '0'),
    ('Сумма цифр числа', 4, '999', '27'),
    ('Сумма цифр числа', 5, '100000', '1'),
    ('Сумма цифр числа', 6, '50505', '15'),
    ('Сумма цифр числа', 7, '2468', '20'),
    ('Сумма цифр числа', 8, '13579', '25'),
    ('Сумма цифр числа', 9, '111111', '6'),
    ('Сумма цифр числа', 10, '808080', '24'),
    ('Палиндром', 1, 'Level', 'YES'),
    ('Палиндром', 2, 'Python', 'NO'),
    ('Палиндром', 3, 'radar', 'YES'),
    ('Палиндром', 4, 'Madam', 'YES'),
    ('Палиндром', 5, 'hello', 'NO'),
    ('Палиндром', 6, 'abba', 'YES'),
    ('Палиндром', 7, 'abcba', 'YES'),
    ('Палиндром', 8, 'abca', 'NO'),
    ('Палиндром', 9, 'A', 'YES'),
    ('Палиндром', 10, 'OpenAI', 'NO'),
    ('Количество гласных', 1, 'Hello', '2'),
    ('Количество гласных', 2, 'algorithm', '3'),
    ('Количество гласных', 3, 'BCDF', '0'),
    ('Количество гласных', 4, 'education', '5'),
    ('Количество гласных', 5, 'Python', '1'),
    ('Количество гласных', 6, 'aeiou', '5'),
    ('Количество гласных', 7, 'queue', '4'),
    ('Количество гласных', 8, 'rhythm', '0'),
    ('Количество гласных', 9, 'student', '2'),
    ('Количество гласных', 10, 'platform', '2'),
    ('Минимальный элемент списка', 1, '5\n7 3 9 2 8', '2'),
    ('Минимальный элемент списка', 2, '4\n-1 5 0 2', '-1'),
    ('Минимальный элемент списка', 3, '3\n10 10 10', '10'),
    ('Минимальный элемент списка', 4, '6\n4 3 2 1 0 -1', '-1'),
    ('Минимальный элемент списка', 5, '1\n42', '42'),
    ('Минимальный элемент списка', 6, '5\n-5 -4 -3 -2 -1', '-5'),
    ('Минимальный элемент списка', 7, '4\n100 20 30 40', '20'),
    ('Минимальный элемент списка', 8, '7\n9 8 7 6 5 4 3', '3'),
    ('Минимальный элемент списка', 9, '2\n0 -10', '-10'),
    ('Минимальный элемент списка', 10, '3\n5 1 5', '1'),
    ('Сдвиг списка вправо', 1, '5\n1 2 3 4 5', '5 1 2 3 4'),
    ('Сдвиг списка вправо', 2, '1\n42', '42'),
    ('Сдвиг списка вправо', 3, '4\n9 8 7 6', '6 9 8 7'),
    ('Сдвиг списка вправо', 4, '3\n1 1 2', '2 1 1'),
    ('Сдвиг списка вправо', 5, '6\n0 1 2 3 4 5', '5 0 1 2 3 4'),
    ('Сдвиг списка вправо', 6, '2\n10 20', '20 10'),
    ('Сдвиг списка вправо', 7, '5\n-1 -2 -3 -4 -5', '-5 -1 -2 -3 -4'),
    ('Сдвиг списка вправо', 8, '4\n7 7 8 8', '8 7 7 8'),
    ('Сдвиг списка вправо', 9, '3\n100 200 300', '300 100 200'),
    ('Сдвиг списка вправо', 10, '5\n5 4 3 2 1', '1 5 4 3 2'),
    ('Факториал числа', 1, '5', '120'),
    ('Факториал числа', 2, '0', '1'),
    ('Факториал числа', 3, '7', '5040'),
    ('Факториал числа', 4, '1', '1'),
    ('Факториал числа', 5, '3', '6'),
    ('Факториал числа', 6, '4', '24'),
    ('Факториал числа', 7, '6', '720'),
    ('Факториал числа', 8, '8', '40320'),
    ('Факториал числа', 9, '9', '362880'),
    ('Факториал числа', 10, '10', '3628800'),
    ('НОД двух чисел', 1, '12 18', '6'),
    ('НОД двух чисел', 2, '17 13', '1'),
    ('НОД двух чисел', 3, '100 80', '20'),
    ('НОД двух чисел', 4, '21 14', '7'),
    ('НОД двух чисел', 5, '9 6', '3'),
    ('НОД двух чисел', 6, '48 18', '6'),
    ('НОД двух чисел', 7, '270 192', '6'),
    ('НОД двух чисел', 8, '81 27', '27'),
    ('НОД двух чисел', 9, '37 600', '1'),
    ('НОД двух чисел', 10, '56 98', '14')
)
INSERT INTO edu.task_test_cases (task_id, variant_id, input_data, expected_output, time_limit_ms, memory_limit_kb, active, is_public)
SELECT t.id, v.id, replace(c.input_data, '\n', E'\n'), c.expected_output, 2000, 262144, TRUE, c.case_no <= 5
FROM case_templates c
JOIN edu.assignment_tasks t ON t.title = c.task_title
JOIN edu.assignment_variants v ON v.task_id = t.id
WHERE NOT EXISTS (
  SELECT 1 FROM edu.task_test_cases x
  WHERE x.task_id = t.id AND x.variant_id = v.id AND x.input_data = replace(c.input_data, '\n', E'\n')
);

WITH demo_tests(name, start_date, end_date, total_time_minutes, allow_late_submission, status) AS (
  VALUES
    ('Контрольная работа: основы Python', NOW() - INTERVAL '2 day', NOW() + INTERVAL '5 day', 90, FALSE, 'active'),
    ('Завершенный тест: строки и списки', NOW() - INTERVAL '14 day', NOW() - INTERVAL '3 day', 70, FALSE, 'archived'),
    ('Будущий тест: функции', NOW() + INTERVAL '3 day', NOW() + INTERVAL '10 day', 60, FALSE, 'active'),
    ('Черновик: повторение циклов', NOW() + INTERVAL '15 day', NOW() + INTERVAL '20 day', 45, TRUE, 'draft')
)
INSERT INTO edu.tests (name, teacher_id, start_date, end_date, total_time_minutes, allow_late_submission, status, updated_at)
SELECT dt.name, u.id, dt.start_date, dt.end_date, dt.total_time_minutes, dt.allow_late_submission, dt.status, NOW()
FROM demo_tests dt
JOIN auth.users u ON u.login = 'teacher'
WHERE NOT EXISTS (SELECT 1 FROM edu.tests x WHERE x.name = dt.name);

WITH links(test_name, group_name) AS (
  VALUES
    ('Контрольная работа: основы Python', '22-КТ'),
    ('Контрольная работа: основы Python', '23-ИС'),
    ('Завершенный тест: строки и списки', '22-КТ'),
    ('Завершенный тест: строки и списки', '23-ИС'),
    ('Завершенный тест: строки и списки', '21-ПИ'),
    ('Будущий тест: функции', '21-ПИ'),
    ('Будущий тест: функции', '24-ВТ'),
    ('Черновик: повторение циклов', '22-КТ')
)
INSERT INTO edu.test_groups (test_id, group_id)
SELECT t.id, g.id
FROM links l
JOIN edu.tests t ON t.name = l.test_name
JOIN auth.groups g ON g.name = l.group_name
ON CONFLICT (test_id, group_id) DO NOTHING;

WITH questions(test_name, task_title, individual_variants, max_attempts, solve_time_minutes, sort_order) AS (
  VALUES
    ('Контрольная работа: основы Python', 'Сумма двух чисел', TRUE, 3, 20, 1),
    ('Контрольная работа: основы Python', 'Максимум из трех чисел', TRUE, 2, 25, 2),
    ('Контрольная работа: основы Python', 'Количество четных чисел', TRUE, 3, 25, 3),
    ('Контрольная работа: основы Python', 'Палиндром', TRUE, 2, 20, 4),
    ('Завершенный тест: строки и списки', 'Палиндром', TRUE, 2, 20, 1),
    ('Завершенный тест: строки и списки', 'Количество гласных', TRUE, 3, 20, 2),
    ('Завершенный тест: строки и списки', 'Минимальный элемент списка', TRUE, 2, 25, 3),
    ('Завершенный тест: строки и списки', 'Сдвиг списка вправо', TRUE, 3, 25, 4),
    ('Будущий тест: функции', 'Факториал числа', TRUE, 3, 30, 1),
    ('Будущий тест: функции', 'НОД двух чисел', TRUE, 3, 30, 2),
    ('Черновик: повторение циклов', 'Сумма цифр числа', FALSE, 2, 20, 1)
)
INSERT INTO edu.test_questions (test_id, assignment_id, assignment_task_id, individual_variants, max_attempts, solve_time_minutes, sort_order)
SELECT tst.id, task.assignment_id, task.id, q.individual_variants, q.max_attempts, q.solve_time_minutes, q.sort_order
FROM questions q
JOIN edu.tests tst ON tst.name = q.test_name
JOIN edu.assignment_tasks task ON task.title = q.task_title
WHERE NOT EXISTS (
  SELECT 1 FROM edu.test_questions x WHERE x.test_id = tst.id AND x.assignment_task_id = task.id
);

WITH answers(test_name, task_title, student_login, content, attempts_used, time_spent_seconds, solution_status, updated_at) AS (
  VALUES
    ('Контрольная работа: основы Python', 'Сумма двух чисел', 'student01', $code$a, b = map(int, input().split())
print(a + b)$code$, 1, 420, 'graded_pass', NOW() - INTERVAL '1 day'),
    ('Контрольная работа: основы Python', 'Максимум из трех чисел', 'student01', $code$nums = list(map(int, input().split()))
print(max(nums))$code$, 1, 510, 'graded_pass', NOW() - INTERVAL '1 day'),
    ('Контрольная работа: основы Python', 'Количество четных чисел', 'student01', $code$n = int(input())
arr = list(map(int, input().split()))
print(sum(1 for x in arr if x % 2 == 0))$code$, 2, 840, 'graded_pass', NOW() - INTERVAL '20 hour'),
    ('Контрольная работа: основы Python', 'Палиндром', 'student01', $code$s = input().strip().lower()
print('YES' if s == s[::-1] else 'NO')$code$, 1, 390, 'graded_pass', NOW() - INTERVAL '19 hour'),
    ('Контрольная работа: основы Python', 'Сумма двух чисел', 'student02', $code$a, b = map(int, input().split())
print(a + b)$code$, 1, 300, 'graded_pass', NOW() - INTERVAL '18 hour'),
    ('Контрольная работа: основы Python', 'Максимум из трех чисел', 'student02', $code$a, b, c = map(int, input().split())
print(a)$code$, 2, 960, 'graded_fail', NOW() - INTERVAL '18 hour'),
    ('Контрольная работа: основы Python', 'Количество четных чисел', 'student02', $code$n = int(input())
print(0)$code$, 3, 1100, 'graded_fail', NOW() - INTERVAL '17 hour'),
    ('Контрольная работа: основы Python', 'Сумма двух чисел', 'student03', $code$a, b = map(int, input().split())
print(a + b)$code$, 4, 600, 'graded_pass', NOW() - INTERVAL '12 hour'),
    ('Контрольная работа: основы Python', 'Максимум из трех чисел', 'student03', $code$nums = list(map(int, input().split()))
print(max(nums))$code$, 1, 420, 'graded_pass', NOW() - INTERVAL '12 hour'),
    ('Контрольная работа: основы Python', 'Палиндром', 'student03', $code$s = input().strip().lower()
print('YES' if s == s[::-1] else 'NO')$code$, 1, 500, 'saved', NOW() - INTERVAL '10 hour'),
    ('Контрольная работа: основы Python', 'Сумма двух чисел', 'student05', $code$a, b = map(int, input().split())
print(a + b)$code$, 1, 280, 'graded_pass', NOW() - INTERVAL '8 hour'),
    ('Контрольная работа: основы Python', 'Максимум из трех чисел', 'student05', $code$a, b, c = map(int, input().split())
print(max(a, b, c))$code$, 1, 360, 'graded_pass', NOW() - INTERVAL '8 hour'),
    ('Контрольная работа: основы Python', 'Количество четных чисел', 'student06', $code$n = int(input())
arr = list(map(int, input().split()))
print(sum(x % 2 == 0 for x in arr))$code$, 2, 730, 'graded_pass', NOW() - INTERVAL '7 hour'),
    ('Контрольная работа: основы Python', 'Палиндром', 'student06', $code$s = input().strip()
print('YES')$code$, 2, 660, 'graded_fail', NOW() - INTERVAL '6 hour'),
    ('Завершенный тест: строки и списки', 'Палиндром', 'student01', $code$s = input().strip().lower()
print('YES' if s == s[::-1] else 'NO')$code$, 1, 520, 'graded_pass', NOW() - INTERVAL '10 day'),
    ('Завершенный тест: строки и списки', 'Количество гласных', 'student01', $code$vowels = set('aeiou')
s = input().lower()
print(sum(1 for ch in s if ch in vowels))$code$, 2, 710, 'graded_pass', NOW() - INTERVAL '10 day'),
    ('Завершенный тест: строки и списки', 'Минимальный элемент списка', 'student01', $code$n = int(input())
arr = list(map(int, input().split()))
print(min(arr))$code$, 1, 430, 'graded_pass', NOW() - INTERVAL '10 day'),
    ('Завершенный тест: строки и списки', 'Сдвиг списка вправо', 'student01', $code$n = int(input())
arr = list(map(int, input().split()))
print(*([arr[-1]] + arr[:-1]))$code$, 2, 820, 'graded_pass', NOW() - INTERVAL '10 day'),
    ('Завершенный тест: строки и списки', 'Палиндром', 'student02', $code$s = input().strip().lower()
print('YES' if s == s[::-1] else 'NO')$code$, 1, 480, 'graded_pass', NOW() - INTERVAL '9 day'),
    ('Завершенный тест: строки и списки', 'Количество гласных', 'student02', $code$s = input().lower()
print(len(s))$code$, 3, 1300, 'graded_fail', NOW() - INTERVAL '9 day'),
    ('Завершенный тест: строки и списки', 'Минимальный элемент списка', 'student02', $code$n = int(input())
arr = list(map(int, input().split()))
print(min(arr))$code$, 3, 900, 'graded_pass', NOW() - INTERVAL '1 day'),
    ('Завершенный тест: строки и списки', 'Сдвиг списка вправо', 'student02', $code$n = int(input())
arr = list(map(int, input().split()))
print(*arr)$code$, 1, 600, 'graded_fail', NOW() - INTERVAL '9 day'),
    ('Завершенный тест: строки и списки', 'Палиндром', 'student03', $code$s = input().strip().lower()
print('YES' if s == s[::-1] else 'NO')$code$, 1, 400, 'graded_pass', NOW() - INTERVAL '8 day'),
    ('Завершенный тест: строки и списки', 'Количество гласных', 'student03', $code$vowels = 'aeiou'
print(sum(ch.lower() in vowels for ch in input()))$code$, 1, 520, 'graded_pass', NOW() - INTERVAL '8 day'),
    ('Завершенный тест: строки и списки', 'Минимальный элемент списка', 'student03', $code$n = int(input())
arr = list(map(int, input().split()))
print(max(arr))$code$, 2, 700, 'graded_fail', NOW() - INTERVAL '8 day'),
    ('Завершенный тест: строки и списки', 'Сдвиг списка вправо', 'student03', $code$n = int(input())
arr = list(map(int, input().split()))
print(*([arr[-1]] + arr[:-1]))$code$, 2, 760, 'saved', NOW() - INTERVAL '8 day'),
    ('Завершенный тест: строки и списки', 'Палиндром', 'student05', $code$s = input().strip().lower()
print('YES' if s == s[::-1] else 'NO')$code$, 2, 580, 'graded_pass', NOW() - INTERVAL '11 day'),
    ('Завершенный тест: строки и списки', 'Количество гласных', 'student05', $code$v = set('aeiou')
print(sum(ch.lower() in v for ch in input()))$code$, 2, 650, 'graded_pass', NOW() - INTERVAL '11 day'),
    ('Завершенный тест: строки и списки', 'Минимальный элемент списка', 'student05', $code$n = int(input())
arr = list(map(int, input().split()))
print(min(arr))$code$, 1, 430, 'graded_pass', NOW() - INTERVAL '11 day'),
    ('Завершенный тест: строки и списки', 'Сдвиг списка вправо', 'student05', $code$n = int(input())
arr = list(map(int, input().split()))
print(*([arr[-1]] + arr[:-1]))$code$, 1, 510, 'graded_pass', NOW() - INTERVAL '11 day'),
    ('Завершенный тест: строки и списки', 'Палиндром', 'student09', $code$s = input().strip().lower()
print('YES' if s == s[::-1] else 'NO')$code$, 1, 540, 'graded_pass', NOW() - INTERVAL '12 day'),
    ('Завершенный тест: строки и списки', 'Количество гласных', 'student09', $code$print(0)$code$, 3, 1400, 'graded_fail', NOW() - INTERVAL '12 day'),
    ('Завершенный тест: строки и списки', 'Минимальный элемент списка', 'student09', $code$n = int(input())
arr = list(map(int, input().split()))
print(min(arr))$code$, 1, 470, 'graded_pass', NOW() - INTERVAL '12 day'),
    ('Завершенный тест: строки и списки', 'Сдвиг списка вправо', 'student09', $code$n = int(input())
arr = list(map(int, input().split()))
print(*([arr[-1]] + arr[:-1]))$code$, 4, 980, 'graded_pass', NOW() - INTERVAL '12 day')
)
INSERT INTO edu.test_question_answers (test_question_id, student_user_id, content, attempts_used, time_spent_seconds, solution_status, updated_at)
SELECT q.id, u.id, a.content, a.attempts_used, a.time_spent_seconds, a.solution_status, a.updated_at
FROM answers a
JOIN edu.tests tst ON tst.name = a.test_name
JOIN edu.test_questions q ON q.test_id = tst.id
JOIN edu.assignment_tasks task ON task.id = q.assignment_task_id AND task.title = a.task_title
JOIN auth.users u ON u.login = a.student_login
ON CONFLICT (test_question_id, student_user_id) DO UPDATE SET
  content = EXCLUDED.content,
  attempts_used = EXCLUDED.attempts_used,
  time_spent_seconds = EXCLUDED.time_spent_seconds,
  solution_status = EXCLUDED.solution_status,
  updated_at = EXCLUDED.updated_at;

WITH completions(test_name, student_login, completed_at, total_time_seconds) AS (
  VALUES
    ('Завершенный тест: строки и списки', 'student01', NOW() - INTERVAL '10 day', 3540),
    ('Завершенный тест: строки и списки', 'student02', NOW() - INTERVAL '9 day', 4100),
    ('Завершенный тест: строки и списки', 'student03', NOW() - INTERVAL '8 day', 3860),
    ('Завершенный тест: строки и списки', 'student05', NOW() - INTERVAL '11 day', 3200),
    ('Завершенный тест: строки и списки', 'student09', NOW() - INTERVAL '12 day', 4300),
    ('Контрольная работа: основы Python', 'student01', NOW() - INTERVAL '18 hour', 2950),
    ('Контрольная работа: основы Python', 'student02', NOW() - INTERVAL '17 hour', 3600)
)
INSERT INTO edu.student_test_completions (user_id, test_id, completed_at, total_time_seconds)
SELECT u.id, t.id, c.completed_at, c.total_time_seconds
FROM completions c
JOIN auth.users u ON u.login = c.student_login
JOIN edu.tests t ON t.name = c.test_name
ON CONFLICT (user_id, test_id) DO UPDATE SET
  completed_at = EXCLUDED.completed_at,
  total_time_seconds = EXCLUDED.total_time_seconds;

UPDATE edu.assignments a
SET variants_count = COALESCE(v.cnt, 0)
FROM (
  SELECT t.assignment_id, COUNT(av.id) AS cnt
  FROM edu.assignment_tasks t
  LEFT JOIN edu.assignment_variants av ON av.task_id = t.id
  GROUP BY t.assignment_id
) v
WHERE a.id = v.assignment_id;
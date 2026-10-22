PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL,
    instructor TEXT NOT NULL
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,

    FOREIGN KEY (student_id)
    REFERENCES students(student_id),

    FOREIGN KEY (course_id)
    REFERENCES courses(course_id),

    UNIQUE (student_id, course_id)
);

INSERT INTO students (student_id, name, email) 

VALUES
(1, 'Faith Banda', 'amina@example.com'),
(2, 'Ibrahim Phiri', 'peter@example.com'),
(3, 'Grace Mbewe', 'grace@example.com'),
(4, 'Joseph Chisale', 'john@example.com');

INSERT INTO courses (course_id, course_name, instructor) 

VALUES
(1, 'Database Systems', 'Ms. Nkhoma'),
(2, 'Web Development', 'Mr. Chirwa'),
(3, 'Computer Networks', 'Dr. Kamanga');

INSERT INTO enrolments
(enrolment_id, student_id, course_id, grade) 

VALUES
(1, 1, 1, 'A'),
(2, 1, 2, 'B'),
(3, 2, 1, 'B'),
(4, 2, 3, 'A'),
(5, 3, 2, 'A'),
(6, 3, 3, 'B');


SELECT students.name, courses.course_name, enrolments.grade
FROM students
JOIN enrolments
    ON students.student_id = enrolments.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE students.name = 'Faith Banda';


SELECT courses.course_name, students.name, enrolments.grade
FROM courses
JOIN enrolments
    ON courses.course_id = enrolments.course_id
JOIN students
    ON enrolments.student_id = students.student_id
WHERE courses.course_name = 'Database Systems';


SELECT courses.course_name,
       COUNT(enrolments.student_id) AS number_of_students
FROM courses
LEFT JOIN enrolments
    ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.course_name;


SELECT students.name, students.email
FROM students
LEFT JOIN enrolments
    ON students.student_id = enrolments.student_id
WHERE enrolments.enrolment_id IS NULL;


UPDATE enrolments
SET grade = 'A'
WHERE enrolment_id = 2;


SELECT students.name, courses.course_name, enrolments.grade
FROM enrolments
JOIN students
    ON enrolments.student_id = students.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE enrolments.enrolment_id = 2;

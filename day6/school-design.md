# School Database Design

## 1. Tables

### Students table

The `students` table stores information about students, including their ID, name and email address. The student ID is the primary key because every student needs a unique identifier. The email is required and must be unique.

### Courses table

The `courses` table stores the courses offered by the school. It contains a course ID, course name and instructor. Here the course ID is the primary key.

### Enrolments table

The `enrolments` table records the courses taken by students and the grades they receive showing how they have perfomed. It contains foreign keys that connect it to the students and courses tables. It also has a grade column. A unique constraint on the combination of student ID and course ID prevents duplicate enrolments.

## 2. Relationships

The relationship between students and enrolments is **one-to-many** because one student can enrol in several courses. Each enrolment belongs to one student.

The relationship between courses and enrolments is also **one-to-many** because one course can have many enrolled students. Each enrolment refers to one course.

Students and courses have a **many-to-many** relationship. A student can take many courses, and a course can have many students. The enrolments table acts as a **join table** between them. It is needed to connect the two tables correctly and to store the grade associated with each enrolment.

## 3. Index

I would create an index on the `course_id` column in the enrolments table. This would help the database find enrolments for a particular course more quickly, especially when listing students on a course or counting enrolments.

```sql
CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);
```

## 4. SQL or NoSQL?

I would choose SQL for this school system because students, courses and enrolments have clear relationships. SQL supports primary keys, foreign keys and unique constraints, which could help maintain accurate data and prevent duplicate enrolments. JOIN queries also make it easy to find students on a course or courses taken by a student. SQLite is a good choice for a small project because it is proven to simple to set up and does not require a separate database server. While NoSQL databases are useful for some flexible data structures, but SQL is better suited to this system's structured and related information.

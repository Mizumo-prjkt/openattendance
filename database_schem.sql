--  This is a mapping of the database schema for the application.

CREATE TABLE IF NOT EXISTS benchmark_test (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    col_text1 TEXT,
    col_text2 TEXT,
    col_int1 INTEGER,
    col_int2 INTEGER,
    col_real1 REAL,
    col_real2 REAL,
    col_blob1 BLOB,
    col_date1 DATE,
    col_bool1 BOOLEAN
);

CREATE TABLE students (
   id INTEGER PRIMARY KEY AUTOINCREMENT, -- database index
   last_name TEXT,                       -- optional
   first_name TEXT NOT NULL,             -- required
   middle_name TEXT,                     -- optional
   phone_number TEXT,                    -- optional
   address TEXT,                         -- optional
   emergency_contact_name TEXT,          -- optional
   emergency_contact_phone TEXT,         -- optional
   emergency_contact_relationship TEXT CHECK (
       emergency_contact_relationship IN ('parent', 'guardian')
   ),                                    -- optional, locked to parent/guardian
   student_id TEXT NOT NULL UNIQUE       -- required, must be unique
);


CREATE TABLE configurations (
   config_id INTEGER PRIMARY KEY AUTOINCREMENT, -- internal index
   school_name TEXT NOT NULL,                   -- required
   school_type TEXT CHECK (
       school_type IN ('public', 'private', 'charter', 'international')
   ),                                           -- optional but constrained
   address TEXT,                                -- optional
   logo_directory TEXT,                         -- optional, path to logo file
   organization_hotline TEXT,                   -- optional
   country_code TEXT NOT NULL                   -- required, e.g. 'PH', 'US'
);

-- Excused table
CREATE TABLE excused (
    excused_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    request_datetime DATETIME NOT NULL,
    verdict_datetime DATETIME,
    result TEXT CHECK (result IN ('excused', 'not_excused')),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Present table
CREATE TABLE present (
    present_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    time_in DATETIME NOT NULL,
    time_out DATETIME,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Absent table
CREATE TABLE absent (
    absent_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    reason TEXT,
    absent_datetime DATETIME NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

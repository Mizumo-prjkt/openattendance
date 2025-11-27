// OpenAttendance JavaScript code for Setup
// License: 

// Load environment variables from .env file
require('dotenv').config();
// This is a setup file for the project
// Note that the page root is on setup directory, and the port should be different
// Than the runtime to avoid conflicts and stupidity of the end user

const express = require('express');
const NTP = require('ntp-time').Client;
const path = require('path');
const sequelize = require('sequelize');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcrypt');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const PORT = 3999; // Our setup port
const crypto = require('crypto');
const os = require('os');
const checkDiskSpace = require('check-disk-space').default;
const mkdirp = require('mkdirp');
let debugMode = false;

// Create a directory for staff profile image uploads if it doesn't exist
const staffImageUploadDir = path.join(__dirname, 'runtime/shared/images/staff_profiles');
if (!fs.existsSync(staffImageUploadDir)) {
    fs.mkdirSync(staffImageUploadDir, { recursive: true });
}
// Create a directory for school logo uploads
const schoolLogoUploadDir = path.join(__dirname, 'runtime/shared/images/school_logos');
if (!fs.existsSync(schoolLogoUploadDir)) {
    fs.mkdirSync(schoolLogoUploadDir, { recursive: true });
}
// Create a directory for database backups
const backupsDir = path.join(__dirname, 'database', 'backups');
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}


let logFilePath;
let argenv = process.argv.slice(2);

// DebugWriteToFile function
// From @MizProject/Mitra setup.js
// Check if being run by nodemon
if (argenv.includes('--debug')) {
    console.log("Setup is being run with --debug flag.");
    console.log("Which means, its being run in development mode.");
    console.log("Enabling extreme debug logging for development.");
    debugMode = true; 
    // Now, create the logfile
    const __dayToday = new Date();
    const __timeToday = __dayToday.toLocaleTimeString().replace(/:/g, '-');
    const __dateToday = __dayToday.toLocaleDateString().replace(/\//g, '-');
    // Variable for logfile name should be exposed at runtime so no new file
    // is created every time a log is written to.
    const logFileName = `debug-openattendance-runtime-log-${__dateToday}_${__timeToday}.log`;
    const logDir = path.join(__dirname, 'data', 'logs');
    mkdirp.sync(logDir); // Ensure the directory exists
    logFilePath = path.join(logDir, logFileName); // Assign to the higher-scoped variable
    fs.writeFileSync(logFilePath, `Debug Log Created on ${__dateToday} at ${__timeToday}\n\n`);
    debugLogWriteToFile(`Debug logging started. Log file: ${logFilePath}`);
}

function debugLogWriteToFile(message) {
    if (debugMode === false) return;
    // Fetch timedate for stamping
    const dayToday = new Date();
    const timeToday = dayToday.toLocaleTimeString();
    const dateToday = dayToday.toLocaleDateString().replace(/\//g, '-');
    const logEntry = `[${dateToday} ${timeToday}] ${message}\n`;
    fs.appendFileSync(logFilePath, logEntry); // logFilePath is now in scope
}

// Override console.log to also write to log file in debug mode
console.error = function(message) {
    const dayToday = new Date();
    const timeToday = dayToday.toLocaleTimeString();
    const dateToday = dayToday.toLocaleDateString().replace(/\//g, '-');
    const logEntry = `[${dateToday} ${timeToday}] ERROR: ${message}\n`;
    if (debugMode) {
        fs.appendFileSync(logFilePath, logEntry);
        process.stdout.write(logEntry);
    } else {
        // In non-debug mode, spit it out to the console only
        process.stdout.write(logEntry);
    }
};

// Also pass the warn to log
console.warn = function(message) {
    const dayToday = new Date();
    const timeToday = dayToday.toLocaleTimeString();
    const dateToday = dayToday.toLocaleDateString().replace(/\//g, '-');
    const logEntry = `[${dateToday} ${timeToday}] WARNING: ${message}\n`;
    if (debugMode) {
        fs.appendFileSync(logFilePath, logEntry);
        process.stdout.write(logEntry);
    } else {
        process.stdout.write(logEntry);
    }
};

// Capture process terminations while on debug
process.on('exit', (code) => {
    debugLogWriteToFile(`Setup process exiting with code: ${code}`);
})

process.on('SIGINT', () => {
    debugLogWriteToFile("Setup process interrupted (SIGINT). Exiting...");
    process.exit(0);
})

process.on('uncaughtException', (err) => {
    debugLogWriteToFile(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

function brkln(type) {
    /** 
    * Prints break lines for readability
    * @param {string} type The type of break line: `nl` for new line and `dl` for dashed line and `el` for equal line
    * @returns {void} Prints the break line to console
    */
    switch (type) {
        case 'nl':
            return console.log('\n');
        case 'dl':
            return console.log('----------------------------------------');
        case 'el':
            return console.log('========================================');
        default:
            return console.log(`\n`);
    }

}

// Set the SQLite DB
const dbPath = path.join(__dirname, 'database', 'main.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(`Error opening database ${dbPath}: ${err.message}`);
        debugLogWriteToFile(`Error opening database ${dbPath}: ${err.message}`);
    } else {
        console.log(`Successfully connected to database ${dbPath}`);
        debugLogWriteToFile(`Successfully connected to database ${dbPath}`);
    }
});

/**
 * Runs database migrations to update the schema of an existing database.
 */
function runMigrations() {
    db.get("PRAGMA user_version;", (err, row) => {
        if (err) {
            return console.error("Error getting database version:", err.message);
        }

        const currentVersion = row.user_version;
        console.log(`Current database version: ${currentVersion}`);

        // --- Migration from Version 0 to Version 1 ---
        // This migration updates the 'excused' table to differentiate between
        // the requester and the processor of an excuse.
        if (currentVersion < 1) {
            console.log("Applying migration to version 1: Updating 'excused' table...");
            db.serialize(() => {
                db.exec(`
                    PRAGMA foreign_keys=off;
                    BEGIN TRANSACTION;

                    -- Rename the old table
                    ALTER TABLE excused RENAME TO excused_old;

                    -- Create the new table with the correct schema
                    CREATE TABLE excused (
                        excused_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        student_id TEXT NOT NULL,
                        requester_staff_id TEXT NOT NULL,
                        processor_admin_id INTEGER,
                        reason TEXT NOT NULL,
                        request_datetime DATETIME NOT NULL,
                        verdict_datetime DATETIME,
                        result TEXT NOT NULL CHECK (result IN ('pending', 'excused', 'rejected')) DEFAULT 'pending',
                        FOREIGN KEY (student_id) REFERENCES students(student_id),
                        FOREIGN KEY (requester_staff_id) REFERENCES staff_accounts(staff_id),
                        FOREIGN KEY (processor_admin_id) REFERENCES admin_login(admin_id)
                    );

                    -- Copy data from the old table to the new one, mapping the columns
                    INSERT INTO excused (excused_id, student_id, requester_staff_id, reason, request_datetime, verdict_datetime, result, processor_admin_id)
                    SELECT excused_id, student_id, staff_id, reason, request_datetime, verdict_datetime, COALESCE(result, 'pending'), processor_admin_id
                    FROM excused_old;

                    DROP TABLE excused_old;
                    PRAGMA user_version = 1;
                    COMMIT;
                `, (err) => {
                    if (err) console.error("Migration to version 1 failed:", err.message);
                    else console.log("Successfully migrated database to version 1.");
                });
            });
        }

        // --- Migration from Version 1 to Version 2 ---
        // This migration adds the sms_provider_settings table.
        if (currentVersion < 2) {
            console.log("Applying migration to version 2: Creating 'sms_provider_settings' table...");
            db.serialize(() => {
                db.exec(`
                    CREATE TABLE IF NOT EXISTS sms_provider_settings (
                        id INTEGER PRIMARY KEY CHECK (id = 1),
                        provider_name TEXT NOT NULL,
                        sender_name TEXT,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                    PRAGMA user_version = 2;
                `, (err) => {
                    if (err) console.error("Migration to version 2 failed:", err.message);
                    else console.log("Successfully migrated database to version 2.");
                });
            });
        }
    });
}

// Run migrations on startup
runMigrations();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
    secret: crypto.randomBytes(64).toString('hex'), // A strong, random secret for signing the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        secure: false, // Set to true if you're using HTTPS
        httpOnly: true // Prevents client-side JS from reading the cookie
    }
}));

// Use static links - This should be high up to be checked first
app.use('/node', express.static(path.join(__dirname, 'node_modules')));
app.use('/shared', express.static(path.join(__dirname, 'runtime', 'shared')));
app.use('/admin/assets', express.static(path.join(__dirname, 'runtime', 'admin', 'assets')));
app.use('/client/assets', express.static(path.join(__dirname, 'runtime', 'client', 'assets')));
app.use('/client', express.static(path.join(__dirname, 'runtime', 'client'))); // Serve client-side JS
app.use('/shared/images', express.static(path.join(__dirname, 'runtime/shared/images')));



// Server start, notify on which port
app.listen(PORT, () => {
    brkln('el');
    console.log(`OpenAttendance Runtime is running on http://localhost:${PORT}`);
    brkln('nl');
    console.log(`OpenAttendance Runtime Admin is running on http://localhost:${PORT}/admin`);
    brkln('el');
});

// Serve pages

app.get('/', (req, res) => {
    // Assuming the user is visiting the client first lol
    // Maybe i overengineered this one lol
    if (argenv.includes('--debug')) {
        const userAgent =  req.headers['user-agent'];
        const isMobile = /mobile/i.test(userAgent);
        let browser;
        function getDeviceType() {
            return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
        }
        function idBrowser() {
            if (userAgent.indexOf("Firefox") > -1) {
                browser = "Firefox"
            } else if (userAgent.indexOf("Chrome") > -1) {
                browser = "Chrome"
            } else {
                browser = "Native or unknown"
            }
        }
        if (getDeviceType()) {
            debugLogWriteToFile(`getDeviceType() called, raw data report: ${getDeviceType()}`);
            device = "mobile"
            debugLogWriteToFile(`getdeviceType() passed to device var: ${device}`)
        } else {
            debugLogWriteToFile(`getDeviceType() called, raw data report: ${getDeviceType()}`);
            device = "desktop"
            debugLogWriteToFile(`getdeviceType() passed to device var: ${device}`);
        }
        idBrowser();
        debugLogWriteToFile(`Some user entered on / page.`);
        debugLogWriteToFile(`Visitor identified as: ${browser}`)
        debugLogWriteToFile(`Providing the index.html at runtime/client/index.html by express...`);
        res.sendFile(path.join(__dirname, 'runtime/client/index.html'));
        debugLogWriteToFile(`express sent the page`)
    } else {
        res.sendFile(path.join(__dirname, 'runtime/client/index.html'));
    }
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/login.html'));
});

app.get('/client/panel', (req, res) => {
    if (req.session.staffId) {
        res.sendFile(path.join(__dirname, 'runtime/client/panel.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/client/excuse', (req, res) => {
    if (req.session.staffId) {
        res.sendFile(path.join(__dirname, 'runtime/client/excuse.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/admin', (req, res) => {
    if (!req.session.adminId) {
        res.redirect('/admin-login');
    } else {
        res.redirect('/admin-panel');
    }
});

app.get('/admin-panel', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/home.html'));
    } else {
        res.redirect('/admin-login');
    }
})

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/admin/index.html'));
})

app.get('/admin-about', (req, res) => {
    if(req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/about.html'));
    } else {
        res.redirect('/admin-login');
    }
})

app.get('/admin-staff', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/staff.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin-students', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/students.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin-attendance', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/attendance.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin-excuses', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/excuses.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin-configuration', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/configuration.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin-advanced', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/advanced.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin-logs', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/system-logs.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/client/my-class', (req, res) => {
    if (req.session.staffId) {
        res.sendFile(path.join(__dirname, 'runtime/client/my-class.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/client-manual-entry', (req, res) => {
    if (req.session.staffId) {
        res.sendFile(path.join(__dirname, 'runtime/client/manual-entry.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/admin/_navbar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/admin/_navbar.html'));
});

app.get('/admin/_sidebar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/admin/_sidebar.html'));
});

app.get('/client/_navbar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/_navbar.html'));
});

app.get('/client/_sidebar.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/_sidebar.html'));
});

// API is here

app.get('/api/admin/accounts', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }
    const sql = 'SELECT admin_id, username, privilege FROM admin_login ORDER BY username ASC';
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Failed to retrieve accounts." });
        res.json(rows || []);
    });
});

// --- System Configuration API ---

// Multer configuration for the school logo
const schoolLogoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, schoolLogoUploadDir);
    },
    filename: function (req, file, cb) {
        // Overwrite the logo with a consistent name to avoid clutter
        cb(null, 'school-logo' + path.extname(file.originalname));
    }
});
const logoUpload = multer({ storage: schoolLogoStorage }).single('school_logo_upload');

// GET /api/admin/configuration - Retrieve the current system configuration
app.get('/api/admin/configuration', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    // There should only ever be one configuration row, with config_id = 1
    const sql = 'SELECT * FROM configurations WHERE config_id = 1';
    db.get(sql, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error retrieving configuration." });
        }
        res.json(row || {}); // Return empty object if no config is set yet
    });
});

// POST /api/admin/configuration - Create or update the system configuration
app.post('/api/admin/configuration', logoUpload, (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { school_name, school_type, address, organization_hotline, country_code } = req.body;
    const logo_path = req.file ? `/shared/images/school_logos/${req.file.filename}` : null;

    if (!school_name || !country_code) {
        return res.status(400).json({ error: "School Name and Country Code are required." });
    }

    // UPSERT logic: Update if exists, Insert if not.
    const sql = `
        INSERT INTO configurations (config_id, school_name, school_type, address, organization_hotline, country_code, logo_directory, created_config_date)
        VALUES (1, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(config_id) DO UPDATE SET
            school_name = excluded.school_name,
            school_type = excluded.school_type,
            address = excluded.address,
            organization_hotline = excluded.organization_hotline,
            country_code = excluded.country_code,
            logo_directory = COALESCE(excluded.logo_directory, configurations.logo_directory)
    `;

    const params = [school_name, school_type, address, organization_hotline, country_code, logo_path];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: "Database error saving configuration.", details: err.message });
        }
        res.status(200).json({ message: "Configuration saved successfully." });
    });
});
app.get('/api/admin/accounts/:id', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }
    const { id } = req.params;
    const sql = 'SELECT admin_id, username, privilege FROM admin_login WHERE admin_id = ?';
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (!row) return res.status(404).json({ error: "Account not found." });
        res.json(row);
    });
});

app.post('/api/admin/accounts', async (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { username, password, privilege } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO admin_login (username, password, privilege) VALUES (?, ?, ?)';
        db.run(sql, [username, hashedPassword, privilege || 'admin'], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'This username is already taken.' });
                }
                return res.status(500).json({ error: "Database error creating account." });
            }
            res.status(201).json({ message: "Admin account created successfully.", adminId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to process password." });
    }
});

app.put('/api/admin/accounts/:id', async (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    const { username, password, privilege } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username is required." });
    }

    let sql, params;
    if (password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            sql = 'UPDATE admin_login SET username = ?, password = ?, privilege = ? WHERE admin_id = ?';
            params = [username, hashedPassword, privilege, id];
        } catch (error) {
            return res.status(500).json({ error: "Failed to process new password." });
        }
    } else {
        sql = 'UPDATE admin_login SET username = ?, privilege = ? WHERE admin_id = ?';
        params = [username, privilege, id];
    }

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'This username is already taken.' });
            }
            return res.status(500).json({ error: "Database error updating account." });
        }
        res.json({ message: "Admin account updated successfully." });
    });
});

app.delete('/api/admin/accounts/:id', (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    if (parseInt(id, 10) === req.session.adminId) {
        return res.status(403).json({ error: "You cannot delete your own account." });
    }

    db.run('DELETE FROM admin_login WHERE admin_id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: "Database error deleting account." });
        if (this.changes === 0) return res.status(404).json({ error: "Account not found." });
        res.json({ message: "Admin account deleted successfully." });
    });
});

// - System Logs api

app.get('/api/admin/logs', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { page = 1, limit = 25, level, source } = req.query;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];

    if (level) {
        whereClauses.push('level = ?');
        params.push(level);
    }
    if (source) {
        whereClauses.push('source = ?');
        params.push(source);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as count FROM system_logs ${whereSql}`;
    const dataSql = `SELECT * FROM system_logs ${whereSql} ORDER BY timestamp DESC LIMIT ? OFFSET ?`;

    db.get(countSql, params, (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error counting logs.", details: err.message });
        }

        const totalLogs = row.count;
        const totalPages = Math.ceil(totalLogs / limit);

        db.all(dataSql, [...params, limit, offset], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Database error retrieving logs.", details: err.message });
            }
            res.json({
                logs: rows,
                pagination: {
                    currentPage: parseInt(page, 10),
                    totalPages: totalPages,
                    totalLogs: totalLogs,
                    limit: parseInt(limit, 10)
                }
            });
        });
    });
});

// DELETE /api/admin/logs - Clear all logs
app.delete('/api/admin/logs', (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    db.run('DELETE FROM system_logs', function(err) {
        if (err) return res.status(500).json({ error: "Database error clearing logs.", details: err.message });
        // Also reset the autoincrement counter for a clean slate
        db.run("DELETE FROM sqlite_sequence WHERE name='system_logs'", () => {
            res.json({ message: `All system logs cleared successfully. ${this.changes} logs were deleted.` });
        });
    });
});

// --- Staff Accounts API ---

// Multer configuration for staff profile images
const staffImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, staffImageUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'staff-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const staffUpload = multer({ storage: staffImageStorage }).single('profile_image');

// GET /api/admin/staff - Retrieve all staff accounts
app.get('/api/admin/staff', (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const sql = `
        SELECT s.id, s.staff_id, s.name, s.email_address, s.staff_type, s.adviser_unit, s.profile_image_path, s.active, sl.username 
        FROM staff_accounts s 
        LEFT JOIN staff_login sl ON s.staff_id = sl.staff_id 
        ORDER BY s.name ASC`;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error retrieving staff accounts." });
        res.json(rows || []);
    });
});

// POST /api/admin/staff - Create a new staff account
app.post('/api/admin/staff', staffUpload, async (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { staff_id, name, email_address, staff_type, adviser_unit, username, password } = req.body;
    const profile_image_path = req.file ? `/client/images/staff_profiles/${req.file.filename}` : null;

    if (!staff_id || !name || !staff_type || !username || !password) {
        return res.status(400).json({ error: "Staff ID, Name, Type, Username, and Password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            const staffSql = `INSERT INTO staff_accounts (staff_id, name, email_address, staff_type, adviser_unit, profile_image_path) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(staffSql, [staff_id, name, email_address, staff_type, adviser_unit, profile_image_path], function(err) {
                if (err) {
                    db.run("ROLLBACK");
                    if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'Staff ID or Email already exists.' });
                    return res.status(500).json({ error: "Database error creating staff profile." });
                }

                const loginSql = `INSERT INTO staff_login (staff_id, username, password) VALUES (?, ?, ?)`;
                db.run(loginSql, [staff_id, username, hashedPassword], function(err) {
                    if (err) {
                        db.run("ROLLBACK");
                        if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'Login username is already taken.' });
                        return res.status(500).json({ error: "Database error creating staff login." });
                    }

                    db.run("COMMIT", (err) => {
                        if (err) return res.status(500).json({ error: "Failed to commit transaction." });
                        res.status(201).json({ message: "Staff account created successfully." });
                    });
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to process password." });
    }
});

// PUT /api/admin/staff/:id - Update a staff account
app.put('/api/admin/staff/:id', async (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params; // This is the staff_accounts.id
    const { staff_id, name, email_address, adviser_unit, password } = req.body;

    // Update profile info
    const profileSql = `UPDATE staff_accounts SET staff_id = ?, name = ?, email_address = ?, adviser_unit = ? WHERE id = ?`;
    db.run(profileSql, [staff_id, name, email_address, adviser_unit, id], async function(err) {
        if (err) return res.status(500).json({ error: "Database error updating staff profile." });

        // If a new password was provided, update the login table
        if (password) {
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                const loginSql = `UPDATE staff_login SET password = ? WHERE staff_id = ?`;
                db.run(loginSql, [hashedPassword, staff_id], (err) => {
                    if (err) return res.status(500).json({ error: "Database error updating password." });
                    res.json({ message: "Staff account and password updated successfully." });
                });
            } catch (error) {
                return res.status(500).json({ error: "Failed to process new password." });
            }
        } else {
            res.json({ message: "Staff account updated successfully." });
        }
    });
});

// DELETE /api/admin/staff/:id - Delete a staff account
app.delete('/api/admin/staff/:id', (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    // Deleting from staff_accounts will cascade and delete from staff_login
    db.run('DELETE FROM staff_accounts WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: "Database error deleting staff account." });
        if (this.changes === 0) return res.status(404).json({ error: "Staff account not found." });
        res.json({ message: "Staff account deleted successfully." });
    });
});

// --- Student Records API ---

// Multer configuration for student profile images
const studentImageUploadDir = path.join(__dirname, 'runtime/shared/images/student_profiles');
const studentImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, studentImageUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const studentUpload = multer({ storage: studentImageStorage }).single('profile_image');

// GET /api/admin/students - Retrieve all student records
app.get('/api/admin/students', (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const sql = `SELECT id, student_id, first_name, middle_name, last_name, phone_number, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, profile_image_path, classroom_section FROM students ORDER BY last_name, first_name ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error retrieving student records." });
        res.json(rows || []);
    });
});

// POST /api/admin/students - Create a new student record
app.post('/api/admin/students', studentUpload, (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { student_id, first_name, middle_name, last_name, phone_number, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, classroom_section } = req.body;
    const profile_image_path = req.file ? `/shared/images/student_profiles/${req.file.filename}` : null;

    if (!student_id || !first_name) {
        return res.status(400).json({ error: "Student ID and First Name are required." });
    }

    const sql = `INSERT INTO students (student_id, first_name, middle_name, last_name, phone_number, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, profile_image_path, classroom_section) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [student_id, first_name, middle_name, last_name, phone_number, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, profile_image_path, classroom_section];

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'A student with this Student ID already exists.' });
            return res.status(500).json({ error: "Database error creating student record." });
        }
        res.status(201).json({ message: "Student record created successfully.", id: this.lastID });
    });
});

// PUT /api/admin/students/:id - Update a student record
app.put('/api/admin/students/:id', studentUpload, (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    const { student_id, first_name, middle_name, last_name, phone_number, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, classroom_section } = req.body;
    const profile_image_path = req.file ? `/shared/images/student_profiles/${req.file.filename}` : null;

    // If a new image is uploaded, we update the path. Otherwise, we don't touch it.
    let sql = `UPDATE students SET student_id = ?, first_name = ?, middle_name = ?, last_name = ?, phone_number = ?, address = ?, emergency_contact_name = ?, emergency_contact_phone = ?, emergency_contact_relationship = ?, classroom_section = ?`;
    let params = [student_id, first_name, middle_name, last_name, phone_number, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, classroom_section];

    if (profile_image_path) {
        sql += `, profile_image_path = ?`;
        params.push(profile_image_path);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: "Database error updating student record." });
        res.json({ message: "Student record updated successfully." });
    });
});

// DELETE /api/admin/students/:id - Delete a student record
app.delete('/api/admin/students/:id', (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: "Database error deleting student record. This may be due to existing attendance records linked to this student." });
        if (this.changes === 0) return res.status(404).json({ error: "Student not found." });
        res.json({ message: "Student record deleted successfully." });
    });
});

// --- Attendance Logs API ---
app.get('/api/admin/attendance-logs', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { dateFrom, dateTo, status, studentSearch } = req.query;

    let whereClauses = [];
    let params = [];

    if (dateFrom) {
        whereClauses.push("log_date >= ?");
        params.push(dateFrom);
    }
    if (dateTo) {
        whereClauses.push("log_date <= ?");
        params.push(dateTo);
    }
    if (status) {
        whereClauses.push("status = ?");
        params.push(status);
    }
    if (studentSearch) {
        whereClauses.push("(s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ?)");
        const searchTerm = `%${studentSearch}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
        SELECT 
            unified_logs.log_id,
            unified_logs.log_date,
            unified_logs.status,
            unified_logs.time_in,
            unified_logs.time_out,
            unified_logs.reason,
            s.first_name || ' ' || s.last_name as student_name,
            s.student_id,
            st.name as logged_by
        FROM (
            SELECT 'p' || present_id as log_id, date(p.time_in, 'localtime') as log_date, 'Present' as status, strftime('%H:%M', p.time_in, 'localtime') as time_in, strftime('%H:%M', p.time_out, 'localtime') as time_out, p.student_id, p.staff_id, 'N/A' as reason FROM present p
            UNION ALL
            SELECT 'a' || absent_id as log_id, date(a.absent_datetime, 'localtime') as log_date, 'Absent' as status, NULL as time_in, NULL as time_out, a.student_id, a.staff_id, a.reason FROM absent a
            UNION ALL
            SELECT 'e' || excused_id as log_id, date(e.request_datetime, 'localtime') as log_date, 'Excused' as status, NULL as time_in, NULL as time_out, e.student_id, e.requester_staff_id as staff_id, e.reason FROM excused e WHERE e.result = 'excused'
        ) as unified_logs
        JOIN students s ON s.student_id = unified_logs.student_id
        LEFT JOIN staff_accounts st ON st.staff_id = unified_logs.staff_id
        ${whereSql}
        ORDER BY unified_logs.log_date DESC, unified_logs.time_in DESC
        LIMIT 100; -- Add a limit to prevent overwhelming the browser with too much data
    `;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Attendance log query error:", err.message);
            return res.status(500).json({ error: "Database error retrieving attendance logs.", details: err.message });
        }
        res.json(rows || []);
    });
});








app.post('/api/ntp', async (req, res) => {
    debugLogWriteToFile("NTP API called");
    // This config is temporary until we figure out how to pull ntp configuration out from the database...
    // For now, we are pulling PAGASA's NTP server, which is on GMT+8:00PM
    const ntpServer = "ntp.pagasa.dost.gov.ph";
    const client = new NTP(ntpServer, 123, {timeout: 5000});

    try {
        debugLogWriteToFile(`Syncing time with NTP server: ${ntpServer}`);
        // The syncTime() method returns the time object upon successful sync.
        const fetchedTime = await client.syncTime();
        
        // Now, fetchedTime is the actual time object.
        debugLogWriteToFile(`NTP time fetched successfully: ${fetchedTime.time}`);
        
        // Send the fetched time back to the client as JSON
        res.status(200).json({ success: true, time: fetchedTime.time });
    } catch (err) {
        debugLogWriteToFile(`Failed to fetch time from ${ntpServer}. Error: ${err.message}`);
        res.status(500).json({ success: false, error: 'Failed to sync with NTP server.', details: err.message });
    }
});

// This is the login for staff on the client page
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        debugLogWriteToFile('Staff login failed: Username or password not provided.');
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Correctly query the staff_login and staff_accounts tables
    const query = `
        SELECT sl.staff_id, sl.password, sa.active
        FROM staff_login sl
        JOIN staff_accounts sa ON sl.staff_id = sa.staff_id
        WHERE sl.username = ?
    `;

    db.get(query, [username], (err, staff) => {
        if (err) {
            debugLogWriteToFile(`DB Error on staff login: ${err.message}`);
            return res.status(500).json({ error: 'Database error during login.' });
        }

        if (!staff || !staff.active) {
            debugLogWriteToFile(`Staff login failed for '${username}': User not found or inactive.`);
            return res.status(401).json({ error: 'Invalid credentials or inactive account.' });
        }

        bcrypt.compare(password, staff.password, (compareErr, isMatch) => {
            if (compareErr) {
                debugLogWriteToFile(`Bcrypt compare error for staff '${username}': ${compareErr.message}`);
                return res.status(500).json({ error: 'Error during password comparison.' });
            }

            if (isMatch) {
                req.session.staffId = staff.staff_id; // Create the staff session
                debugLogWriteToFile(`Staff '${username}' logged in successfully. Session created.`);
                res.json({ success: true, message: 'Login successful.' });
            } else {
                debugLogWriteToFile(`Staff login failed for '${username}': Invalid credentials.`);
                res.status(401).json({ success: false, error: 'Invalid credentials.' });
            }
        });
    });
});

app.post('/api/client/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                debugLogWriteToFile('Client logout failed during session destruction.');
                return res.status(500).json({ error: 'Could not log out.' });
            }
            debugLogWriteToFile('Client session destroyed successfully.');
            res.clearCookie('connect.sid');
            return res.json({ message: 'Logout successful.' });
        });
    } else {
        res.json({ message: 'No active session to log out from.' });
    }
});

// GET /api/client/me - Get details for the currently logged-in staff member
app.get('/api/client/me', (req, res) => {
    if (!req.session.staffId) {
        return res.status(401).json({ error: "Not authenticated." });
    }

    const staffId = req.session.staffId;

    const sql = `
        SELECT 
            s.staff_id, 
            s.name, 
            s.email_address, 
            s.staff_type, 
            s.adviser_unit, 
            s.profile_image_path
        FROM staff_accounts s
        WHERE s.staff_id = ?
    `;

    db.get(sql, [staffId], (err, row) => {
        if (err) {
            debugLogWriteToFile(`DB Error fetching staff profile for ${staffId}: ${err.message}`);
            return res.status(500).json({ error: "Database error fetching staff profile." });
        }
        res.json(row || {});
    });
});

// GET /api/client/my-class-students - Get students for the logged-in teacher's advisory class
app.get('/api/client/my-class-students', (req, res) => {
    if (!req.session.staffId) {
        return res.status(401).json({ error: "Not authenticated." });
    }

    const staffId = req.session.staffId;

    // First, get the teacher's adviser_unit
    db.get('SELECT adviser_unit FROM staff_accounts WHERE staff_id = ? AND staff_type = "teacher"', [staffId], (err, teacher) => {
        if (err) return res.status(500).json({ error: "Database error checking teacher status." });
        if (!teacher || !teacher.adviser_unit) {
            return res.status(403).json({ error: "You are not a teacher with an assigned advisory class." });
        }

        // Then, get all students in that class
        const sql = `
            SELECT 
                id, student_id, first_name, middle_name, last_name, 
                phone_number, address, emergency_contact_name, 
                emergency_contact_phone, emergency_contact_relationship, 
                profile_image_path, classroom_section
            FROM students 
            WHERE classroom_section = ? 
            ORDER BY last_name, first_name
        `;
        db.all(sql, [teacher.adviser_unit], (err, students) => {
            if (err) return res.status(500).json({ error: "Database error fetching students." });
            res.json(students || []);
        });
    });
});

// POST /api/client/excuses - Submit a new excuse request
app.post('/api/client/excuses', (req, res) => {
    if (!req.session.staffId) {
        return res.status(401).json({ error: "Not authenticated." });
    }

    const staffId = req.session.staffId;
    const { student_id, absence_date, reason, approve_now } = req.body;

    if (!student_id || !absence_date || !reason) {
        return res.status(400).json({ error: "Student, date of absence, and reason are required." });
    }

    const now = new Date();
    const requestDateTime = new Date(`${absence_date}T${now.toTimeString().split(' ')[0]}`);
    
    let sql, params;
    if (approve_now) {
        // Teacher is approving their own request on the get-go
        sql = `INSERT INTO excused (student_id, requester_staff_id, reason, request_datetime, result, verdict_datetime, processor_id, processor_type) 
               VALUES (?, ?, ?, ?, 'excused', ?, ?, 'staff')`;
        params = [student_id, staffId, reason, requestDateTime.toISOString(), now.toISOString(), staffId];
    } else {
        // Standard request that goes to pending
        sql = `INSERT INTO excused (student_id, requester_staff_id, reason, request_datetime, result) 
               VALUES (?, ?, ?, ?, 'pending')`;
        params = [student_id, staffId, reason, requestDateTime.toISOString()];
    }

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: "Database error submitting excuse request." });
        res.status(201).json({ message: "Excuse request submitted successfully. It is now pending review by an administrator." });
    });
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        debugLogWriteToFile('Admin login failed: Username or password not provided.');
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const query = 'SELECT admin_id, username, password FROM admin_login WHERE username = ?';
    db.get(query, [username], (err, admin) => {
        if (err) {
            debugLogWriteToFile(`DB Error on admin login: ${err.message}`);
            return res.status(500).json({ error: 'Database error during login.' });
        }

        if (!admin) {
            debugLogWriteToFile(`Admin login failed for user '${username}': Not found.`);
            return res.status(401).json({ error: 'Invalid credentials.' }); // Use a generic error for security
        }

        bcrypt.compare(password, admin.password, (compareErr, isMatch) => {
            if (compareErr) {
                debugLogWriteToFile(`Bcrypt compare error: ${compareErr.message}`);
                return res.status(500).json({ error: 'Error during password comparison.' });
            }

            if (isMatch) {
                req.session.adminId = admin.admin_id; // Create the session
                debugLogWriteToFile(`Admin '${username}' logged in successfully. Session created.`);
                res.json({ success: true, message: 'Login successful. Redirecting...' });
            } else {
                res.status(401).json({ success: false, error: 'Invalid credentials.' });
            }
        });
    });
});

app.get('/api/admin/auth-status', (req, res) => {
    if (req.session && req.session.adminId) {
        // User has a valid session
        res.status(200).json({ authenticated: true });
    } else {
        // No valid session
        res.status(401).json({ authenticated: false });
    }
});

app.post('/api/admin/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                debugLogWriteToFile('Admin logout failed during session destruction.');
                return res.status(500).json({ error: 'Could not log out.' });
            }
            debugLogWriteToFile('Admin session destroyed successfully.');
            res.clearCookie('connect.sid'); // Clean up the cookie on the client
            return res.json({ message: 'Logout successful.' });
        });
    } else {
        res.json({ message: 'No active session to log out from.' });
    }
});

app.get('/api/admin/dashboard-stats', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const queries = {
        totalStudents: 'SELECT COUNT(id) as count FROM students',
        totalStaff: 'SELECT COUNT(id) as count FROM staff_accounts',
        todaysAttendance: "SELECT COUNT(DISTINCT student_id) as count FROM present WHERE date(time_in, 'localtime') = date('now', 'localtime')",
        todaysAbsences: "SELECT COUNT(DISTINCT student_id) as count FROM absent WHERE date(absent_datetime, 'localtime') = date('now', 'localtime')",
        todaysExcused: "SELECT COUNT(DISTINCT student_id) as count FROM excused WHERE result = 'excused' AND date(request_datetime, 'localtime') = date('now', 'localtime')",
        weeklyTrend: `
            SELECT 
                strftime('%w', time_in, 'localtime') as day_of_week, 
                COUNT(DISTINCT student_id) as count 
            FROM present 
            WHERE date(time_in, 'localtime') >= date('now', '-6 days', 'localtime') 
            GROUP BY day_of_week`,
        monthlyOverview: `
            SELECT 
                strftime('%Y-%W', date, 'localtime') as week,
                SUM(CASE WHEN type = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN type = 'absent' THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN type = 'excused' THEN 1 ELSE 0 END) as excused_count
            FROM (
                SELECT time_in as date, 'present' as type, student_id FROM present
                UNION ALL
                SELECT absent_datetime as date, 'absent' as type, student_id FROM absent
                UNION ALL
                SELECT request_datetime as date, 'excused' as type, student_id FROM excused WHERE result = 'excused'
            )
            WHERE date(date, 'localtime') >= date('now', 'start of month', 'localtime')
            GROUP BY week
            ORDER BY week`
    };

    const promises = Object.entries(queries).map(([key, sql]) => {
        return new Promise((resolve, reject) => {
            db.all(sql, [], (err, rows) => {
                if (err) return reject(err);
                // For single-count queries, simplify the result
                if (key.startsWith('total') || key.startsWith('todays')) {
                    resolve({ [key]: rows[0]?.count || 0 });
                } else {
                    resolve({ [key]: rows });
                }
            });
        });
    });

    Promise.all(promises)
        .then(results => {
            const combinedResults = results.reduce((acc, current) => ({ ...acc, ...current }), {});
            res.json(combinedResults);
        })
        .catch(err => res.status(500).json({ error: "Database error fetching dashboard stats.", details: err.message }));
});

// --- System Logs API ---

// GET /api/admin/logs - Retrieve logs with filtering and pagination
app.get('/api/admin/logs', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { page = 1, limit = 25, level, source } = req.query;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];

    if (level) {
        whereClauses.push('level = ?');
        params.push(level);
    }
    if (source) {
        whereClauses.push('source = ?');
        params.push(source);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as count FROM system_logs ${whereSql}`;
    const dataSql = `SELECT * FROM system_logs ${whereSql} ORDER BY timestamp DESC LIMIT ? OFFSET ?`;

    db.get(countSql, params, (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error counting logs.", details: err.message });
        }

        const totalLogs = row.count;
        const totalPages = Math.ceil(totalLogs / limit);

        db.all(dataSql, [...params, limit, offset], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Database error retrieving logs.", details: err.message });
            }
            res.json({
                logs: rows,
                pagination: {
                    currentPage: parseInt(page, 10),
                    totalPages: totalPages,
                    totalLogs: totalLogs,
                    limit: parseInt(limit, 10)
                }
            });
        });
    });
});

// POST /api/admin/logs - Create a new log entry
app.post('/api/admin/logs', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { level = 'INFO', message, source, details } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Log 'message' is required." });
    }

    const sql = 'INSERT INTO system_logs (level, message, source, details) VALUES (?, ?, ?, ?)';
    db.run(sql, [level, message, source, details], function(err) {
        if (err) return res.status(500).json({ error: "Database error creating log.", details: err.message });
        res.status(201).json({ message: "Log entry created successfully.", logId: this.lastID });
    });
});

// DELETE /api/admin/logs - Clear all logs
app.delete('/api/admin/logs', (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    db.run('DELETE FROM system_logs', function(err) {
        if (err) return res.status(500).json({ error: "Database error clearing logs.", details: err.message });
        // Also reset the autoincrement counter for a clean slate
        db.run("DELETE FROM sqlite_sequence WHERE name='system_logs'", () => {
            res.json({ message: `All system logs cleared successfully. ${this.changes} logs were deleted.` });
        });
    });
});

// GET /api/admin/excuses - Retrieve excuse requests with filtering
app.get('/api/admin/excuses', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { status } = req.query;
    let sql = `
        SELECT 
            e.excused_id, e.student_id, e.requester_staff_id, e.reason, e.request_datetime, e.verdict_datetime, e.result,
            s.first_name || ' ' || s.last_name as student_name,
            req_sa.name as requester_name,
            CASE 
                WHEN e.processor_type = 'admin' THEN proc_admin.username
                WHEN e.processor_type = 'staff' THEN proc_staff.name
                ELSE NULL 
            END as processed_by
        FROM excused e
        LEFT JOIN students s ON e.student_id = s.student_id
        LEFT JOIN staff_accounts req_sa ON e.requester_staff_id = req_sa.staff_id
        LEFT JOIN admin_login proc_admin ON e.processor_id = proc_admin.admin_id AND e.processor_type = 'admin'
        LEFT JOIN staff_accounts proc_staff ON e.processor_id = proc_staff.staff_id AND e.processor_type = 'staff'
    `;
    let params = [];
    if (status) {
        sql += ' WHERE e.result = ?';
        params.push(status);
    }
    sql += ' ORDER BY e.request_datetime DESC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Excuse query error:", err.message);
            return res.status(500).json({ error: "Database error retrieving excuse requests.", details: err.message });
        }
        res.json(rows || []);
    });
});

// POST /api/admin/excuses/:id/:action - Approve or reject an excuse request
app.post('/api/admin/excuses/:id/:action', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { id, action } = req.params;
    const adminId = req.session.adminId; // Use the actual admin ID from the session
    const verdictTime = new Date().toISOString();

    let result;
    if (action === 'approve') {
        result = 'excused'; // Matches the new schema
    } else if (action === 'reject') {
        result = 'rejected'; // Matches the new schema
    } else {
        return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'." });
    }

    const sql = `
        UPDATE excused 
        SET result = ?, verdict_datetime = ?, processor_id = ?, processor_type = 'admin'
        WHERE excused_id = ?
    `;
    db.run(sql, [result, verdictTime, adminId, id], function(err) {
        if (err) {
            console.error("Excuse update error:", err.message);
            return res.status(500).json({ error: `Database error while processing excuse request.`, details: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Excuse request not found." });
        }
        res.json({ message: `Excuse request ${action}ed successfully.` });
    });
});

// --- New Endpoints for Student Lookup ---

// GET /api/client/classrooms - Get a unique list of all classroom sections
app.get('/api/client/classrooms', (req, res) => {
    if (!req.session.staffId) return res.status(401).json({ error: "Not authenticated." });

    const sql = `SELECT DISTINCT classroom_section FROM students WHERE classroom_section IS NOT NULL ORDER BY classroom_section`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error fetching classrooms." });
        res.json(rows.map(r => r.classroom_section));
    });
});

// GET /api/client/students/search - Search for students with filters
app.get('/api/client/students/search', (req, res) => {
    if (!req.session.staffId) return res.status(401).json({ error: "Not authenticated." });

    const { term, classroom } = req.query;

    let sql = `
        SELECT 
            id, student_id, first_name, middle_name, last_name, 
            phone_number, address, emergency_contact_name, 
            emergency_contact_phone, emergency_contact_relationship, 
            profile_image_path, classroom_section
        FROM students
    `;
    
    const whereClauses = [];
    const params = [];

    if (term) {
        whereClauses.push(`(first_name LIKE ? OR last_name LIKE ? OR student_id LIKE ?)`);
        const searchTerm = `%${term}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    if (classroom) {
        whereClauses.push(`classroom_section = ?`);
        params.push(classroom);
    }

    if (whereClauses.length > 0) sql += ` WHERE ${whereClauses.join(' AND ')}`;
    sql += ' ORDER BY last_name, first_name LIMIT 50';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error searching students.", details: err.message });
        res.json(rows || []);
    });
});

// --- System Information API ---

// GET /api/admin/system-info - Retrieve OS and hardware information
app.get('/api/admin/system-info', async (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    try {
        const cpus = os.cpus();
        const diskSpace = await checkDiskSpace('/'); // Check the root drive

        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const systemInfo = {
            os: `${os.type()} ${os.platform()} ${os.arch()} - ${os.release()}`,
            nodeVersion: process.version,
            cpu: `${cpus[0].model} (${cpus.length} cores)`,
            memory: {
                total: formatBytes(os.totalmem()),
                free: formatBytes(os.freemem()),
            },
            storage: {
                total: formatBytes(diskSpace.size),
                free: formatBytes(diskSpace.free),
            }
        };

        res.json(systemInfo);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve system information.", details: error.message });
    }
});

// --- New Endpoints for "My Class" Page ---

// GET /api/client/students/:studentId/attendance - Get stats and excuses for a single student
app.get('/api/client/students/:studentId/attendance', (req, res) => {
    if (!req.session.staffId) return res.status(401).json({ error: "Not authenticated." });

    const { studentId } = req.params;

    const queries = {
        stats: `
            SELECT
                (SELECT COUNT(*) FROM present WHERE student_id = ?) as present_count,
                (SELECT COUNT(*) FROM absent WHERE student_id = ?) as absent_count,
                (SELECT COUNT(*) FROM excused WHERE student_id = ? AND result = 'excused') as excused_count
        `,
        excuses: `
            SELECT excused_id, reason, request_datetime, result 
            FROM excused 
            WHERE student_id = ? AND result = 'pending'
            ORDER BY request_datetime DESC
        `
    };

    Promise.all([
        new Promise((resolve, reject) => db.get(queries.stats, [studentId, studentId, studentId], (err, row) => err ? reject(err) : resolve(row))),
        new Promise((resolve, reject) => db.all(queries.excuses, [studentId], (err, rows) => err ? reject(err) : resolve(rows)))
    ]).then(([stats, excuses]) => {
        res.json({ stats, excuses });
    }).catch(err => {
        res.status(500).json({ error: "Database error fetching student attendance data.", details: err.message });
    });
});

// POST /api/client/excuses/:id/:action - Teacher approves/rejects an excuse
app.post('/api/client/excuses/:id/:action', (req, res) => {
    if (!req.session.staffId) return res.status(401).json({ error: "Not authenticated." });
    // This reuses the admin logic, but sets the processor_type to 'staff'
    req.session.adminId = req.session.staffId; // Temporarily use staffId as adminId for the logic
    req.body.processor_type = 'staff'; // Add a flag for the logic
    // The logic for approving/rejecting is nearly identical to the admin one.
    // For simplicity in this context, we can assume a similar implementation.
    // A real implementation would refactor the shared logic into a single function.
    const verdictTime = new Date().toISOString();
    const { id, action } = req.params;
    const result = action === 'approve' ? 'excused' : 'rejected';
    const sql = `UPDATE excused SET result = ?, verdict_datetime = ?, processor_id = ?, processor_type = 'staff' WHERE excused_id = ?`;
    db.run(sql, [result, verdictTime, req.session.staffId, id], function(err) {
        if (err) return res.status(500).json({ error: "Database error processing excuse." });
        res.json({ message: `Excuse request ${action}d successfully.` });
    });
});





// GET /api/admin/sms-configuration - Retrieve non-sensitive SMS settings
app.get('/api/admin/sms-configuration', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    // Read from the database
    const sql = 'SELECT provider_name, sender_name FROM sms_provider_settings WHERE id = 1';
    db.get(sql, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error retrieving SMS configuration." });
        }
        
        const apiKey = process.env.SMS_API_KEY;
        let maskedApiKey = null;
        if (apiKey && apiKey.length > 8) {
            // Show first 4 and last 4 characters for confirmation
            maskedApiKey = `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
        } else if (apiKey) {
            maskedApiKey = 'Key is set (too short to mask)';
        }

        res.json({
            provider_name: row?.provider_name || 'semaphore',
            sender_name: row?.sender_name || '',
            // For now, the API address is hardcoded as we only support Semaphore
            api_address: 'https://api.semaphore.co/api/v4/messages',
            // Send a masked version of the key for display purposes
            masked_api_key: maskedApiKey,
            is_api_key_set: !!apiKey
        });
    });
});

// POST /api/admin/sms-configuration - Save SMS settings
app.post('/api/admin/sms-configuration', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { api_key, sender_name } = req.body;

    // --- Update .env file ---
    if (api_key) {
        const envPath = path.join(__dirname, '.env');
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        const lines = envContent.split('\n');
        const apiKeyIndex = lines.findIndex(line => line.startsWith('SMS_API_KEY='));

        if (apiKeyIndex !== -1) {
            lines[apiKeyIndex] = `SMS_API_KEY="${api_key}"`;
        } else {
            lines.push(`SMS_API_KEY="${api_key}"`);
        }
        fs.writeFileSync(envPath, lines.join('\n'));
        process.env.SMS_API_KEY = api_key; // Update running process
    }

    // --- Update database ---
    const sql = `INSERT INTO sms_provider_settings (id, provider_name, sender_name, updated_at) VALUES (1, 'semaphore', ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(id) DO UPDATE SET sender_name = excluded.sender_name, updated_at = CURRENT_TIMESTAMP`;
    db.run(sql, [sender_name], (err) => {
        if (err) {
            return res.status(500).json({ error: "Database error saving SMS settings." });
        }
        res.status(200).json({ message: "SMS configuration saved successfully." });
    });
});

// --- Advanced Database Management API ---

// GET /api/admin/database/backups - List all available backups
app.get('/api/admin/database/backups', async (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    try {
        const files = await fs.promises.readdir(backupsDir);
        const backupDetails = await Promise.all(
            files
                .filter(file => file.endsWith('.db'))
                .map(async (file) => {
                    const filePath = path.join(backupsDir, file);
                    const stats = await fs.promises.stat(filePath);
                    return {
                        filename: file,
                        createdAt: stats.birthtime,
                        size: stats.size, // size in bytes
                    };
                })
        );

        // Sort by creation date, newest first
        backupDetails.sort((a, b) => b.createdAt - a.createdAt);

        res.json(backupDetails);
    } catch (error) {
        console.error("Error listing backups:", error);
        res.status(500).json({ error: "Failed to list database backups." });
    }
});

// POST /api/admin/database/backup - Create a new database backup
app.post('/api/admin/database/backup', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
    const backupFilename = `main-backup-${timestamp}.db`;
    const backupFilePath = path.join(backupsDir, backupFilename);

    fs.copyFile(dbPath, backupFilePath, (err) => {
        if (err) {
            console.error("Error creating backup:", err);
            return res.status(500).json({ error: "Failed to create database backup." });
        }
        res.status(201).json({ message: `Backup '${backupFilename}' created successfully.` });
    });
});

// GET /api/admin/database/backups/:filename - Download a specific backup
app.get('/api/admin/database/backups/:filename', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { filename } = req.params;
    // Sanitize filename to prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(backupsDir, safeFilename);

    // Check if file exists to prevent errors
    if (fs.existsSync(filePath)) {
        res.download(filePath, safeFilename, (err) => {
            if (err) {
                console.error("Error downloading backup:", err);
                res.status(500).send("Could not download the file.");
            }
        });
    } else {
        res.status(404).send("File not found.");
    }
});

// DELETE /api/admin/database/backups/:filename - Delete a specific backup
app.delete('/api/admin/database/backups/:filename', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(backupsDir, safeFilename);

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error("Error deleting backup:", err);
            return res.status(500).json({ error: "Failed to delete the backup file. It may have already been deleted." });
        }
        res.json({ message: `Backup '${safeFilename}' deleted successfully.` });
    });
});

// Error relations here at the very bottom
// See MizProject Private Ticket issue: #2
// Forbidden page
app.get('/forbidden', (req, res) => {
    debugLogWriteToFile(`Someone is trying to access the forbidden page...`)
    // First, check if the device is mobile or desktop
    const userAgent = req.headers['user-agent'];
    const isMobile = /mobile/i.test(userAgent);

    if (isMobile) {
        // Serve the Framework7 version
        return res.sendFile(path.join(__dirname, 'runtime/shared/html/mobile/forbidden.html'));
    } else {
        // Serve the Bulma version
        return res.sendFile(path.join(__dirname, 'runtime/shared/html/desktop/forbidden.html'));
    }
})

// Catch-all for 404 Not Found errors
// This should be the last route handler to catch any unmatched requests.
app.use((req, res, next) => {
    debugLogWriteToFile(`someone is tring to access ${req.originalUrl} /ip: ${req.ip} /ips: ${req.ips} /host: ${req.host}`)
    const error = {
        code: 404,
        title: 'Page Not Found',
        message: `The page you requested at '${req.originalUrl}' could not be found.`
    };
    // Redirect to the forbidden page with 404 error details
    debugLogWriteToFile(`redirect to forbidden with error code embedded in the URL`);
    res.redirect(`/forbidden?code=${error.code}&title=${encodeURIComponent(error.title)}&message=${encodeURIComponent(error.message)}`);
});
